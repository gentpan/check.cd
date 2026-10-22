// Runtime capabilities are browser settings; missing capabilities do not imply automation.
import { makeSignal, makeSignalScore, unavailableSignal, withTimeout } from "../client-engine";
import type { DetectionPlugin } from "../plugin";

function automationMarkers(): { markers: string[]; available: boolean } {
  const markers: string[] = [];
  let available = true;
  try { if (navigator.webdriver === true) markers.push("navigator.webdriver"); } catch { available = false; }
  try {
    // Restrict this to explicit framework objects. Window dimensions can be zero
    // in valid embedded/background windows and are not automation evidence.
    for (const [prop, label] of [["__nightmare", "Nightmare"], ["_phantom", "PhantomJS"], ["callPhantom", "PhantomJS"], ["domAutomationController", "Chrome Automation"]]) {
      if (prop in window) markers.push(label);
    }
    if (/\bHeadlessChrome\//i.test(navigator.userAgent)) markers.push("HeadlessChrome UA");
  } catch { available = false; }
  return { markers: [...new Set(markers)], available };
}

export const runtimePlugin: DetectionPlugin = {
  id: "runtime", titleKey: "runtime", source: "browser", category: "runtime", defaultWeight: 0,
  signalIds: ["automation", "permissions", "plugins", "storage"],
  async run({ text, config }) {
    const labels = text.signalLabels;
    const value = text.signalValues;
    const signals = [];
    const { markers, available } = automationMarkers();
    const automationValue = markers.length ? `${value.automationFound}：${markers.join(" / ")}` : value.automationClean;
    signals.push(available || markers.length ? makeSignalScore("automation", labels.automation, automationValue, 12, markers.length ? 1 : 0, text, config) : unavailableSignal("automation", labels.automation, text.unknown, text, config));

    let permission = unavailableSignal("permissions", labels.permissions, value.permissionUnknown, text, config);
    try {
      if (navigator.permissions?.query && "Notification" in window) {
        const status = await withTimeout(navigator.permissions.query({ name: "notifications" }), Math.min(1000, Math.max(1, config.runner.defaultTimeoutMs - 100)));
        // Secure-context rules and policy can legitimately cause the APIs to differ.
        permission = makeSignal("permissions", labels.permissions, `${value.notificationPermission}：${window.Notification.permission} · Permissions API：${status.state}`, 0, false, text, config);
      }
    } catch { /* Unsupported descriptor, policy restriction or timeout stays unknown. */ }
    signals.push(permission);

    try {
      const plugins = Array.from(navigator.plugins ?? []);
      const names = plugins.map((plugin) => plugin.name).filter(Boolean);
      const pdf = "pdfViewerEnabled" in navigator ? String(navigator.pdfViewerEnabled) : text.unknown;
      // HTML defines an empty plugin list when inline PDF support is disabled.
      // This is not an installed-extension inventory or a headless detector.
      signals.push(makeSignal("plugins", labels.plugins, `${names.length ? names.slice(0, 3).join(" / ") : value.pluginsEmpty} · PDF ${pdf}`, 0, false, text, config));
    } catch { signals.push(unavailableSignal("plugins", labels.plugins, text.unknown, text, config)); }

    const storage = [];
    try { storage.push(`Cookies ${navigator.cookieEnabled ? "✓" : "✗"}`); } catch { storage.push(`Cookies ${text.unknown}`); }
    const key = `__checkcd_probe_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    try {
      window.localStorage.setItem(key, "1");
      const writable = window.localStorage.getItem(key) === "1";
      storage.push(`localStorage ${writable ? "✓" : "✗"}`);
    } catch { storage.push("localStorage ✗"); }
    finally { try { window.localStorage.removeItem(key); } catch { /* Storage may be disabled. */ } }
    try { storage.push(`IndexedDB API ${typeof window.indexedDB !== "undefined" ? "✓" : "✗"}`); } catch { storage.push(`IndexedDB API ${text.unknown}`); }
    signals.push(makeSignal("storage", labels.storage, storage.join(" · "), 0, false, text, config));
    return signals;
  },
};
