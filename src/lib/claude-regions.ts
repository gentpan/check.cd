// 审核过的地区资料快照。未来生效的公告不直接作为当前规则使用。
import countries from "@/i18n/countries.json";
const ANNOUNCED_ALLOWED = new Set([
  "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BE", "BZ", "BJ", "BT", "BO", "BA",
  "BW", "BR", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "CF", "TD", "CL", "CO", "KM", "CD", "CG", "CR", "CI", "HR",
  "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FJ", "FI", "FR", "GA", "GM", "GE",
  "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IQ", "IE", "IL", "IT", "JM", "JP",
  "JO", "KZ", "KE", "KI", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MG", "MW", "MY", "MV", "ML",
  "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG",
  "MK", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "RO", "RW", "KN", "LC", "VC", "WS",
  "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SO", "SB", "ZA", "KR", "SS", "ES", "LK", "SD", "SR", "SE",
  "CH", "TW", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TV", "UG", "UA", "AE", "GB", "US", "UY", "UZ",
  "VU", "VA", "VN", "ZM", "ZW",
]);

export const CLAUDE_REGION_POLICY = {
  checkedAt: "2026-10-17",
  version: "2026-10-17-reviewed",
  currentSources: {
    claude: "https://support.claude.com/en/articles/8461763-where-can-i-access-claude",
    api: "https://platform.claude.com/docs/en/api/supported-regions",
  },
  announced: {
    version: "2026-11-12-announced",
    effectiveAt: "2026-11-12",
    status: "announced" as const,
    source: "https://www.anthropic.com/legal/supported-regions",
  },
  // 当前产品文档没有列入，而未来公告已列入；未审核解决前不下明确结论。
  conflictCodes: ["CF", "CD", "ER", "ET", "LY", "ML", "NI", "SO", "SS", "SD"],
} as const;

const CONFLICT_CODES = new Set<string>(CLAUDE_REGION_POLICY.conflictCodes);
export const CLAUDE_ALLOWED = new Set([...ANNOUNCED_ALLOWED].filter((code) => !CONFLICT_CODES.has(code)));

export const CLAUDE_BLOCKED_HIGHLIGHT = ["CN", "HK", "MO", "RU", "BY", "IR", "KP", "SY", "CU", "VE", "MM", "AF", "YE"];

const UKRAINE_CURRENT_API_EXCLUDED = /crimea|donetsk|luhansk|крым|донецк|луганск|克里米亚|克里米亞|顿涅茨克|頓涅茨克|卢甘斯克|盧甘斯克/i;
const UKRAINE_ANNOUNCED_EXCLUDED = /kherson|zaporiz|херсон|запорож|赫尔松|赫爾松|扎波罗|扎波羅/i;

export type ClaudeAccess = "allowed" | "blocked" | "unknown";
export type ClaudeRegionOptions = { product?: "claude" | "api"; asOf?: string | Date };

export function claudeAccess(countryCode: string | null | undefined, regionName?: string | null, options: ClaudeRegionOptions = {}): ClaudeAccess {
  if (typeof countryCode !== "string" || !/^[a-z]{2}$/i.test(countryCode)) return "unknown";
  const code = countryCode.toUpperCase();
  // 无法识别的国家代码、未建模的领土或数据商占位值不等于不支持。
  if (!Object.hasOwn(countries.en, code)) return "unknown";
  if (options.asOf !== undefined) {
    const timestamp = options.asOf instanceof Date ? options.asOf.getTime() : new Date(options.asOf).getTime();
    if (!Number.isFinite(timestamp) || timestamp < Date.parse(`${CLAUDE_REGION_POLICY.checkedAt}T00:00:00Z`)) return "unknown";
  }
  if (CONFLICT_CODES.has(code)) return "unknown";
  if (code === "UA" && regionName) {
    if (UKRAINE_CURRENT_API_EXCLUDED.test(regionName)) return options.product === "api" ? "blocked" : "unknown";
    if (UKRAINE_ANNOUNCED_EXCLUDED.test(regionName)) return "unknown";
  }
  // announced 版本即使到达生效日也不自动切换，须人工核对产品页面再发布审核版本。
  return CLAUDE_ALLOWED.has(code) ? "allowed" : "blocked";
}

const localeTag = { zh: "zh-CN", "zh-HK": "zh-HK", ru: "ru", en: "en" } as const;

export function countryName(code: string, locale: keyof typeof localeTag) {
  return (countries[locale] as Record<string, string>)[code.toUpperCase()] ?? code;
}

export function orderedCountries(locale: keyof typeof localeTag) {
  return Object.keys(countries[locale]).filter((code) => CLAUDE_ALLOWED.has(code));
}
