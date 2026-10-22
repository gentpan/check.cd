import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { articles } from "@/content/articles";
export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "基础文章｜check.cd" },
      {
        name: "description",
        content: "Claude 地区、注册、支付、使用规则和环境检测的基础文章。",
      },
    ],
  }),
  component: () => (
    <SiteFrame>
      <main className="page-content">
        <div className="eyebrow">KNOW THE BASICS</div>
        <h1 className="page-title">基础文章</h1>
        <p className="page-description">
          把公开规则讲清楚，也把检测能做到的边界讲清楚。
        </p>
        <div className="article-grid mt-12">
          {articles.map((a) => (
            <a
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="article-link squircle"
            >
              <span className="squircle result-status bg-accent-bg text-xs text-accent">{a.category}</span>
              <h2 className="mt-2 text-xl font-medium">
                {a.title}
                <span className="float-right text-muted">↗</span>
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                {a.description}
              </p>
              <p className="mt-3 text-xs text-muted">
                依据官方资料 · 核对 {a.updatedAt}
              </p>
            </a>
          ))}
        </div>
      </main>
      <SiteFooter />
    </SiteFrame>
  ),
});
