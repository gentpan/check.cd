import { localeRoutes, type LocaleCode } from "@/i18n/messages";

export type SitePage = "home" | "read" | "privacy" | "faq";

export function currentPage(pathname: string): SitePage {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path.endsWith("/read")) return "read";
  if (path.endsWith("/privacy")) return "privacy";
  if (path.endsWith("/faq")) return "faq";
  return "home";
}

export function localeHref(locale: LocaleCode, page: SitePage = "home") {
  if (page === "home") {
    const slug = locale === "zh-HK" ? "" : localeRoutes[locale].slug;
    return slug ? `/${slug}` : "/";
  }
  return `/notes/${locale === "zh-HK" ? "zh" : locale}/${page}`;
}

export function isLocaleCode(value: string): value is LocaleCode {
  return value === "zh" || value === "zh-HK" || value === "ru" || value === "en";
}

export function isSitePage(value: string): value is Exclude<SitePage, "home"> {
  return value === "read" || value === "privacy" || value === "faq";
}
