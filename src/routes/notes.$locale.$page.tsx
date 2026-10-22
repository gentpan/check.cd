import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { ArticlePage } from "@/components/home/ArticlePage";
import { messages } from "@/i18n/messages";
import { isLocaleCode, isSitePage } from "@/lib/site";

export const Route = createFileRoute("/notes/$locale/$page")({
  beforeLoad: ({ params }) => {
    if (params.locale === "zh-HK" && isSitePage(params.page)) throw redirect({ href: `/notes/zh/${params.page}`, statusCode: 301 });
  },
  head: ({ params }) => {
    if (!isLocaleCode(params.locale) || !isSitePage(params.page)) return { meta: [{ title: "check.cd" }] };
    const copy = messages[params.locale];
    const title = params.page === "read" ? copy.logic.title : params.page === "privacy" ? copy.privacy.title : copy.faq.title;
    const description = params.page === "read" ? copy.logic.desc : params.page === "privacy" ? copy.privacy.desc : copy.hero.subtitle;
    return {
      meta: [
        { title: `${title}｜check.cd` },
        { name: "description", content: description },
      ],
    };
  },
  component: function NotesPage() {
    const { locale, page } = Route.useParams();
    if (!isLocaleCode(locale) || !isSitePage(page)) throw notFound();
    return <ArticlePage locale={locale} kind={page} />;
  },
});
