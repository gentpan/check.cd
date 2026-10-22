// CheckCC 的检测信号配置，用于声明各风险信号的启用状态、所属信号组、来源、权重和展示顺序。
// 权重代表该信号命中时对总风险分的贡献上限，0 权重表示纯信息展示。
import type { SignalCategory } from "../types";
import type { DetectionSignalConfig } from "./types";

export const signalConfig: Record<string, DetectionSignalConfig> = {
  // ── 网络与出口（服务端 IPinfo 情报 + WebRTC 路径观察）────────────────
  country: { enabled: true, labelKey: "country", source: "server", category: "network", weight: 20, order: 10 },
  ipAddress: { enabled: true, labelKey: "ipAddress", source: "server", category: "network", weight: 0, order: 20 },
  ipType: { enabled: true, labelKey: "ipType", source: "server", category: "network", weight: 8, order: 30 },
  ipMarks: { enabled: true, labelKey: "ipMarks", source: "server", category: "network", weight: 12, order: 40 },
  aiSubscription: { enabled: true, labelKey: "aiSubscription", source: "server", category: "network", weight: 6, order: 50 },
  proxyCountry: { enabled: true, labelKey: "proxyCountry", source: "browser", category: "network", weight: 10, order: 60 },

  // ── 浏览器身份 ──────────────────────────────────────────────────────
  userAgent: { enabled: true, labelKey: "userAgent", source: "browser", category: "browser", weight: 0, order: 110 },
  clientProfile: { enabled: true, labelKey: "clientProfile", source: "browser", category: "browser", weight: 0, order: 115 },
  language: { enabled: true, labelKey: "language", source: "browser", category: "browser", weight: 0, order: 120 },
  languageVariant: { enabled: true, labelKey: "languageVariant", source: "browser", category: "browser", weight: 0, order: 130 },
  locale: { enabled: true, labelKey: "locale", source: "browser", category: "browser", weight: 0, order: 140 },
  timezone: { enabled: true, labelKey: "timezone", source: "browser", category: "browser", weight: 0, order: 150 },
  timezoneOffset: { enabled: true, labelKey: "timezoneOffset", source: "browser", category: "browser", weight: 0, order: 160 },
  emojiStyle: { enabled: true, labelKey: "emojiStyle", source: "browser", category: "browser", weight: 0, order: 170 },

  // ── 设备指纹 ────────────────────────────────────────────────────────
  screen: { enabled: true, labelKey: "screen", source: "browser", category: "device", weight: 0, order: 210 },
  viewport: { enabled: true, labelKey: "viewport", source: "browser", category: "device", weight: 0, order: 215 },
  hardware: { enabled: true, labelKey: "hardware", source: "browser", category: "device", weight: 0, order: 220 },
  touch: { enabled: true, labelKey: "touch", source: "browser", category: "device", weight: 0, order: 230 },
  chineseFonts: { enabled: true, labelKey: "chineseFonts", source: "browser", category: "device", weight: 0, order: 240 },
  vendorFonts: { enabled: true, labelKey: "vendorFonts", source: "browser", category: "device", weight: 0, order: 250 },
  canvasFp: { enabled: true, labelKey: "canvasFp", source: "browser", category: "device", weight: 0, order: 260 },
  webgl: { enabled: true, labelKey: "webgl", source: "browser", category: "device", weight: 0, order: 270 },
  audioFp: { enabled: true, labelKey: "audioFp", source: "browser", category: "device", weight: 0, order: 280 },

  // ── 运行时与自动化 ───────────────────────────────────────────────────
  automation: { enabled: true, labelKey: "automation", source: "browser", category: "runtime", weight: 12, order: 310 },
  permissions: { enabled: true, labelKey: "permissions", source: "browser", category: "runtime", weight: 0, order: 320 },
  plugins: { enabled: true, labelKey: "plugins", source: "browser", category: "runtime", weight: 0, order: 330 },
  storage: { enabled: true, labelKey: "storage", source: "browser", category: "runtime", weight: 0, order: 340 },

  // ── 一致性校验 ───────────────────────────────────────────────────────
  langTz: { enabled: true, labelKey: "langTz", source: "combined", category: "consistency", weight: 0, order: 410 },
  tzIp: { enabled: true, labelKey: "tzIp", source: "combined", category: "consistency", weight: 0, order: 420 },
  uaPlatform: { enabled: true, labelKey: "uaPlatform", source: "browser", category: "consistency", weight: 0, order: 430 },
  glOs: { enabled: true, labelKey: "glOs", source: "browser", category: "consistency", weight: 0, order: 440 },
};

export const signalCategoryOrder: SignalCategory[] = ["network", "browser", "device", "runtime", "consistency"];
