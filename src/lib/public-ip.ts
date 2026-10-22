// Literal validation only; it does not establish that a public address is routed.
// Special-purpose exclusions: IANA IPv4/IPv6 Special-Purpose Address Registries.
function ipv4Parts(ip: string): number[] | null {
  if (!/^(?:(?:0|[1-9]\d{0,2})\.){3}(?:0|[1-9]\d{0,2})$/.test(ip)) return null;
  const parts = ip.split(".").map(Number);
  return parts.some((part) => part > 255) ? null : parts;
}

function publicV4(parts: number[]) {
  const [a, b, c, d] = parts;
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    // The two globally reachable anycasts are exceptions to 192.0.0.0/24.
    (a === 192 && b === 0 && c === 0 && d !== 9 && d !== 10) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function ipv6Canonical(ip: string): string | null {
  if (!/^[\da-f:.]+$/i.test(ip)) return null;
  try {
    // The URL parser implements IPv6 syntax, including compression constraints.
    return new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  } catch {
    return null;
  }
}

function ipv6Groups(canonical: string): number[] {
  const [left, right] = canonical.split("::");
  const first = left ? left.split(":").map((part) => parseInt(part, 16)) : [];
  const last = right ? right.split(":").map((part) => parseInt(part, 16)) : [];
  return right === undefined ? first : [...first, ...Array(8 - first.length - last.length).fill(0), ...last];
}

export function normalizePublicIp(ip: string): string | null {
  if (typeof ip !== "string" || ip !== ip.trim() || ip.length > 45 || ip.includes("%")) return null;
  if (!ip.includes(":")) {
    const parts = ipv4Parts(ip);
    return parts && publicV4(parts) ? parts.join(".") : null;
  }
  const canonical = ipv6Canonical(ip);
  if (!canonical) return null;
  const [a, b, c, d, e, f, g, h] = ipv6Groups(canonical);
  if (a < 0x2000 || a > 0x3fff) return null;
  if (a === 0x3fff && b < 0x1000) return null; // RFC 9637, 3fff::/20.
  if (a === 0x2001 && b === 0xdb8) return null;
  if (a === 0x2001 && b < 0x200) {
    // IETF protocol assignments are not ordinary global unicast. Keep the
    // explicit globally reachable allocations in the IANA registry.
    const anycast = b === 1 && c === 0 && d === 0 && e === 0 && f === 0 && g === 0 && h >= 1 && h <= 3;
    const assigned = b === 3 || (b === 4 && c === 0x112) || (b >= 0x20 && b <= 0x3f);
    if (!anycast && !assigned) return null;
  }
  return canonical;
}

export function isPublicIp(ip: string): boolean {
  return normalizePublicIp(ip) !== null;
}

export function samePublicIp(first: string, second: string): boolean {
  const canonical = normalizePublicIp(first);
  return canonical !== null && canonical === normalizePublicIp(second);
}

// Node may expose an IPv4 socket peer using the IPv4-mapped IPv6 notation.
// Normalize that transport representation without accepting mapped literals in
// user-supplied lookup addresses or WebRTC results.
export function publicSocketIp(value: string | undefined): string | null {
  if (!value) return null;
  if (value.includes(":")) {
    const canonical = ipv6Canonical(value);
    if (!canonical) return null;
    const groups = ipv6Groups(canonical);
    if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
      return normalizePublicIp([groups[6] >>> 8, groups[6] & 255, groups[7] >>> 8, groups[7] & 255].join("."));
    }
  }
  return normalizePublicIp(value);
}
