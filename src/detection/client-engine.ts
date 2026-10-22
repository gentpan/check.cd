// CheckCC 的浏览器检测核心工具，用于采集环境快照、提供共享探针和信号构造工具。
import { detectionConfig, getSignalConfig, getSignalWeight, type DetectionConfig } from "./config";
import type { DetectorLocaleText } from "./locale";
import type { RegionCode, SignalResult } from "./types";
export { isPublicIp } from "@/lib/public-ip";

export type SignalView = SignalResult & { state?: "pending" | "running" | "done"; verdict?: import("./types").SignalVerdict };
export type BrowserIpIntel = { ip: string; location: string; country: string; asn: string; org: string };
export type BrowserEnvironmentSnapshot = {
  languages: string[];
  timezone: string | null;
  locale: string | null;
  userAgent: string;
  platform?: string;
  brands: string;
  mobile?: boolean;
  touchPoints?: number;
};

// 跨插件共享的运行时探针缓存，一致性插件会读取设备指纹插件写入的结果。
export type DetectionProbes = {
  webgl?: { vendor: string | null; renderer: string | null; unmaskedVendor: string | null; unmaskedRenderer: string | null } | null;
  canvas?: { ok: boolean; length: number } | null;
  audio?: { ok: boolean; latency: number | null; sampleRate: number | null } | null;
};

export const regions: Array<{ code: RegionCode | "hk" }> = [{ code: "auto" }, { code: "cn" }, { code: "hk" }, { code: "ru" }];

export function normalizeRegion(code: RegionCode | "hk"): RegionCode {
  return code === "hk" ? "auto" : code;
}

export const defaultSignals: SignalView[] = Object.entries(detectionConfig.signals)
  .filter(([, config]) => config.enabled)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([id, config]) => ({ id, label: config.labelKey, value: null, score: 0, weight: config.weight, contribution: 0, source: config.source, category: config.category }));

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function animateProgress(from: number, to: number, setProgress: (value: number) => void, setActiveSignal: (value: number) => void) {
  const frames = 4;
  for (let i = 1; i <= frames; i += 1) {
    const value = Math.round(from + ((to - from) * i) / frames);
    setProgress(value);
    setActiveSignal(Math.min(defaultSignals.length - 1, Math.floor((value / 100) * defaultSignals.length)));
    await sleep(22);
  }
}

export function makeSignal(id: string, label: string, value: string | null, fallbackWeight: number, matched: boolean, text: DetectorLocaleText, config: DetectionConfig): SignalResult {
  return makeSignalScore(id, label, value, fallbackWeight, matched ? 1 : 0, text, config);
}

export function makeSignalScore(id: string, label: string, value: string | null, fallbackWeight: number, score: number, text: DetectorLocaleText, config: DetectionConfig): SignalResult {
  const available = Boolean(value?.trim()) && Number.isFinite(score);
  const normalized = available ? Math.max(0, Math.min(1, score)) : 0;
  const weight = getSignalWeight(id, fallbackWeight, config);
  const meta = getSignalConfig(id, config);
  return { id, label, value: value || text.unknown, score: normalized, weight, contribution: Math.round(normalized * weight), source: meta?.source ?? "browser", category: meta?.category ?? "browser", availability: available ? "available" : "unavailable", evidence: "observed" };
}

export function unavailableSignal(id: string, label: string, value: string | null, text: DetectorLocaleText, config: DetectionConfig): SignalResult {
  return { ...makeSignalScore(id, label, value, 0, 0, text, config), availability: "unavailable", score: 0, contribution: 0 };
}

export async function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([task, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Detection timed out")), Math.max(1, timeoutMs));
    })]);
  } finally {
    clearTimeout(timer);
  }
}

export function hasFont(font: string): boolean | null {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const text = "\u4e2d\u6587\u5b57\u4f53\u68c0\u6d4bABCabc012";
    return ["monospace", "sans-serif", "serif"].some((base) => {
      ctx.font = `72px ${base}`;
      const baseWidth = ctx.measureText(text).width;
      ctx.font = `72px \"${font}\", ${base}`;
      return Math.abs(ctx.measureText(text).width - baseWidth) > 0.5;
    });
  } catch { return null; }
}

export function matchAny(value: string, patterns: string[]) {
  const lower = value.toLowerCase();
  return patterns.find((pattern) => lower.includes(pattern.toLowerCase())) ?? null;
}

export function localizeSignalValue(value: string | null, text: DetectorLocaleText) {
  if (!value) return value;
  return text.valueMap[value] ?? value;
}

export function detectBrowserName(ua: string, text: DetectorLocaleText) {
  if (/MicroMessenger/i.test(ua)) return text.signalValues.wechatBrowser;
  if (/Edg(?:e|A|iOS)?\//i.test(ua)) return "Microsoft Edge";
  if (/OPR\/|OPiOS\//i.test(ua)) return "Opera";
  if (/YaBrowser/i.test(ua)) return "Yandex Browser";
  if (/Firefox\/|FxiOS\//i.test(ua)) return "Firefox";
  if (/Chromium\//i.test(ua)) return "Chromium";
  if (/Chrome\/|CriOS\//i.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return text.signalValues.unknownBrowser;
}

export function detectOS(ua: string, platform: string | undefined, text: DetectorLocaleText, touchPoints = 0) {
  const probe = `${ua} ${platform ?? ""}`;
  if (/harmonyos/i.test(probe)) return "HarmonyOS";
  if (/android/i.test(probe)) return "Android";
  if (/iphone|ipad|ios/i.test(probe)) return "iOS";
  if (/macintosh|macintel/i.test(probe) && touchPoints > 1) return "iOS";
  if (/mac os|macintosh|macintel/i.test(probe)) return "macOS";
  if (/windows nt/i.test(probe)) return "Windows";
  if (/linux/i.test(probe)) return "Linux";
  return platform || text.signalValues.unknownSystem;
}

export function detectDeviceName(ua: string, platform: string | undefined, text: DetectorLocaleText, touchPoints = 0) {
  const os = detectOS(ua, platform, text, touchPoints);
  if (/iphone/i.test(ua)) return `iPhone / ${os}`;
  if (/ipad/i.test(ua)) return `iPad / ${os}`;
  if (os === "iOS" && /macintosh|macintel/i.test(`${ua} ${platform ?? ""}`)) return `iPad / ${os}`;
  if (/android/i.test(ua)) return `${text.signalValues.androidDevice} / ${os}`;
  if (/macintosh|mac os|macintel/i.test(`${ua} ${platform ?? ""}`)) return `Mac / ${os}`;
  if (/windows/i.test(ua)) return `Windows PC / ${os}`;
  if (/linux/i.test(ua)) return `${text.signalValues.linuxDevice} / ${os}`;
  return os;
}

export function collectBrowserEnvironment(text: DetectorLocaleText): BrowserEnvironmentSnapshot {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; brands?: Array<{ brand: string; version: string }>; mobile?: boolean } };
  const read = <T>(get: () => T, fallback: T): T => { try { return get(); } catch { return fallback; } };
  const intl = read(() => Intl.DateTimeFormat().resolvedOptions(), null);
  return {
    languages: read(() => navigator.languages?.length ? [...navigator.languages] : [navigator.language].filter(Boolean), []),
    timezone: intl?.timeZone || null,
    locale: intl?.locale || null,
    userAgent: read(() => navigator.userAgent, ""),
    platform: read(() => nav.userAgentData?.platform, undefined) || read(() => nav.platform, undefined),
    brands: read(() => nav.userAgentData?.brands?.filter((item) => !/not.*brand/i.test(item.brand)).map((item) => item.brand).join(" / ") || text.signalValues.noBrands, text.signalValues.noBrands),
    mobile: read(() => nav.userAgentData?.mobile, undefined),
    touchPoints: read(() => nav.maxTouchPoints, undefined),
  };
}

export function signalsScore(signals: SignalResult[]) {
  return signals.reduce((sum, signal) => sum + (signal.availability !== "unavailable" && Number.isFinite(signal.contribution) && signal.contribution > 0 ? signal.contribution : 0), 0);
}
