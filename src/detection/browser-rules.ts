// Pure, conservative interpretation of browser-reported values.
import { countryTimezones } from "./config/country-timezones";

export function languageVariant(languages: readonly string[]): "simplified" | "traditional" | null {
  // Use the first explicit script/region preference. Plain zh does not identify a script.
  for (const language of languages) {
    const tag = language.replaceAll("_", "-").toLowerCase();
    if (!/^zh(?:-|$)/.test(tag)) continue;
    if (/(?:^|-)hant(?:-|$)/.test(tag)) return "traditional";
    if (/(?:^|-)hans(?:-|$)/.test(tag)) return "simplified";
    if (/(?:^|-)(tw|hk|mo)(?:-|$)/.test(tag)) return "traditional";
    if (/(?:^|-)(cn|sg)(?:-|$)/.test(tag)) return "simplified";
  }
  return null;
}

export function timezoneOffset(timezone: string, date = new Date()): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longOffset" }).formatToParts(date);
    const value = parts.find((part) => part.type === "timeZoneName")?.value;
    if (value === "GMT") return 0;
    const match = value?.match(/^GMT([+-])(\d{2}):(\d{2})$/);
    return match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) + Number(match[3]) / 60) : null;
  } catch {
    return null;
  }
}

export function countryOffsets(country: string, date = new Date()): number[] | null {
  const zones = countryTimezones[country.toUpperCase()];
  if (!zones?.length) return null;
  const offsets = zones.map((zone) => timezoneOffset(zone, date));
  // An old Intl database may not recognize a new IANA zone. Do not claim a mismatch
  // with incomplete country coverage.
  if (offsets.some((offset) => offset === null)) return null;
  return [...new Set(offsets as number[])].sort((a, b) => a - b);
}

export function rendererSystemConflict(renderer: string, os: string): boolean | null {
  if (!renderer || !["Windows", "macOS", "iOS", "Android", "HarmonyOS", "Linux"].includes(os)) return null;
  // Renderer vendors cross platform (Apple Silicon Linux, Windows ARM, Intel Macs,
  // remote GPUs); they do not identify an OS. Only explicit OS names are compared.
  if (/\b(?:direct3d(?:9|11|12)?|d3d11|d3d12)\b/i.test(renderer)) return os === "Windows" ? false : true;
  if (/\bandroid\b/i.test(renderer)) return os === "Android" || os === "HarmonyOS" ? false : true;
  return null;
}
