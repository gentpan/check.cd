// Opt-in, read-only checks of this machine's current network. Not an accuracy
// benchmark and not a browser/WebRTC test. Ordinary `pnpm test` does not run it.
// node --env-file=.env.local scripts/live-network-check.mjs --live
import https from "node:https";
import dgram from "node:dgram";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createHash, randomBytes } from "node:crypto";
import { normalizePublicIp } from "../src/lib/public-ip.ts";
import { lookupAddress } from "../src/server/ip-purity.ts";

if (!process.argv.includes("--live")) {
  console.log(JSON.stringify({ status: "skip", usage: "node --env-file=.env.local scripts/live-network-check.mjs --live", note: "Makes low-frequency external HTTP and UDP requests only with --live." }));
  process.exit(0);
}

const reveal = process.argv.includes("--include-addresses");
const describe = (ip) => {
  const canonical = normalizePublicIp(ip);
  if (!canonical) return null;
  return {
    address: reveal ? canonical : canonical.includes(":") ? `${canonical.split(":").slice(0, 2).join(":")}:…` : `${canonical.split(".").slice(0, 2).join(".")}.…`,
    addressId: createHash("sha256").update(canonical).digest("hex").slice(0, 16),
    family: canonical.includes(":") ? 6 : 4,
  };
};
const safeError = (error) => typeof error?.code === "string" && /^[A-Z_0-9]+$/.test(error.code) ? error.code : error?.name === "TimeoutError" ? "TIMEOUT" : "REQUEST_FAILED";

function httpObservation(family) {
  const endpoint = family === 4 ? "https://api.ipify.org?format=json" : "https://api6.ipify.org?format=json";
  const started = Date.now();
  return new Promise((resolve) => {
    let settled = false;
    let request;
    let transportFamily = null;
    const finish = (value) => { if (settled) return; settled = true; clearTimeout(timer); resolve({ kind: "https", endpoint, requestedFamily: family, transportFamily, elapsedMs: Date.now() - started, ...value }); };
    const timer = setTimeout(() => { finish({ status: "timeout", reason: "TIMEOUT" }); request?.destroy(); }, 6_000);
    request = https.get(endpoint, { family, timeout: 6_000, agent: false, headers: { accept: "application/json" } }, (response) => {
      let body = "";
      if (response.statusCode !== 200) { response.resume(); finish({ status: "error", reason: `HTTP_${response.statusCode}` }); return; }
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; if (body.length > 2048) { response.destroy(); finish({ status: "error", reason: "OVERSIZED_RESPONSE" }); } });
      response.on("error", (error) => finish({ status: "error", reason: safeError(error) }));
      response.on("end", () => {
        try {
          const ip = normalizePublicIp(JSON.parse(body).ip);
          if (!ip || (ip.includes(":") ? 6 : 4) !== family) return finish({ status: "error", reason: "INVALID_FAMILY_OR_ADDRESS" });
          finish({ status: "observed", ip });
        } catch { finish({ status: "error", reason: "INVALID_RESPONSE" }); }
      });
    });
    request.on("socket", (socket) => socket.on("connect", () => { transportFamily = socket.remoteFamily === "IPv6" && !socket.remoteAddress?.startsWith("::ffff:") ? 6 : 4; }));
    request.on("timeout", () => { finish({ status: "timeout", reason: "TIMEOUT" }); request.destroy(); });
    request.on("error", (error) => finish({ status: "error", reason: safeError(error) }));
  });
}

function stunObservation(host, port, family) {
  const started = Date.now();
  const transaction = randomBytes(12);
  const packet = Buffer.alloc(20);
  packet.writeUInt16BE(0x0001, 0);
  packet.writeUInt32BE(0x2112a442, 4);
  transaction.copy(packet, 8);
  return new Promise((resolve) => {
    let settled = false;
    let transportFamily = null;
    let endpointResolution = null;
    const socket = dgram.createSocket(family === 4 ? "udp4" : "udp6");
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.close(); } catch { /* The socket may have failed before binding. */ }
      resolve({ kind: "udp-stun", endpoint: `${host}:${port}`, requestedFamily: family, transportFamily, endpointResolution, elapsedMs: Date.now() - started, ...value });
    };
    const timer = setTimeout(() => finish({ status: "timeout", reason: "NO_MATCHING_STUN_RESPONSE" }), 3_500);
    socket.on("error", (error) => finish({ status: "error", reason: safeError(error) }));
    socket.on("message", (message) => {
      if (message.length < 20 || message.readUInt32BE(4) !== 0x2112a442 || !message.subarray(8, 20).equals(transaction)) return;
      if (message.readUInt16BE(0) !== 0x0101) return finish({ status: "error", reason: "STUN_PROTOCOL_ERROR" });
      const end = 20 + message.readUInt16BE(2);
      if (end > message.length) return;
      for (let offset = 20; offset + 4 <= end;) {
        const type = message.readUInt16BE(offset);
        const length = message.readUInt16BE(offset + 2);
        const value = message.subarray(offset + 4, offset + 4 + length);
        if (offset + 4 + length > end) return;
        if ((type === 0x0020 || type === 0x0001) && length >= 8) {
          const addressFamily = value[1];
          const bytes = addressFamily === 1 ? 4 : addressFamily === 2 ? 16 : 0;
          if (!bytes || length < 4 + bytes) return;
          const address = Buffer.from(value.subarray(4, 4 + bytes));
          if (type === 0x0020) for (let i = 0; i < bytes; i++) address[i] ^= packet[4 + i];
          const literal = bytes === 4 ? [...address].join(".") : Array.from({ length: 8 }, (_, i) => address.readUInt16BE(i * 2).toString(16)).join(":");
          const ip = normalizePublicIp(literal);
          if (ip) finish({ status: "observed", ip });
          return;
        }
        offset += 4 + length + ((4 - length % 4) % 4);
      }
      finish({ status: "error", reason: "NO_PUBLIC_MAPPED_ADDRESS" });
    });
    dnsLookup(host, { family }).then(({ address }) => {
      if (settled) return;
      if (isIP(address) !== family) return finish({ status: "error", reason: "DNS_FAMILY_MISMATCH" });
      endpointResolution = /^198\.(18|19)\./.test(address) ? "benchmark-range-possible-fake-ip" : normalizePublicIp(address) ? "public" : "special-purpose";
      socket.connect(port, address, () => {
        if (settled) return;
        const remote = socket.remoteAddress();
        transportFamily = remote.family === "IPv6" && !remote.address.startsWith("::ffff:") ? 6 : 4;
        try { socket.send(packet, (error) => { if (error) finish({ status: "error", reason: safeError(error) }); }); }
        catch (error) { finish({ status: "error", reason: safeError(error) }); }
      });
    }).catch((error) => finish({ status: "error", reason: safeError(error) }));
  });
}

const proxyEnvironmentPresent = Object.fromEntries(["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"].map((name) => [name, Boolean(process.env[name])]));
const routingContext = { proxyEnvironmentPresent, nativeDirectConnection: "not-established", projectDns: [] };
let dnsTimer;
try {
  const addresses = await Promise.race([dnsLookup("check.cd", { all: true }), new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3_000); })]);
  routingContext.projectDns = addresses.map(({ address, family }) => ({ family, classification: /^198\.(18|19)\./.test(address) ? "benchmark-range-possible-fake-ip" : normalizePublicIp(address) ? "public" : "special-purpose" }));
} catch { routingContext.projectDns = [{ status: "unavailable" }]; }
finally { clearTimeout(dnsTimer); }
const observations = await Promise.all([
  httpObservation(4), httpObservation(6),
  stunObservation("stun.cloudflare.com", 3478, 4), stunObservation("stun.cloudflare.com", 3478, 6),
  stunObservation("stun.l.google.com", 19302, 4), stunObservation("stun.l.google.com", 19302, 6),
]);
const addresses = [...new Set(observations.filter((item) => item.status === "observed").map((item) => item.ip))];
const provider = { configured: Boolean(process.env.IPINFO_TOKEN?.trim()), tier: process.env.IPINFO_TIER || "lite", status: "skip", reason: "IPINFO_TOKEN_MISSING", samples: [] };
if (provider.configured) {
  provider.status = "pass";
  provider.reason = null;
  // At most one query per distinct current-machine observed address.
  for (const ip of addresses.slice(0, 6)) {
    const result = await lookupAddress(ip, "en");
    const passed = result.ok && (result.source.status === "live" || result.source.status === "cached");
    if (!passed) provider.status = "fail";
    provider.samples.push(result.ok ? { ...describe(ip), status: passed ? "pass" : "fail", observationStatus: result.source.status, error: result.source.error ?? null, countryCode: result.countryCode, asn: result.asn, privacyFieldsAvailable: Object.values(result.flagChecks).filter((value) => value !== null).length, anonymous: result.anonymous, flags: result.flags, score: result.score, fetchedAt: result.source.fetchedAt } : { ...describe(ip), status: "fail", reason: result.reason });
  }
  if (!addresses.length) { provider.status = "skip"; provider.reason = "NO_CURRENT_MACHINE_ADDRESS_OBSERVED"; }
}
const http4 = observations.find((item) => item.kind === "https" && item.requestedFamily === 4 && item.status === "observed")?.ip;
const http6 = observations.find((item) => item.kind === "https" && item.requestedFamily === 6 && item.status === "observed")?.ip;
console.log(JSON.stringify({
  observedAt: new Date().toISOString(), sampleScope: "one-current-machine-network-only",
  routingContext,
  browserWebRtcTested: false, physicalNetworkCount: "not-established",
  observations: observations.map(({ ip, status, ...item }) => {
    const observed = ip ? describe(ip) : null;
    const familyMatched = observed?.family === item.requestedFamily && item.transportFamily === item.requestedFamily;
    return { ...item, status: status === "observed" && familyMatched ? "pass" : "fail", observationStatus: status, ...(status === "observed" && !familyMatched ? { reason: "REQUESTED_PUBLIC_ADDRESS_FAMILY_NOT_OBSERVED" } : {}), ...(observed ?? {}) };
  }),
  comparisons: observations.filter((item) => item.kind === "udp-stun" && item.status === "observed").map((item) => {
    const family = item.ip.includes(":") ? 6 : 4;
    const httpIp = family === 4 ? http4 : http6;
    return { endpoint: item.endpoint, requestedFamily: item.requestedFamily, addressFamily: family, httpAddressAvailable: Boolean(httpIp), sameAsHttps: httpIp ? item.ip === httpIp : null };
  }),
  ipinfo: provider,
  limits: ["Pass means an observation completed, not that a network or provider verdict is ground truth.", "A timeout does not prove that IPv6 or UDP is universally blocked.", "Command-line UDP STUN is not browser ICE and cannot verify browser privacy settings.", "Proxy environment absence does not rule out a system proxy, VPN, TUN, NAT64, or Fake-IP routing.", "One machine cannot establish cross-ISP, cellular, VPN, or physical multi-network accuracy.", "IPinfo fields depend on the configured plan; missing fields and absent scores remain unknown."],
}, null, 2));
