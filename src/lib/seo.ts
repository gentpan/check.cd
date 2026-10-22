import { messages, type LocaleCode } from "@/i18n/messages";

const canonical: Record<LocaleCode, string> = {
  zh: "https://check.cd/",
  "zh-HK": "https://check.cd/hong-kong",
  ru: "https://check.cd/russia",
  en: "https://check.cd/en",
};

export function pageHead(locale: LocaleCode) {
  const copy = messages[locale];
  const url = canonical[locale];
  return {
    meta: [
      { title: `${copy.hero.title}｜check.cd` },
      { name: "description", content: copy.hero.subtitle },
      { property: "og:title", content: copy.hero.title },
      { property: "og:description", content: copy.hero.subtitle },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "check.cd" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: copy.hero.title },
      { name: "twitter:description", content: copy.hero.subtitle },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hrefLang: "zh-CN", href: canonical.zh },
      { rel: "alternate", hrefLang: "ru", href: canonical.ru },
      { rel: "alternate", hrefLang: "en", href: canonical.en },
    ],
  };
}
