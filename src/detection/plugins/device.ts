// CheckCC 的设备指纹检测插件，用于采集屏幕、硬件、字体、Canvas、WebGL 和音频等终端环境信号。
import { hasFont, makeSignal, makeSignalScore, unavailableSignal, withTimeout } from "../client-engine";
import type { DetectionPlugin } from "../plugin";

const SC_FONTS = ["Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "STHeiti", "STSong", "SimSun", "SimHei", "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei"];
const TC_FONTS = ["Microsoft JhengHei", "PingFang TC", "Heiti TC", "Hiragino Sans CNS", "Noto Sans CJK TC", "Source Han Sans TC", "MingLiU", "PMingLiU"];
const VENDOR_FONTS = ["MiSans", "HarmonyOS Sans", "OPPO Sans", "vivo Sans", "Honor Sans", "Alibaba PuHuiTi", "WPS Fangzheng", "FZLanTingHeiS"];

function webglProbe() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as (WebGLRenderingContext & { getParameter(p: number): unknown; getExtension(name: string): unknown }) | null;
    if (!gl) return null;
    const info = gl.getExtension("WEBGL_debug_renderer_info") as { UNMASKED_VENDOR_WEBGL: number; UNMASKED_RENDERER_WEBGL: number } | null;
    return {
      vendor: String(gl.getParameter(gl.VENDOR) ?? "") || null,
      renderer: String(gl.getParameter(gl.RENDERER) ?? "") || null,
      unmaskedVendor: info ? String(gl.getParameter(info.UNMASKED_VENDOR_WEBGL) ?? "") || null : null,
      unmaskedRenderer: info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "") || null : null,
    };
  } catch {
    return null;
  }
}

function canvasProbe() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, length: 0 };
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(10, 10, 120, 40);
    ctx.fillStyle = "#069";
    ctx.font = '16px "Arial", sans-serif';
    ctx.fillText("CheckCC fp 🎨", 12, 32);
    ctx.strokeStyle = "#1a7";
    ctx.arc(70, 30, 18, 0, Math.PI * 2);
    ctx.stroke();
    const data = canvas.toDataURL();
    return { ok: data.startsWith("data:image/") && data.length > 32, length: data.length };
  } catch {
    return { ok: false, length: 0 };
  }
}

async function audioProbe(timeoutMs: number) {
  let oscillator: OscillatorNode | undefined;
  let compressor: DynamicsCompressorNode | undefined;
  try {
    const Ctor = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Ctor) return { ok: false, latency: null, sampleRate: null };
    const ctx = new Ctor(1, 44100, 44100);
    oscillator = ctx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = 1000;
    compressor = ctx.createDynamicsCompressor();
    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);
    const rendered = await withTimeout(ctx.startRendering(), timeoutMs);
    const data = rendered.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) sum += Math.abs(data[i]);
    const sampleRate = rendered.sampleRate;
    // Do not open a live audio device just to read baseLatency. This offline
    // context's requested sample rate is not the physical device's sample rate.
    return { ok: Number.isFinite(sum) && sum > 0, latency: null, sampleRate };
  } catch {
    return { ok: false, latency: null, sampleRate: null };
  } finally {
    try { oscillator?.disconnect(); compressor?.disconnect(); } catch { /* Context already released. */ }
  }
}

export const deviceFingerprintPlugin: DetectionPlugin = {
  id: "device-fingerprint",
  titleKey: "device",
  source: "browser",
  category: "device",
  defaultWeight: 0,
  signalIds: ["screen", "viewport", "hardware", "touch", "chineseFonts", "vendorFonts", "canvasFp", "webgl", "audioFp"],
  async run({ text, config, browser, probes }) {
    const labels = text.signalLabels;
    const value = text.signalValues;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const signals = [];
    const read = <T>(get: () => T, fallback: T): T => { try { return get(); } catch { return fallback; } };

    const screenValue = read(() => window.screen?.width > 0 && window.screen?.height > 0 ? `${window.screen.width}×${window.screen.height} CSS px · ${window.screen.colorDepth}bit · DPR${window.devicePixelRatio || 1}` : null, null);
    signals.push(makeSignal("screen", labels.screen, screenValue, 0, false, text, config));
    const viewport = read(() => window.innerWidth > 0 && window.innerHeight > 0 ? `${window.innerWidth}×${window.innerHeight}` : null, null);
    signals.push(makeSignal("viewport", labels.viewport, viewport, 0, false, text, config));

    const cores = read(() => nav.hardwareConcurrency, 0) ?? 0;
    const memory = read(() => nav.deviceMemory, 0) ?? 0;
    const hardwareValue = `${text.signalValues.cores.replace("{n}", String(cores || "?"))} · ${memory ? `${memory}GB${text.signalValues.cores.includes("逻辑") ? "（近似）" : " (approx.)"}` : value.memoryUnknown}`;
    const hardwareScore = (cores > 0 && cores <= 2 ? 0.5 : 0) + (memory > 0 && memory <= 2 ? 0.2 : 0);
    signals.push(cores > 0 || memory > 0 ? { ...makeSignalScore("hardware", labels.hardware, hardwareValue, 0, Math.min(1, hardwareScore), text, config), evidence: "inferred" as const } : unavailableSignal("hardware", labels.hardware, hardwareValue, text, config));

    const coarse = read(() => typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : null, null);
    const touchPoints = read(() => nav.maxTouchPoints, undefined);
    const touchValue = `${value.touchPoints.replace("{n}", String(touchPoints ?? "?"))} · ${coarse === null ? text.unknown : coarse ? value.touchCoarse : value.touchFine}`;
    const desktopOs = /windows|mac os|macintosh|linux x86|x11/i.test(browser.userAgent);
    const touchScore = desktopOs && (touchPoints ?? 0) > 0 ? 0.4 : 0;
    signals.push(typeof touchPoints === "number" ? makeSignalScore("touch", labels.touch, touchValue, 0, touchScore, text, config) : unavailableSignal("touch", labels.touch, touchValue, text, config));

    const fonts = [...SC_FONTS, ...TC_FONTS, ...VENDOR_FONTS].map((font) => [font, hasFont(font)] as const);
    const fontsAvailable = fonts.every(([, found]) => found !== null);
    const foundFonts = new Set(fonts.filter(([, found]) => found === true).map(([font]) => font));
    const scFonts = SC_FONTS.filter((font) => foundFonts.has(font));
    const tcFonts = TC_FONTS.filter((font) => foundFonts.has(font));
    const vendorFonts = VENDOR_FONTS.filter((font) => foundFonts.has(font));
    const fontValue = [scFonts.length ? `${value.scFonts}：${scFonts.join(" / ")}` : "", tcFonts.length ? `${value.tcFonts}：${tcFonts.join(" / ")}` : ""].filter(Boolean).join(" · ") || value.noFonts;
    const fontScore = scFonts.length ? Math.min(1, 0.75 + 0.08 * scFonts.length) : tcFonts.length ? 0.5 : 0;
    signals.push(fontsAvailable ? { ...makeSignalScore("chineseFonts", labels.chineseFonts, fontValue, 0, fontScore, text, config), evidence: "inferred" as const } : unavailableSignal("chineseFonts", labels.chineseFonts, text.unknown, text, config));
    const vendorFontScore = vendorFonts.length >= 2 ? 1 : vendorFonts.length === 1 ? 0.8 : 0;
    signals.push(fontsAvailable ? { ...makeSignalScore("vendorFonts", labels.vendorFonts, vendorFonts.length ? `${value.vendorFonts}：${vendorFonts.join(" / ")}` : value.noVendorFonts, 0, vendorFontScore, text, config), evidence: "inferred" as const } : unavailableSignal("vendorFonts", labels.vendorFonts, text.unknown, text, config));

    const canvas = canvasProbe();
    probes.canvas = canvas;
    const canvasValue = canvas.ok ? `${value.canvasSize.replace("{n}", String(canvas.length))}` : value.canvasBlocked;
    signals.push(canvas.ok ? makeSignal("canvasFp", labels.canvasFp, canvasValue, 0, false, text, config) : unavailableSignal("canvasFp", labels.canvasFp, canvasValue, text, config));

    const webgl = webglProbe();
    probes.webgl = webgl;
    const renderer = webgl?.unmaskedRenderer ?? webgl?.renderer;
    const softwareRenderer = renderer ? /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer) : false;
    const webglValue = renderer || value.webglNone;
    signals.push(renderer ? { ...makeSignal("webgl", labels.webgl, `${webglValue}${softwareRenderer ? ` · ${value.softwareRenderer}` : ""}`, 0, false, text, config), evidence: "observed" as const } : unavailableSignal("webgl", labels.webgl, webglValue, text, config));

    const audio = await audioProbe(Math.min(1500, Math.max(1, config.runner.defaultTimeoutMs - 100)));
    probes.audio = audio;
    const audioValue = audio.ok
      ? `${value.audioRate.replace("{n}", String(audio.sampleRate ?? "?"))}`
      : value.audioBlocked;
    signals.push(audio.ok ? makeSignal("audioFp", labels.audioFp, audioValue, 0, false, text, config) : unavailableSignal("audioFp", labels.audioFp, audioValue, text, config));

    return signals;
  },
};
