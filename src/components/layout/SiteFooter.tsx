// Shared footer keeps the original landscape artwork and inspectable policy lists.
import { useRouterState } from "@tanstack/react-router";
import { Flag } from "@/components/Flag";
import { claudeAccessCopy } from "@/i18n/claude-access";
import { localeRoutes, type LocaleCode } from "@/i18n/messages";
import { CLAUDE_BLOCKED_HIGHLIGHT, CLAUDE_REGION_POLICY, countryName, orderedCountries } from "@/lib/claude-regions";
import { footerCopy } from "@/i18n/footer";
import { currentPage, localeHref } from "@/lib/site";

const policyCopy = {
  zh: { methodology: "检测方法与准确性", reviewed: "资料核对", future: "未来公告生效", conflicts: "来源存在差异，以下地区暂列待核对", sources: "核对官方资料", claude: "Claude 当前地区说明", api: "API 当前地区说明", announced: "未来生效公告", announcementNote: "未来公告单独记录，未提前套用；生效后仍需重新审核。", expand: "展开清单与资料来源", language: "语言" },
  "zh-HK": { methodology: "檢測方法與準確性", reviewed: "資料核對", future: "未來公告生效", conflicts: "來源存在差異，以下地區暫列待核對", sources: "核對官方資料", claude: "Claude 現行地區說明", api: "API 現行地區說明", announced: "未來生效公告", announcementNote: "未來公告獨立記錄，未提前套用；生效後仍需重新審核。", expand: "展開清單與資料來源", language: "語言" },
  en: { methodology: "Methodology & accuracy", reviewed: "Reviewed", future: "Future announcement effective", conflicts: "Sources differ; these regions need review", sources: "Official sources", claude: "Current Claude regions", api: "Current API regions", announced: "Future announcement", announcementNote: "The future announcement is recorded separately, without early application. It requires another review after its effective date.", expand: "View lists and sources", language: "Languages" },
  ru: { methodology: "Методика и точность", reviewed: "Проверено", future: "Дата будущих правил", conflicts: "Источники различаются; требуется проверка этих регионов", sources: "Официальные источники", claude: "Текущие регионы Claude", api: "Текущие регионы API", announced: "Будущие правила", announcementNote: "Будущие правила учтены отдельно и не применяются заранее. После даты вступления требуется повторная проверка.", expand: "Список и источники", language: "Языки" },
};

export function SiteFooter({ locale = "zh", minimal = true }: { locale?: LocaleCode; minimal?: boolean }) {
  const copy = footerCopy[locale];
  const policy = policyCopy[locale];
  const access = claudeAccessCopy[locale];
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const page = currentPage(pathname);
  const menuLinks = [
    { href: localeHref(locale), label: copy.environment },
    { href: "/articles", label: copy.articles },
    { href: "/news", label: copy.news },
    { href: "/status", label: copy.status },
  ];
  const helpLinks = [
    { href: "/methodology", label: policy.methodology },
    { href: "#supported-countries", label: copy.regions },
    { href: localeHref(locale, "faq"), label: copy.faq },
    { href: localeHref(locale, "privacy"), label: copy.privacy },
  ];
  const allowed = orderedCountries(locale);
  const countryCells = (codes: readonly string[], restricted = false) => codes.map((code) => (
    <li key={code} data-country={code} className={`squircle country-cell${restricted ? " country-cell-restricted" : ""}`}>
      <Flag code={code} /><span className={code === "VC" || code === "BA" ? "country-name-long" : undefined}>{countryName(code, locale)}</span>
    </li>
  ));
  return (
    <>
      <section id="supported-countries" aria-label={access.footerTitle} className="site-region-section">
        <div className="site-container">
          <details className="squircle site-region-panel">
            <summary className="site-region-summary">
              <span className="site-region-summary-copy"><span className="site-region-title">{access.footerTitle}</span><span className="site-region-meta">{policy.reviewed} <time dateTime={CLAUDE_REGION_POLICY.checkedAt}>{CLAUDE_REGION_POLICY.checkedAt}</time></span></span>
              <span className="site-region-summary-action"><span>{policy.expand}</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
            </summary>
            <div className="site-region-content">
              <p>{access.note}</p>
              <div className="squircle site-policy-notice">
                <p><strong>{policy.future} <time dateTime={CLAUDE_REGION_POLICY.announced.effectiveAt}>{CLAUDE_REGION_POLICY.announced.effectiveAt}</time></strong></p>
                <p>{policy.announcementNote}</p>
              </div>
              <h3>{policy.conflicts}</h3>
              <ul className="country-grid site-country-conflicts">{countryCells(CLAUDE_REGION_POLICY.conflictCodes)}</ul>
              <p>{access.ukraine}</p>
              <h3>{access.blockedTitle}</h3>
              <ul className="country-grid">{countryCells(CLAUDE_BLOCKED_HIGHLIGHT, true)}</ul>
              <details className="site-allowed-countries">
                <summary className="squircle region-toggle"><span>{access.allowedTitle}</span><span className="site-country-count">{allowed.length}</span><span aria-hidden="true">＋</span></summary>
                <ul className="country-grid">{countryCells(allowed)}</ul>
              </details>
              <nav aria-label={policy.sources} className="site-policy-sources">
                <a href={CLAUDE_REGION_POLICY.currentSources.claude} target="_blank" rel="noreferrer">{policy.claude} ↗</a>
                <a href={CLAUDE_REGION_POLICY.currentSources.api} target="_blank" rel="noreferrer">{policy.api} ↗</a>
                <a href={CLAUDE_REGION_POLICY.announced.source} target="_blank" rel="noreferrer">{policy.announced} ↗</a>
              </nav>
            </div>
          </details>
        </div>
      </section>

      <footer className={`site-footer scenic-footer overflow-x-hidden border-t border-line${minimal ? " minimal-footer" : ""}`}>
        <div className="footer-landscape">
          <div className="footer-landscape-info"><div className="site-container footer-content-grid">
            <section>
              <a href={localeHref(locale)} className="footer-brand" aria-label="Check Claude · check.cd"><span className="footer-brand-symbol" aria-hidden="true" /><span>Check <strong>Claude</strong></span></a>
              <p className="site-footer-description">{copy.description}</p>
              <nav aria-label={policy.language} className="site-footer-languages">
                {(Object.keys(localeRoutes) as LocaleCode[]).filter((code) => code !== "zh-HK").map((code) => <a key={code} href={localeHref(code, page)} lang={localeRoutes[code].lang} hrefLang={localeRoutes[code].lang} aria-current={code === locale ? "true" : undefined}>{localeRoutes[code].label}</a>)}
              </nav>
            </section>
            <nav aria-label={copy.menuTitle} className="footer-menu"><h2>{copy.menuTitle}</h2>{menuLinks.map((item) => <a key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</a>)}</nav>
            <nav aria-label={copy.helpTitle} className="footer-menu"><h2>{copy.helpTitle}</h2>{helpLinks.map((item) => <a key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</a>)}</nav>
          </div></div>
          <div className="footer-landscape-art"><img src="/footer-backgrounds/cartoon-valley-short-20261014.webp" alt="" width="1920" height="448" loading="lazy" decoding="async" className="footer-landscape-image" /></div>
          <span className="footer-logo-watermark" aria-hidden="true" />
          <div className="footer-landscape-legal"><div className="site-container">{copy.legal}</div></div>
        </div>
      </footer>
    </>
  );
}
