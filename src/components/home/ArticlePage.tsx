import { useEffect } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { messages, type LocaleCode } from "@/i18n/messages";
import { localeHref, type SitePage } from "@/lib/site";

const documentLang: Record<LocaleCode, string> = {
  zh: "zh-CN",
  "zh-HK": "zh-HK",
  ru: "ru",
  en: "en",
};

const pageMax = "mx-auto w-full max-w-[760px] px-5 md:px-8";

export function ArticlePage({ locale, kind }: { locale: LocaleCode; kind: Exclude<SitePage, "home"> }) {
  const copy = messages[locale];
  const home = localeHref(locale);
  const links = [
    { href: home, label: copy.nav.detect },
    { href: localeHref(locale, "read"), label: copy.nav.projects },
    { href: localeHref(locale, "privacy"), label: copy.privacy.eyebrow },
    { href: localeHref(locale, "faq"), label: copy.nav.faq },
  ];

  useEffect(() => {
    document.documentElement.lang = documentLang[locale];
  }, [locale]);

  return (
    <SiteFrame>
      <main className="prose-page">
        <article className={`${pageMax} pt-14 pb-8`}>
          <a href={home} className="text-sm text-muted hover:text-accent">{copy.nav.detect}</a>
          {kind === "read" && (
            <>
              <h1 className="mt-6 font-serif text-4xl leading-tight font-normal text-ink md:text-6xl">{copy.logic.title}</h1>
              <p className="mt-6 text-base leading-8 text-muted">{copy.logic.desc}</p>
              <div className="mt-12 grid gap-10">
                {copy.logic.items.map(([num, title, desc]) => (
                  <section key={title} className="squircle prose-card">
                    <p className="text-sm text-accent">{num}</p>
                    <h2 className="mt-3 font-serif text-3xl font-normal text-ink">{title}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">{desc}</p>
                  </section>
                ))}
              </div>
            </>
          )}
          {kind === "privacy" && (
            <>
              <h1 className="mt-6 font-serif text-4xl leading-tight font-normal text-ink md:text-6xl">{copy.privacy.title}</h1>
              <p className="mt-6 text-base leading-8 text-muted">{copy.privacy.desc}</p>
              <div className="mt-12 grid gap-8">
                {copy.privacy.items.map(([question, answer]) => (
                  <section key={question} className="squircle prose-card">
                    <h2 className="font-serif text-2xl font-normal text-ink">{question}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">{answer}</p>
                  </section>
                ))}
              </div>
            </>
          )}
          {kind === "faq" && (
            <>
              <h1 className="mt-6 font-serif text-4xl leading-tight font-normal text-ink md:text-6xl">{copy.faq.title}</h1>
              <div className="faq-list mt-10">
                {copy.faq.items.map(([question, answer]) => (
                  <details key={question} className="squircle faq-card group">
                    <summary className="cursor-pointer list-none font-serif text-xl text-ink [&::-webkit-details-marker]:hidden">{question}</summary>
                    <p className="mt-3 text-sm leading-7 text-muted">{answer}</p>
                  </details>
                ))}
              </div>
            </>
          )}
          <nav className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
            {links.filter((item) => !item.href.endsWith(`/${kind}`)).map((item) => (
              <a key={item.href} href={item.href} className="text-muted hover:text-accent">{item.label}</a>
            ))}
          </nav>
        </article>
        <SiteFooter locale={locale} />
      </main>
    </SiteFrame>
  );
}
