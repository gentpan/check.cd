import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { articles } from "@/content/articles";
export const Route = createFileRoute("/articles/$slug")({
  beforeLoad: ({ params }) => {
    if (!articles.some((a) => a.slug === params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const a = articles.find((a) => a.slug === params.slug);
    return {
      meta: [
        { title: `${a?.title ?? "基础文章"}｜check.cd` },
        { name: "description", content: a?.description ?? "" },
      ],
    };
  },
  component: Article,
});
function Article() {
  const { slug } = Route.useParams();
  const a = articles.find((a) => a.slug === slug)!;
  return (
    <SiteFrame>
      <main className="page-content max-w-[800px]">
        <a className="text-sm text-accent" href="/articles">
          ← 基础文章
        </a>
        <div className="eyebrow mt-10">{a.category}</div>
        <h1 className="page-title">{a.title}</h1>
        <p className="page-description">{a.description}</p>
        <p className="mt-4 text-xs text-muted">
          依据官方资料 · 核对 {a.updatedAt} · 独立项目，非 Anthropic 官方服务
        </p>
        <div className="mt-10 space-y-9">
          {a.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-medium">{s.title}</h2>
              <p className="mt-4 text-[15px] leading-8 text-muted">{s.body}</p>
            </section>
          ))}
        </div>
        <aside className="mt-12 squircle sq-card border border-line p-6">
          <h2 className="text-sm font-medium">来源与进一步阅读</h2>
          <ul className="mt-3 space-y-3">
            {a.sources.map((s) => (
              <li key={s.url}>
                <a
                  className="text-sm text-accent"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <a href="/#account-check" className="primary-btn squircle mt-8">
          核对我的使用条件 →
        </a>
      </main>
      <SiteFooter />
    </SiteFrame>
  );
}
