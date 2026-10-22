// Shared navigation, with native modal focus handling on small screens.
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { localeRoutes, messages, type LocaleCode } from "@/i18n/messages";
import { currentPage, isLocaleCode, localeHref } from "@/lib/site";
import { Brand } from "./Brand";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const shellCopy = {
  zh: { home: "返回首页", navigation: "主导航", articles: "基础文章", news: "新闻动态", status: "服务状态", methodology: "检测方法" },
  "zh-HK": { home: "返回首頁", navigation: "主導覽", articles: "基礎文章", news: "新聞動態", status: "服務狀態", methodology: "檢測方法" },
  en: { home: "Home", navigation: "Main navigation", articles: "Articles", news: "News", status: "Status", methodology: "Methodology" },
  ru: { home: "На главную", navigation: "Основная навигация", articles: "Статьи", news: "Новости", status: "Статус", methodology: "Методика проверки" },
};

export function SiteFrame({ children, landing = true }: { children: ReactNode; landing?: boolean }) {
  const [open, setOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const drawerButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const localeContainer = useRef<HTMLDivElement>(null);
  const localeButton = useRef<HTMLButtonElement>(null);
  const drawerId = useId();
  const drawerTitleId = useId();
  const localeMenuId = useId();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const path = pathname.replace(/\/$/, "") || "/";
  const noteLocale = path.match(/^\/notes\/([^/]+)/)?.[1];
  const activeLocale: LocaleCode = noteLocale && isLocaleCode(noteLocale)
    ? noteLocale : path === "/hong-kong" ? "zh-HK" : path === "/russia" ? "ru" : path === "/en" ? "en" : "zh";
  const copy = messages[activeLocale];
  const shell = shellCopy[activeLocale];
  const page = currentPage(path);
  const homeHref = localeHref(activeLocale);
  const localeItems = (Object.entries(localeRoutes) as Array<[LocaleCode, typeof localeRoutes.zh]>)
    .filter(([code]) => code !== "zh-HK")
    .map(([code, route]) => ({ code, label: route.label, lang: route.lang, href: localeHref(code, page) }));
  const navItems = [
    { href: "/articles", label: shell.articles },
    { href: "/news", label: shell.news },
    { href: "/status", label: shell.status },
    { href: "/methodology", label: shell.methodology },
    { href: localeHref(activeLocale, "faq"), label: copy.nav.faq },
    { href: localeHref(activeLocale, "privacy"), label: copy.privacy.eyebrow },
  ];
  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  useEffect(() => { setOpen(false); setLocaleOpen(false); }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const update = () => { if (desktop.matches) setOpen(false); else setLocaleOpen(false); };
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open || !drawer.current) return;
    const dialog = drawer.current;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (drawerButton.current?.isConnected) drawerButton.current.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!localeOpen) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !localeContainer.current?.contains(event.target)) setLocaleOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); setLocaleOpen(false); localeButton.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [localeOpen]);

  return (
    <div className={`min-h-screen overflow-x-hidden bg-canvas text-ink tool-site site-shell${landing ? " landing-site" : ""}`}>
      <dialog id={drawerId} ref={drawer} className="squircle site-drawer site-mobile-dialog" aria-labelledby={drawerTitleId}
        onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClose={(event) => { if (!event.currentTarget.open) setOpen(false); }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
        }}>
        <div className="site-drawer-heading">
          <h2 id={drawerTitleId}>{copy.nav.menu}</h2>
          <button ref={closeButton} type="button" onClick={() => setOpen(false)} className="squircle sq-small-button site-drawer-close">{copy.nav.close}</button>
        </div>
        <nav aria-label={shell.navigation} className="site-drawer-nav">
          <a href={homeHref} aria-current={path === homeHref ? "page" : undefined} className="squircle site-drawer-link" onClick={() => setOpen(false)}>{shell.home}</a>
          {navItems.map((item) => <a key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} onClick={() => setOpen(false)} className="squircle site-drawer-link">{item.label}</a>)}
        </nav>
        <div className="site-drawer-languages">
          <h3>{copy.nav.language}</h3>
          <nav aria-label={copy.nav.language}>
            {localeItems.map((item) => <a key={item.code} href={item.href} lang={item.lang} hrefLang={item.lang} aria-current={activeLocale === item.code ? "true" : undefined} onClick={() => setOpen(false)} className="squircle site-drawer-link">{item.label}<span aria-hidden="true">{activeLocale === item.code ? "✓" : ""}</span></a>)}
          </nav>
        </div>
      </dialog>

      <div className="pt-16 site-shell-content">
        <header className={`site-header fixed left-0 top-0 z-50 w-full border-b border-line bg-canvas${landing ? " landing-nav" : ""}`}>
          <div className="site-container site-header-inner flex h-16 items-center justify-between gap-4">
            <button ref={drawerButton} type="button" onClick={() => { setLocaleOpen(false); setOpen(true); }} aria-label={copy.nav.menu} aria-controls={drawerId} aria-expanded={open} aria-haspopup="dialog" className="squircle sq-icon-button site-menu-button grid size-10 place-items-center border border-line text-ink lg:hidden">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <a href={homeHref} aria-label={`Check Claude · ${shell.home}`} aria-current={path === homeHref ? "page" : undefined} className={landing ? "landing-nav-brand site-brand-link" : "site-brand-link shrink-0"}><Brand variant="glass" /></a>
            <nav aria-label={shell.navigation} className="site-nav-links hidden items-center whitespace-nowrap text-sm text-muted lg:flex">
              {(landing ? navItems.slice(0, 3) : navItems).map((item) => <a key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className="squircle site-nav-link">{item.label}</a>)}
            </nav>
            <div className="site-header-actions ml-auto flex items-center gap-2">
              <div ref={localeContainer} className="site-locale-container relative hidden lg:block" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setLocaleOpen(false); }}>
                <button ref={localeButton} type="button" aria-expanded={localeOpen} aria-controls={localeMenuId} aria-label={copy.nav.language} onClick={() => setLocaleOpen((value) => !value)} onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault(); setLocaleOpen(true);
                  requestAnimationFrame(() => localeContainer.current?.querySelector<HTMLAnchorElement>("nav a")?.focus());
                }} className="squircle sq-small-button site-locale-button">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c5 5 5 12 0 17-5-5-5-12 0-17Z" /></svg>
                  <span>{localeRoutes[activeLocale].label}</span>
                  <svg viewBox="0 0 24 24" className={`size-3.5 transition ${localeOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <nav id={localeMenuId} aria-label={copy.nav.language} hidden={!localeOpen} className="squircle locale-menu site-locale-menu">
                  {localeItems.map((item) => <a key={item.code} href={item.href} lang={item.lang} hrefLang={item.lang} aria-current={activeLocale === item.code ? "true" : undefined} onClick={() => setLocaleOpen(false)} className="squircle locale-menu-item"><span>{item.label}</span><span aria-hidden="true">{activeLocale === item.code ? "✓" : ""}</span></a>)}
                </nav>
              </div>
              <ThemeToggle label={copy.nav.theme} locale={activeLocale} />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
