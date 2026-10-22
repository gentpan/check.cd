// Query an explicitly selected visitor address through IPinfo's documented API.
// No /me lookup: a server-side /me response would identify this server's exit.
import { createHash } from "node:crypto";
import { normalizePublicIp, samePublicIp } from "../lib/public-ip.ts";
import { resolveVisitorIp } from "../lib/network-observation.ts";

export type IpPurityFlag = "vpn" | "proxy" | "residentialProxy" | "tor" | "datacenter" | "mobile" | "abuser";
export type IpInfoError = "unconfigured" | "provider-auth" | "provider-rate-limit" | "provider-unavailable" | "provider-invalid" | "timeout";
export type IpPuritySource = {
  provider: "ipinfo" | "request";
  status: "live" | "cached" | "unconfigured" | "error";
  fetchedAt: string | null;
  expiresAt: string | null;
  error?: IpInfoError;
};
export type IpSource = "socket" | "trusted-header" | "user-input";
export type IpPurityReport = {
  ok: true;
  ip: string;
  ipSource: IpSource;
  source: IpPuritySource;
  hostname: string | null;
  location: string;
  countryCode: string | null;
  regionName: string | null;
  asn: string | null;
  asnName: string | null;
  isp: string | null;
  networkType: string | null;
  ipType: string | null;
  nativeLabel: string | null;
  score: number | null;
  grade: string | null;
  riskScore: number | null;
  aiSubscription: "safe" | "caution" | "risk" | null;
  flags: IpPurityFlag[];
  flagChecks: Record<IpPurityFlag, boolean | null>;
  anonymous: boolean | null;
  dimensions: Record<"identity" | "anonymity" | "abuse" | "blacklist" | "attack" | "local", number | null>;
} | {
  ok: false;
  reason?: "visitor-ip-unavailable" | "invalid-address";
};

type SuccessReport = Extract<IpPurityReport, { ok: true }>;
type IpInfoTier = "lite" | "core" | "plus" | "max";
const CACHE_MS = 5 * 60_000;
const MAX_CACHE = 500;
const cache = new Map<string, { expires: number; report: SuccessReport }>();
const pending = new Map<string, Promise<SuccessReport>>();

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 512) : null;
}
function boolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function emptyReport(ip: string, ipSource: IpSource, source: IpPuritySource): SuccessReport {
  return {
    ok: true, ip, ipSource, source,
    hostname: null, location: "", countryCode: null, regionName: null,
    asn: null, asnName: null, isp: null, networkType: null, ipType: null,
    nativeLabel: null, score: null, grade: null, riskScore: null, aiSubscription: null,
    flags: [],
    flagChecks: { vpn: null, proxy: null, residentialProxy: null, tor: null, datacenter: null, mobile: null, abuser: null },
    anonymous: null,
    dimensions: { identity: null, anonymity: null, abuse: null, blacklist: null, attack: null, local: null },
  };
}

export function mapIpInfoReport(value: unknown, requestedIp: string, ipSource: IpSource, fetchedAt: number): SuccessReport | null {
  const data = object(value);
  const ip = normalizePublicIp(requestedIp);
  if (!ip || typeof data.ip !== "string" || !samePublicIp(data.ip, ip) || data.bogon === true || data.error) return null;
  const geo = object(data.geo);
  const network = object(data.as);
  const anonymous = object(data.anonymous);
  const report = emptyReport(ip, ipSource, {
    provider: "ipinfo", status: "live", fetchedAt: new Date(fetchedAt).toISOString(),
    expiresAt: new Date(fetchedAt + CACHE_MS).toISOString(),
  });
  const country = text(geo.country_code) ?? text(data.country_code);
  report.countryCode = country && /^[A-Z]{2}$/i.test(country) && !/^(ZZ|XX)$/i.test(country) ? country.toUpperCase() : null;
  report.hostname = text(data.hostname);
  report.location = [...new Set([text(geo.city), text(geo.region), text(geo.country) ?? text(data.country)].filter(Boolean))].join(" · ");
  report.regionName = [text(geo.region), text(geo.city)].filter(Boolean).join(" ") || null;
  const asn = text(network.asn) ?? text(data.asn);
  report.asn = asn && /^(?:AS)?\d+$/i.test(asn) ? `AS${asn.replace(/^AS/i, "")}` : null;
  report.asnName = text(network.name) ?? text(data.as_name);
  report.networkType = text(network.type);
  report.flagChecks = {
    vpn: boolean(anonymous.is_vpn), proxy: boolean(anonymous.is_proxy),
    residentialProxy: boolean(anonymous.is_res_proxy), tor: boolean(anonymous.is_tor),
    datacenter: boolean(data.is_hosting), mobile: boolean(data.is_mobile), abuser: null,
  };
  // A specific positive, including a relay, is evidence of anonymization even
  // when the aggregate field is absent. Never infer false from missing fields.
  const anonymousPositive = [anonymous.is_vpn, anonymous.is_proxy, anonymous.is_tor, anonymous.is_relay, anonymous.is_res_proxy].some((item) => item === true);
  report.anonymous = anonymousPositive ? true : boolean(data.is_anonymous);
  report.flags = (Object.keys(report.flagChecks) as IpPurityFlag[]).filter((key) => report.flagChecks[key] === true);
  report.ipType = report.flagChecks.tor ? "Tor" : report.flagChecks.vpn ? "VPN" : report.flagChecks.proxy || report.flagChecks.residentialProxy ? "Proxy" : report.flagChecks.datacenter ? "IDC" : report.flagChecks.mobile ? "Mobile" : null;
  // IPinfo does not return a purity score, blacklist/attack score, native-IP
  // verdict or AI eligibility. Missing values must remain unknown, never zero.
  return report;
}

function failure(ip: string, ipSource: IpSource, error: IpInfoError): SuccessReport {
  return emptyReport(ip, ipSource, { provider: error === "unconfigured" ? "request" : "ipinfo", status: error === "unconfigured" ? "unconfigured" : "error", fetchedAt: null, expiresAt: null, error });
}

function tierFromEnvironment(): IpInfoTier | null {
  const tier = process.env.IPINFO_TIER || "lite";
  return ["lite", "core", "plus", "max"].includes(tier) ? tier as IpInfoTier : null;
}

async function requestIpInfo(ip: string, ipSource: IpSource, token: string, tier: IpInfoTier): Promise<SuccessReport> {
  try {
    const response = await fetch(`https://api.ipinfo.io/${tier === "lite" ? "lite" : "lookup"}/${encodeURIComponent(ip)}`, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) return failure(ip, ipSource, response.status === 401 || response.status === 403 ? "provider-auth" : response.status === 429 ? "provider-rate-limit" : "provider-unavailable");
    // Do not return upstream error bodies, request headers, or API tokens.
    const raw = await response.text();
    if (raw.length > 128_000) return failure(ip, ipSource, "provider-invalid");
    return mapIpInfoReport(JSON.parse(raw), ip, ipSource, Date.now()) ?? failure(ip, ipSource, "provider-invalid");
  } catch (error) {
    return failure(ip, ipSource, error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "timeout" : error instanceof SyntaxError ? "provider-invalid" : "provider-unavailable");
  }
}

export async function lookupAddress(ip: string, locale: string, ipSource: IpSource = "user-input"): Promise<IpPurityReport> {
  const canonical = normalizePublicIp(ip);
  if (!canonical) return { ok: false, reason: "invalid-address" };
  const token = process.env.IPINFO_TOKEN?.trim();
  const tier = tierFromEnvironment();
  if (!token || !tier) return failure(canonical, ipSource, "unconfigured");
  // Separate targets, locales, credentials and source types. Canonicalization
  // joins equivalent IPv6 spellings without reusing another visitor's result.
  const key = `${canonical}|${locale}|${tier}|${ipSource}|${createHash("sha256").update(token).digest("hex")}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) return { ...cached.report, source: { ...cached.report.source, status: "cached" } };
  cache.delete(key);
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const task = requestIpInfo(canonical, ipSource, token, tier).then((report) => {
    if (report.source.status === "live") {
      for (const [cacheKey, entry] of cache) if (entry.expires <= Date.now()) cache.delete(cacheKey);
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: Date.parse(report.source.expiresAt!), report });
    }
    return report;
  }).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}

export async function lookupVisitorPurity(locale: string): Promise<IpPurityReport> {
  try {
    const { getRequestHeaders, getRequestIP } = await import("@tanstack/react-start/server");
    const visitor = resolveVisitorIp(getRequestHeaders(), getRequestIP({ xForwardedFor: false }), process.env.TRUST_PROXY_HEADER);
    if (!visitor) return { ok: false, reason: "visitor-ip-unavailable" };
    return lookupAddress(visitor.ip, locale, visitor.source);
  } catch {
    return { ok: false, reason: "visitor-ip-unavailable" };
  }
}
