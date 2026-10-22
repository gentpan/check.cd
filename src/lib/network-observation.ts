import { normalizePublicIp, publicSocketIp, samePublicIp } from "./public-ip.ts";

export type NetworkObservation = { ip: string; countryCode: string | null; asn?: string | null };
export type TrustedIpHeader = "x-real-ip" | "cf-connecting-ip" | "x-forwarded-for";
type HeadersLike = Headers | Record<string, string | string[] | undefined>;

export function resolveVisitorIp(headers: HeadersLike, socketIp: string | undefined, trustedHeader?: string) {
  if (!trustedHeader) {
    const ip = publicSocketIp(socketIp);
    return ip ? { ip, source: "socket" as const } : null;
  }
  if (!["x-real-ip", "cf-connecting-ip", "x-forwarded-for"].includes(trustedHeader)) return null;
  let value: string | string[] | undefined | null;
  if (typeof (headers as Headers).get === "function") value = (headers as Headers).get(trustedHeader);
  else value = Object.entries(headers).find(([name]) => name.toLowerCase() === trustedHeader)?.[1];
  // An enabled trusted edge must replace this header with exactly one address.
  // Do not pick the first public entry from an attacker-controlled proxy chain.
  if (typeof value !== "string" || value.includes(",")) return null;
  const ip = normalizePublicIp(value.trim());
  return ip ? { ip, source: "trusted-header" as const } : null;
}

export function isLikelyDualStack(visitor: NetworkObservation, observed: NetworkObservation): boolean {
  return Boolean(normalizePublicIp(visitor.ip)
    && normalizePublicIp(observed.ip)
    && visitor.countryCode
    && visitor.countryCode.toUpperCase() === observed.countryCode?.toUpperCase()
    && visitor.ip.includes(":") !== observed.ip.includes(":"));
}

export function compareNetworkObservation(visitor: NetworkObservation, observed: NetworkObservation) {
  if (!normalizePublicIp(visitor.ip) || !normalizePublicIp(observed.ip)) return "unknown" as const;
  if (samePublicIp(visitor.ip, observed.ip)) return "same" as const;
  // Even if countries disagree, dual-stack addresses alone do not prove a
  // leak: geolocation, anycast and UDP/HTTPS routing can differ independently.
  if (visitor.ip.includes(":") !== observed.ip.includes(":")) return "possible-dual-stack" as const;
  return "additional-route" as const;
}
