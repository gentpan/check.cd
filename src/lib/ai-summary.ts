// 浏览器可调用的 AI 总结生成，以及 localStorage 缓存。
// 缓存键 = IP + 全部检测结果的哈希（见 hashSummaryPayload）：只按 IP 会在共享出口下串号，只按环境会在换 IP 后过期。
import { createServerFn } from "@tanstack/react-start";
import type { AiSummaryResult, SummaryPayload } from "@/server/ai-summary";
import { validateSummaryPayload } from "./input-validation";

export type { AiSummaryResult, SummaryPayload };

export const fetchAiSummary = createServerFn({ method: "POST" })
  .validator(validateSummaryPayload)
  .handler(async ({ data }): Promise<AiSummaryResult> => {
    const { generateSummary } = await import("@/server/ai-summary");
    return generateSummary(data);
  });

export type CachedSummary = { digest: string; text: string; source: "ai" | "template"; at: number };

const TTL_MS = 24 * 60 * 60 * 1000;

function cacheKey(locale: string) {
  return `cc:ai-summary:${locale}`;
}

// cyrb53 字符串哈希，够快也够分散。
function cyrb53(input: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}

export function hashSummaryPayload(payload: unknown): string {
  return cyrb53(JSON.stringify(payload));
}

export function readSummaryCache(locale: string): CachedSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSummary;
    if (typeof parsed.digest !== "string" || typeof parsed.text !== "string" || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSummaryCache(locale: string, entry: CachedSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(locale), JSON.stringify(entry));
  } catch {
    // 存储不可用时静默降级为每次生成
  }
}
