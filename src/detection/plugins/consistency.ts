// Cross checks are contextual observations, never proof of account eligibility.
import { detectOS, makeSignal, unavailableSignal } from "../client-engine";
import { countryOffsets, rendererSystemConflict } from "../browser-rules";
import type { DetectionPlugin } from "../plugin";

export const consistencyPlugin: DetectionPlugin = {
  id: "consistency", titleKey: "consistency", source: "combined", category: "consistency", defaultWeight: 0,
  dependsOn: ["device-fingerprint"], signalIds: ["langTz", "tzIp", "uaPlatform", "glOs"],
  async run({ browser, text, config, purity, probes }) {
    const labels = text.signalLabels;
    const value = text.signalValues;
    const date = new Date();
    const offset = -date.getTimezoneOffset() / 60;
    const signal = (id: string, content: string) => ({ ...makeSignal(id, labels[id], content, 0, false, text, config), evidence: "inferred" as const });
    const unknown = (id: string, content: string) => unavailableSignal(id, labels[id], content, text, config);
    const primary = browser.languages[0];
    // Language preferences have no geographic constraint (travel, diaspora, multilingual users).
    const signals = [primary ? signal("langTz", `${primary} · UTC${offset >= 0 ? "+" : ""}${offset}`) : unknown("langTz", value.unknown)];
    const country = purity?.ok ? purity.countryCode : null;
    const expected = country ? countryOffsets(country, date) : null;
    if (country && expected && Number.isFinite(offset)) {
      const matched = expected.includes(offset);
      const expectedValue = expected.map((n) => `UTC${n >= 0 ? "+" : ""}${n}`).join(" / ");
      signals.push(signal("tzIp", `${country} · UTC${offset >= 0 ? "+" : ""}${offset} → ${matched ? value.consistent : `${value.inconsistent} (${expectedValue})`}`));
    } else signals.push(unknown("tzIp", country ? `${country} · ${value.unknown}` : value.waitingIp));

    // Determine the UA's OS independently from the platform API before comparing.
    const os = detectOS(browser.userAgent, undefined, text, browser.touchPoints);
    const platform = (browser.platform ?? "").toLowerCase();
    let matched: boolean | null = null;
    if (platform && browser.userAgent) {
      if (os === "Windows") matched = /win/.test(platform);
      else if (os === "macOS") matched = /mac/.test(platform);
      else if (os === "iOS") matched = /iphone|ipad|ipod|mac|ios/.test(platform);
      else if (os === "Android") matched = /android|linux/.test(platform);
      else if (os === "Linux") matched = /linux/.test(platform);
      else if (os === "HarmonyOS") matched = /harmony|android|linux/.test(platform);
    }
    signals.push(matched === null ? unknown("uaPlatform", `${os} · ${platform || value.platformApiUnknown}`) : signal("uaPlatform", `${os} · ${platform} → ${matched ? value.consistent : value.inconsistent}`));

    const renderer = probes.webgl?.unmaskedRenderer ?? probes.webgl?.renderer;
    const conflict = renderer ? rendererSystemConflict(renderer, os) : null;
    // Vendor names alone do not provide enough evidence to validate an OS.
    signals.push(renderer ? signal("glOs", `${renderer} · ${os}${conflict === null ? "" : ` → ${conflict ? value.inconsistent : value.consistent}`}`) : unknown("glOs", `${value.webglNone} · ${os}`));
    return signals;
  },
};
