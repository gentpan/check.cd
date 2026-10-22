import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Transpile the real browser modules without bundling away their dependencies.
const root = fileURLToPath(new URL("../", import.meta.url));
const urls = new Map();
function moduleUrl(relative) {
  let filename = path.isAbsolute(relative) ? relative : path.join(root, relative);
  if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) filename = fs.existsSync(`${filename}.ts`) ? `${filename}.ts` : path.join(filename, "index.ts");
  if (urls.has(filename)) return urls.get(filename);
  const source = fs.readFileSync(filename, "utf8");
  let output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  output = output.replace(/((?:from\s+|import\s*)["'])([^"']+)(["'])/g, (full, prefix, specifier, quote) => {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return full;
    const dependency = specifier.startsWith("@/") ? path.join(root, "src", specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
    return `${prefix}${moduleUrl(dependency)}${quote}`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
  urls.set(filename, url);
  return url;
}
const load = (relative) => import(moduleUrl(relative));
const engine = await load("src/detection/client-engine.ts");
const { detectionConfig } = await load("src/detection/config/index.ts");
const { detectorLocaleText } = await load("src/detection/locale.ts");
const { browserIdentityPlugin } = await load("src/detection/plugins/browser-identity.ts");
const { deviceFingerprintPlugin } = await load("src/detection/plugins/device.ts");
const { runtimePlugin } = await load("src/detection/plugins/runtime.ts");
const { consistencyPlugin } = await load("src/detection/plugins/consistency.ts");
const { detectionPlugins } = await load("src/detection/plugins/index.ts");
const { runDetection, reconcileDetection } = await load("src/detection/runner.ts");
const { evaluateAccess, accessStatus } = await load("src/detection/scoring.ts");
const { languageVariant, countryOffsets, rendererSystemConflict } = await load("src/detection/browser-rules.ts");
const text = detectorLocaleText.en;
const macUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const byId = (signals, id) => signals.find((signal) => signal.id === id);
const config = (timeoutMs = 3000) => ({ ...detectionConfig, runner: { ...detectionConfig.runner, defaultTimeoutMs: timeoutMs } });
function installBrowser(t, options = {}) {
  const saved = new Map();
  const values = new Map([["__cc_probe", "keep-existing-user-data"]]);
  let audioRuns = 0;
  const nav = { userAgent: macUa, platform: "MacIntel", languages: ["en-US"], language: "en-US", maxTouchPoints: 0, hardwareConcurrency: 8, cookieEnabled: true, webdriver: false, plugins: [], pdfViewerEnabled: false, permissions: { query: async () => ({ state: "denied" }) }, ...options.navigator };
  class OfflineAudio {
    createOscillator() { return { type: "", frequency: { value: 0 }, connect() {}, start() {}, disconnect() {} }; }
    createDynamicsCompressor() { return { connect() {}, disconnect() {} }; }
    startRendering() { audioRuns += 1; return options.audioNever ? new Promise(() => {}) : Promise.resolve({ getChannelData: () => new Float32Array([0.1, 0.2]), sampleRate: 44100 }); }
  }
  const renderer = options.renderer ?? "Apple M3";
  const gl = { VENDOR: 1, RENDERER: 2, getExtension: () => ({ UNMASKED_VENDOR_WEBGL: 3, UNMASKED_RENDERER_WEBGL: 4 }), getParameter: (id) => id === 2 || id === 4 ? renderer : "Apple" };
  const document = { createElement: () => ({ getContext: (kind) => options.blockedCanvas ? null : kind === "webgl" ? gl : { measureText: () => ({ width: 100 }), fillRect() {}, fillText() {}, arc() {}, stroke() {} }, toDataURL: () => `data:image/png;base64,${"A".repeat(100)}` }) };
  const window = { screen: { width: 1440, height: 900, colorDepth: 24 }, innerWidth: 1000, innerHeight: 700, outerWidth: 0, outerHeight: 0, devicePixelRatio: 2, matchMedia: () => ({ matches: false }), OfflineAudioContext: options.noAudio ? undefined : OfflineAudio, AudioContext: class { constructor() { throw new Error("Live audio must not be opened"); } }, Notification: { permission: "default" }, localStorage: { setItem: (k, v) => values.set(k, v), getItem: (k) => values.get(k) ?? null, removeItem: (k) => values.delete(k) }, indexedDB: {}, ...options.window };
  for (const [key, value] of Object.entries({ navigator: nav, window, document })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  t.after(() => { for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const browser = engine.collectBrowserEnvironment(text);
  const context = { region: "auto", locale: "en", text, config: config(), browser, purity: null, probes: {} };
  return { context, nav, window, values, audioRuns: () => audioRuns };
}

test("iOS Chrome, Firefox, Edge and WeChat are recognized before Safari/Chrome tokens", () => {
  assert.equal(engine.detectBrowserName(`${macUa} CriOS/150.0`, text), "Chrome");
  assert.equal(engine.detectBrowserName(`${macUa} FxiOS/150.0`, text), "Firefox");
  assert.equal(engine.detectBrowserName(`${macUa} EdgiOS/150.0`, text), "Microsoft Edge");
  assert.equal(engine.detectBrowserName(`${macUa} Chrome/150.0 MicroMessenger/8`, text), text.signalValues.wechatBrowser);
});
test("desktop-UA iPad is not reported as a Mac", () => {
  assert.equal(engine.detectOS(macUa, "MacIntel", text, 5), "iOS");
  assert.equal(engine.detectDeviceName(macUa, "MacIntel", text, 5), "iPad / iOS");
  assert.equal(engine.detectOS(macUa, "MacIntel", text, 0), "macOS");
});
test("Chinese script detection respects explicit script and preference order", () => {
  assert.equal(languageVariant(["zh-CN", "zh-TW"]), "simplified");
  assert.equal(languageVariant(["zh-Hant-CN", "zh-CN"]), "traditional");
  assert.equal(languageVariant(["zh-Hans-HK"]), "simplified");
  assert.equal(languageVariant(["zh"]), null);
  assert.equal(languageVariant(["zhuang", "en-US"]), null);
});
test("a missing or invalid numeric measurement is unknown and contributes nothing", () => {
  for (const [content, score] of [[null, 0], ["", 1], ["   ", 1], ["read", NaN]]) {
    const result = engine.makeSignalScore("automation", "Automation", content, 12, score, text, detectionConfig);
    assert.equal(result.availability, "unavailable");
    assert.equal(result.contribution, 0);
  }
  assert.equal(engine.signalsScore([{ contribution: 12, availability: "unavailable" }, { contribution: NaN }, { contribution: 3 }]), 3);
});
test("restricted preference reads do not prevent other browser fields from being captured", (t) => {
  const { nav } = installBrowser(t);
  Object.defineProperty(nav, "userAgentData", { get() { throw new Error("privacy restriction"); } });
  const snapshot = engine.collectBrowserEnvironment(text);
  assert.equal(snapshot.userAgent, macUa);
  assert.deepEqual(snapshot.languages, ["en-US"]);
  assert.equal(snapshot.brands, text.signalValues.noBrands);
});
test("browser settings cannot infer account access or a physical region", (t) => {
  installBrowser(t);
  const result = evaluateAccess({ region: "auto", languages: ["zh-CN"], locale: "zh-CN", timezone: "Asia/Shanghai", userAgent: "Huawei MicroMessenger", source: "browser" });
  assert.equal(result.matchedRegion, null);
  assert.equal(result.status, "unknown");
  assert.equal(result.score, 0);
  assert.deepEqual(Object.values(result.products), ["unknown", "unknown", "unknown", "unknown"]);
  assert.equal(accessStatus(100), "unknown");
});
test("GPU vendors do not constrain the operating system", () => {
  for (const [renderer, os] of [["Apple M3", "macOS"], ["Apple GPU", "Linux"], ["Adreno", "Windows"], ["Intel Iris", "Android"]]) assert.equal(rendererSystemConflict(renderer, os), null);
  assert.equal(rendererSystemConflict("ANGLE Direct3D11", "macOS"), true);
});
test("country offsets use date-specific DST and include fractional timezones", () => {
  const winter = new Date("2026-01-15T12:00:00Z"), summer = new Date("2026-07-15T12:00:00Z");
  assert.deepEqual(countryOffsets("GB", winter), [0]);
  assert.deepEqual(countryOffsets("GB", summer), [1]);
  assert.ok(countryOffsets("AU", summer).includes(9.5));
  assert.ok(countryOffsets("AU", winter).includes(10.5));
  assert.ok(countryOffsets("NZ", winter).includes(13.75));
  assert.ok(countryOffsets("NP", winter).includes(5.75));
  assert.equal(countryOffsets("XX", winter), null);
});
test("blocked graphics/audio APIs are unavailable without risk penalties", async (t) => {
  const { context } = installBrowser(t, { blockedCanvas: true, noAudio: true });
  const signals = await deviceFingerprintPlugin.run(context);
  for (const id of ["canvasFp", "webgl", "audioFp", "chineseFonts", "vendorFonts"]) {
    assert.equal(byId(signals, id).availability, "unavailable", id);
    assert.equal(byId(signals, id).contribution, 0, id);
  }
  assert.equal(byId(signals, "screen").availability, "available");
});
test("audio rendering timeout returns unknown while retaining other device measurements", async (t) => {
  const { context } = installBrowser(t, { audioNever: true });
  context.config = config(110);
  const signals = await deviceFingerprintPlugin.run(context);
  assert.equal(byId(signals, "audioFp").availability, "unavailable");
  assert.equal(byId(signals, "canvasFp").availability, "available");
});
test("software graphics are observed information and never proof of a VM or account risk", async (t) => {
  const { context } = installBrowser(t, { renderer: "Google SwiftShader" });
  const signals = await deviceFingerprintPlugin.run(context);
  assert.equal(byId(signals, "webgl").contribution, 0);
  assert.match(byId(signals, "webgl").value, /software rendering/);
  assert.equal(byId(signals, "audioFp").availability, "available");
});
test("zero outer window, empty PDF list and permission differences do not imply automation", async (t) => {
  const { context, values } = installBrowser(t);
  const signals = await runtimePlugin.run(context);
  for (const id of ["automation", "plugins", "permissions"]) assert.equal(byId(signals, id).contribution, 0, id);
  assert.equal(byId(signals, "permissions").availability, "available");
  assert.equal(values.get("__cc_probe"), "keep-existing-user-data");
  assert.equal(values.size, 1);
});
test("an explicit WebDriver flag is preserved as an observation", async (t) => {
  const { context } = installBrowser(t, { navigator: { webdriver: true } });
  const signal = byId(await runtimePlugin.run(context), "automation");
  assert.equal(signal.availability, "available");
  assert.equal(signal.score, 1);
  assert.match(signal.value, /navigator.webdriver/);
});
test("permission query timeout does not lose runtime measurements", async (t) => {
  const { context } = installBrowser(t, { navigator: { permissions: { query: () => new Promise(() => {}) } } });
  context.config = config(110);
  const signals = await runtimePlugin.run(context);
  assert.equal(byId(signals, "permissions").availability, "unavailable");
  assert.equal(byId(signals, "plugins").availability, "available");
});
test("missing IP/GPU inputs remain unknown while language is contextual information", async (t) => {
  const { context } = installBrowser(t, { navigator: { languages: ["zh-CN"] } });
  const signals = await consistencyPlugin.run(context);
  assert.equal(byId(signals, "tzIp").availability, "unavailable");
  assert.equal(byId(signals, "glOs").availability, "unavailable");
  assert.equal(byId(signals, "langTz").evidence, "inferred");
  assert.doesNotMatch(byId(signals, "langTz").value, /conflict/);
});
test("runner waits for device dependencies and reports actual incremental progress", async (t) => {
  const { context } = installBrowser(t);
  const progress = [];
  const result = await runDetection({ ...context, onProgress: (signals) => progress.push(signals) });
  assert.equal(result.matchedRegion, null);
  assert.equal(progress.length, detectionPlugins.length);
  assert.ok(progress.every((signals, i) => i === 0 || signals.length >= progress[i - 1].length));
  const gpuCheck = byId(result.signals, "glOs");
  assert.equal(gpuCheck.availability, "available");
  assert.match(gpuCheck.value, /Apple M3/);
  assert.equal(byId(result.signals, "audioFp").availability, "available");
});
test("runner timeout preserves every expected row as unavailable", async (t) => {
  const { context } = installBrowser(t);
  context.config = config(10);
  const original = browserIdentityPlugin.run;
  browserIdentityPlugin.run = () => new Promise(() => {});
  t.after(() => { browserIdentityPlugin.run = original; });
  const result = await runDetection(context);
  for (const id of browserIdentityPlugin.signalIds) assert.equal(byId(result.signals, id).availability, "unavailable", id);
  assert.ok(byId(result.signals, "storage"));
});
test("network reconciliation reuses the initial snapshot and never resamples graphics or audio", async (t) => {
  const { context, audioRuns, nav } = installBrowser(t);
  const result = await runDetection(context);
  assert.equal(audioRuns(), 1);
  nav.userAgent = "different browser UA after first run";
  const updated = await reconcileDetection({ ...context, previous: result, purity: { ok: true, countryCode: "UZ" } });
  assert.equal(audioRuns(), 1);
  assert.equal(byId(updated.signals, "canvasFp"), byId(result.signals, "canvasFp"));
  assert.equal(updated.browser.userAgent, macUa);
  assert.equal(byId(updated.signals, "tzIp").availability, "available");
  assert.equal(byId(updated.signals, "tzIp").evidence, "inferred");
  assert.equal(byId(updated.signals, "tzIp").contribution, 0);
});
test("a rejected plugin and a failing progress callback do not conceal other checks", async (t) => {
  const { context } = installBrowser(t);
  const original = runtimePlugin.run;
  runtimePlugin.run = async () => { throw new Error("restricted runtime API"); };
  t.after(() => { runtimePlugin.run = original; });
  const result = await runDetection({ ...context, onProgress() { throw new Error("UI observer failed"); } });
  for (const id of runtimePlugin.signalIds) assert.equal(byId(result.signals, id).availability, "unavailable", id);
  assert.equal(byId(result.signals, "canvasFp").availability, "available");
  assert.equal(byId(result.signals, "userAgent").availability, "available");
});
test("restricted screen and hardware getters do not discard independent device measurements", async (t) => {
  const { context, window, nav } = installBrowser(t);
  Object.defineProperty(window, "screen", { get() { throw new Error("screen restricted"); } });
  Object.defineProperty(nav, "hardwareConcurrency", { get() { throw new Error("hardware restricted"); } });
  Object.defineProperty(nav, "deviceMemory", { get() { throw new Error("memory restricted"); } });
  const signals = await deviceFingerprintPlugin.run(context);
  assert.equal(byId(signals, "screen").availability, "unavailable");
  assert.equal(byId(signals, "hardware").availability, "unavailable");
  assert.equal(byId(signals, "canvasFp").availability, "available");
  assert.equal(byId(signals, "audioFp").availability, "available");
});
test("a restricted Intl implementation yields unknown locale/timezone without stopping UA capture", (t) => {
  installBrowser(t);
  const original = Intl.DateTimeFormat;
  Intl.DateTimeFormat = function () { throw new Error("Intl unavailable"); };
  t.after(() => { Intl.DateTimeFormat = original; });
  const snapshot = engine.collectBrowserEnvironment(text);
  assert.equal(snapshot.timezone, null);
  assert.equal(snapshot.locale, null);
  assert.equal(snapshot.userAgent, macUa);
});
