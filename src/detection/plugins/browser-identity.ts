// Browser preferences and UA identify reported settings, not a user's location.
import { detectBrowserName, detectDeviceName, detectOS, makeSignal, makeSignalScore, unavailableSignal } from "../client-engine";
import { languageVariant } from "../browser-rules";
import type { DetectionPlugin } from "../plugin";

export const browserIdentityPlugin: DetectionPlugin = {
  id: "browser-identity", titleKey: "browser", source: "browser", category: "browser", defaultWeight: 0,
  signalIds: ["clientProfile", "userAgent", "language", "languageVariant", "locale", "timezone", "timezoneOffset", "emojiStyle"],
  async run({ browser, text, config }) {
    const { languages, timezone, locale, userAgent: ua, platform, touchPoints } = browser;
    const value = text.signalValues;
    const labels = text.signalLabels;
    const variant = languageVariant(languages);
    const chineseVariant = variant === "traditional" ? value.traditionalChinese : variant === "simplified" ? value.simplifiedChinese : value.noLanguageVariant;
    const offset = -new Date().getTimezoneOffset() / 60;
    const os = detectOS(ua, platform, text, touchPoints);
    const emojiStyle = os === "macOS" || os === "iOS" ? value.appleEmoji : os === "Android" || os === "HarmonyOS" ? value.androidEmoji : os === "Windows" ? value.windowsEmoji : null;
    const profile = `${detectBrowserName(ua, text)} / ${detectDeviceName(ua, platform, text, touchPoints)}`;
    const signal = (id: string, content: string | null) => makeSignal(id, labels[id], content, 0, false, text, config);
    return [
      { ...signal("clientProfile", ua ? profile : null), evidence: "inferred" as const },
      signal("userAgent", ua),
      signal("language", languages.join(", ")),
      { ...signal("languageVariant", languages.length ? chineseVariant : null), evidence: "inferred" as const },
      signal("locale", locale),
      signal("timezone", timezone),
      makeSignalScore("timezoneOffset", labels.timezoneOffset, Number.isFinite(offset) ? `UTC${offset >= 0 ? "+" : ""}${offset}` : null, 0, 0, text, config),
      emojiStyle
        ? { ...signal("emojiStyle", emojiStyle), evidence: "inferred" as const }
        : unavailableSignal("emojiStyle", labels.emojiStyle, value.unknownEmoji, text, config),
    ];
  },
};
