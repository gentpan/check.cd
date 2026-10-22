// 首页：Hero、检测器、专业检测矩阵和页脚。
import { AccountCheck } from "@/components/account/AccountCheck";
import { CheckIcon } from "@/components/detector/CheckIcon";
import { NewsList } from "./NewsList";
import { articles } from "@/content/articles";
import { useEffect, useState } from "react";
import { Detector } from "@/components/detector/Detector";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { messages, type LocaleCode } from "@/i18n/messages";

const documentLang: Record<LocaleCode, string> = {
  zh: "zh-CN",
  "zh-HK": "zh-HK",
  ru: "ru",
  en: "en",
};

const pageMax = "site-container";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "check.cd",
      url: "https://check.cd/",
      applicationCategory: "SecurityApplication",
      operatingSystem: "All",
      inLanguage: "zh-CN",
      description: messages.zh.hero.subtitle,
      featureList: messages.zh.signals.checks.map(([title]) => title),
    },

  ],
};

export function HomePage({ locale = "zh" }: { locale?: LocaleCode }) {
  const zh = locale === "zh" || locale === "zh-HK";
  const ru = locale === "ru";
  const text = zh ? {
    badge: "为你的 Claude 使用环境，做一次检查",
    title: "用 Claude 之前，", emphasis: "心里有数。",
    description: "查看网络出口与浏览器实测值。每一项都有来源，缺失的数据明确标出。",
    start: "开始环境检测", guide: "了解检查内容", note: "无需登录 · 无需安装 · 即开即测",
    panel: "你的环境，一目了然。", panelSub: "检查当前设备与网络，结果会在这里呈现。",
    ready: "待检测", checking: "检测中", done: "采样结束", device: "当前设备与网络", auto: "自动检测 · 无需填写",
    featuresTitle: "少一点猜测，多一点了解。", featuresSub: "把复杂的环境信息，变成看得懂的线索。",
    features: [["IP 与网络", "确认可见出口，查看运营商与可用的供应商标记。"], ["浏览器环境", "检查设备、时区与浏览器技术信息，标出需要核对的差异。"], ["报告与建议", "分清实测、推断和未知，按需解读，避免把信息缺失当成正常。"]],
    knowledge: "让每一次判断，都有依据。", knowledgeSub: "使用指南、官方消息与政策动态，放在一起。", articles: "基础文章", allArticles: "全部文章", news: "新闻与政策动态", allNews: "全部动态",
  } : ru ? {
    badge: "Проверка среды для Claude", title: "Перед работой с Claude", emphasis: "узнайте больше.",
    description: "От сетевого адреса до браузера — понятная проверка деталей, которые стоит учесть.",
    start: "Проверить среду", guide: "Что мы проверяем", note: "Без входа · Без установки · В браузере",
    panel: "Ваша среда. Всё на виду.", panelSub: "Результаты проверки устройства и сети появятся здесь.", ready: "Ожидание", checking: "Проверка", done: "Готово", device: "Устройство и сеть", auto: "Автоматическая проверка",
    featuresTitle: "Меньше догадок. Больше ясности.", featuresSub: "Понятные наблюдения о вашей среде.",
    features: [["IP и сеть", "Сетевой адрес, расположение и репутация IP."], ["Браузер", "Устройство, часовой пояс и технические наблюдения."], ["Отчёт и советы", "Результаты проверки и пояснения ИИ по запросу."]],
    knowledge: "Основа для уверенных решений.", knowledgeSub: "Руководства, новости и изменения правил.", articles: "Статьи", allArticles: "Все статьи", news: "Новости и правила", allNews: "Все новости",
  } : {
    badge: "A clearer picture of your Claude environment", title: "Before you use Claude,", emphasis: "know where you stand.",
    description: "From your network to your browser, understand the details worth checking. One check. One readable report.",
    start: "Check my environment", guide: "Explore the checks", note: "No sign-in · No installation · Right in your browser",
    panel: "Your environment, at a glance.", panelSub: "Check this device and network. Your results will appear here.", ready: "Ready", checking: "Checking", done: "Complete", device: "Current device & network", auto: "Automatic · no form",
    featuresTitle: "Less guesswork. More clarity.", featuresSub: "Complex environment data, translated into useful observations.",
    features: [["IP & network", "Understand your network exit, location and IP reputation."], ["Browser environment", "Check your device, time zone and browser information."], ["Report & guidance", "Review your results and request AI explanations when needed."]],
    knowledge: "Put better information behind every decision.", knowledgeSub: "Guides, official updates and policy news, in one place.", articles: "Guides", allArticles: "All guides", news: "News & policy updates", allNews: "All updates",
  };
  const startCheck = () => {
    setShowDetector(true);
    document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [showDetector, setShowDetector] = useState(false);
  const [detectionDone, setDetectionDone] = useState(false);

  useEffect(() => {
    document.documentElement.lang = documentLang[locale];
  }, [locale]);

  useEffect(() => {
    const start = () => {
      setShowDetector(true);
      document.getElementById("checker")?.scrollIntoView({behavior: "smooth", block: "start"});
    };
    window.addEventListener("start-check", start);
    return () => window.removeEventListener("start-check", start);
  }, []);

  return (
    <SiteFrame landing>
      <main className="tool-home landing-home">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section className="site-container landing-hero" aria-labelledby="home-title">
          <div className="hero-badge squircle"><img src="/logo.svg?v=eight-rays" width="16" height="16" alt="" />{text.badge}</div>
          <h1 id="home-title">{text.title}<br /><span>{text.emphasis}</span></h1>
          <p className="hero-description">{text.description}</p>
          <div className="hero-actions">
            <button className="primary-btn squircle hero-start" onClick={startCheck}>{text.start}<span aria-hidden="true">↗</span></button>
            <a className="squircle hero-secondary" href="#checks">{text.guide}<span aria-hidden="true">↓</span></a>
          </div>
          <p className="hero-note">{text.note}</p>
        </section>

        <div className={`${pageMax} landing-checker-wrap`}>
          <section id="checker" className="report-sheet tool-report squircle landing-checker" aria-label={text.panel}>
            <header className="report-heading">
              <div className="tool-report-top"><span><span className="checker-brand-dot" /> CHECK.CD / ENVIRONMENT</span><span role="status" className={`tool-report-state squircle ${detectionDone ? "is-complete" : ""}`}><i />{detectionDone ? text.done : showDetector ? text.checking : text.ready}</span></div>
              {!showDetector && <div className="tool-report-title"><div><h2 id="checker-title">{text.panel}</h2><p>{text.panelSub}</p></div>{!showDetector && <button className="squircle checker-start" onClick={startCheck} aria-label={text.start}><span aria-hidden="true">↗</span></button>}</div>}
              {!showDetector && <div className="tool-report-info"><span>{text.device}</span><span>{text.auto}</span></div>}
            </header>
            <div className="report-body">
              {showDetector ? <Detector locale={locale} onComplete={setDetectionDone} /> : <div className="tool-check-list">{text.features.map(([title, description], index) => <div key={title} className="tool-check-item"><span className="squircle preview-check-icon"><CheckIcon id={["ipAddress", "clientProfile", "aiSubscription"][index]} className="size-5" /></span><strong>{title}</strong><p>{description}</p><span className="tool-check-pending">{text.ready}</span></div>)}</div>}
            </div>
            <div className="report-foot squircle"><span>CHECK.CD · {zh ? "独立环境检查工具" : "Independent environment checker"}</span><span>{zh ? "环境观察参考 · 非封禁预测" : "Environment observations, not ban predictions"}</span></div>
          </section>
          <p className="checker-caption">{zh ? "真实检查，清晰呈现。检测结果仅供环境观察参考。" : ru ? "Реальные проверки. Понятные результаты. Только наблюдения о среде." : "Real checks. Clear results. For environment observations."}</p>
        </div>

        <section id="checks" className="site-container landing-features" aria-labelledby="features-title">
          <div className="landing-section-heading"><span className="landing-eyebrow">BUILT FOR CLARITY</span><h2 id="features-title">{text.featuresTitle}</h2><p>{text.featuresSub}</p></div>
          <div className="feature-grid">{text.features.map(([title, description], index) => <article className="squircle feature-card" key={title}><span className="squircle feature-icon"><CheckIcon id={["ipAddress", "clientProfile", "aiSubscription"][index]} className="size-6" /></span><span className="feature-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        </section>

        <section className="site-container evidence-callout-wrap"><div className="squircle evidence-callout"><div><span className="landing-eyebrow">EVIDENCE, NOT GUESSWORK</span><h2>{zh ? "有多少证据，就说到哪一步。" : "Only as certain as the evidence."}</h2><p>{zh ? "数据覆盖率不是通过率，也不是账号安全概率。了解每项如何获取、可能在哪些条件下失准。" : "Coverage is not a pass rate or an account safety probability. See how each check is collected and where it can be wrong."}</p></div><a href="/methodology" className="squircle hero-secondary">{zh ? "检测方法与局限" : "Methods & limitations"} ↗</a></div></section>
        {zh && <section className="site-container account-workspace-wrap" id="account-check"><details className="squircle account-workspace"><summary><div><span className="landing-eyebrow">OPTIONAL · LOCAL ONLY</span><h2>注册、支付与账号条件</h2><p>按实际情况手动核对。回答仅保留在当前页面，不上传，不参与技术检测。</p></div><span aria-hidden="true">＋</span></summary><AccountCheck /></details></section>}
        <section className="site-container landing-knowledge" aria-labelledby="knowledge-title">
          <div className="landing-section-heading"><span className="landing-eyebrow">STAY INFORMED</span><h2 id="knowledge-title">{text.knowledge}</h2><p>{text.knowledgeSub}</p></div>
          <div className="landing-resource-grid">
            <section className="squircle landing-resource"><div className="section-heading"><h3>{text.articles}</h3><a href="/articles">{text.allArticles} ↗</a></div><div className="landing-article-list">{articles.slice(0, 3).map(a => <a href={`/articles/${a.slug}`} key={a.slug}><span>{a.category}</span><h4>{a.title}<span aria-hidden="true">↗</span></h4><p>{a.description}</p></a>)}</div></section>
            <section className="squircle landing-resource"><div className="section-heading"><h3>{text.news}</h3><a href="/news">{text.allNews} ↗</a></div><NewsList compact /></section>
          </div>
        </section>
        <SiteFooter locale={locale} minimal />
      </main>
    </SiteFrame>
  );
}
