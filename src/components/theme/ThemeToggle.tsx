// 浅色 / 深色切换，偏好写入 localStorage，并与 html.dark 同步。
import { useEffect, useRef, useState } from "react";
import type { LocaleCode } from "@/i18n/messages";

const themeCopy = {
  zh: { light: "切换为浅色模式", dark: "切换为深色模式" },
  "zh-HK": { light: "切換為淺色模式", dark: "切換為深色模式" },
  en: { light: "Switch to light mode", dark: "Switch to dark mode" },
  ru: { light: "Включить светлую тему", dark: "Включить тёмную тему" },
};

export function ThemeToggle({ label, locale = "zh" }: { label: string; locale?: LocaleCode }) {
  const [dark, setDark] = useState(false);
  const preference = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    try { const saved = localStorage.getItem("theme"); preference.current = saved === "dark" || saved === "light" ? saved : null; } catch { /* The in-page choice still works without storage. */ }
    const apply = () => {
      document.documentElement.classList.toggle("dark", preference.current === "dark" || (preference.current !== "light" && system.matches));
      sync();
    };
    const systemChanged = () => { if (!preference.current) apply(); };
    const stored = (event: StorageEvent) => {
      if (event.key !== "theme" && event.key !== null) return;
      preference.current = event.newValue === "dark" || event.newValue === "light" ? event.newValue : null;
      apply();
    };
    apply();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    system.addEventListener("change", systemChanged);
    window.addEventListener("storage", stored);
    return () => { observer.disconnect(); system.removeEventListener("change", systemChanged); window.removeEventListener("storage", stored); };
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    preference.current = next ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Switching themes should still work when storage is blocked.
    }
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={dark}
      title={dark ? themeCopy[locale].light : themeCopy[locale].dark}
      className="squircle sq-icon-button site-theme-toggle grid size-10 cursor-pointer place-items-center border border-line bg-surface text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z" />
        </svg>
      )}
    </button>
  );
}
