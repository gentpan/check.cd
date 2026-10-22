import { createFileRoute, notFound } from "@tanstack/react-router";
import { getNewsArticle } from "@/lib/news";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { SiteFooter } from "@/components/layout/SiteFooter";
export const Route = createFileRoute("/news/$id")({
  loader: async ({params}) => {
    if (!/^[a-zA-Z0-9-]{1,64}$/.test(params.id)) throw notFound();
    const article = await getNewsArticle({data:{id:params.id}});
    if (!article) throw notFound();
    return article;
  },
  head: ({loaderData: article}) => ({
    meta:[{title:`${article?.title ?? "新闻"}｜check.cd`},{name:"description",content:article?.summary ?? ""}],
    links:article ? [{rel:"canonical",href:`https://check.cd/news/${encodeURIComponent(article.id)}`}] : [],
  }),
  component: NewsArticle,
});
function NewsArticle() {
  const article = Route.useLoaderData();
  return <SiteFrame><main className="page-content max-w-[800px]">
    <a className="text-sm text-accent" href="/news">← 新闻与政策动态</a>
    <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-muted"><span className="squircle result-status bg-surface-muted px-3 py-1">{article.evidence === "official" ? "官方消息 · 中文整理" : "媒体报道 · 中文整理"}</span><time dateTime={article.publishedAt}>{article.publishedAt}</time>{article.effectiveAt && <span>政策生效：{article.effectiveAt}</span>}</div>
    <h1 className="page-title">{article.title}</h1>
    <p className="page-description">{article.summary}</p>
    <article className="mt-10 space-y-6 border-t border-line pt-8">{article.body.map((paragraph,index) => <p key={index} className="text-[16px] leading-8 text-ink">{paragraph}</p>)}</article>
    <aside className="mt-12 squircle sq-card border border-line bg-surface p-6"><h2 className="text-sm font-medium">来源</h2><p className="mt-2 text-sm leading-7 text-muted">本站根据公开资料整理，内容为中文摘要，非原文全文转载。</p><a href={article.url} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all text-sm text-accent">{article.source} · 查看原始资料 ↗</a></aside>
    <a href="/news" className="mt-8 inline-block text-sm text-accent">返回新闻列表 →</a>
  </main><SiteFooter/></SiteFrame>;
}
