import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { NewsList } from "@/components/home/NewsList";
export const Route = createFileRoute("/news/")({
  head: () => ({ meta: [{ title: "Claude 新闻与政策动态｜check.cd" }] }),
  component: () => (
    <SiteFrame>
      <main className="page-content">
        <div className="eyebrow">CLAUDE UPDATES</div>
        <h1 className="page-title">新闻与政策动态</h1>
        <p className="page-description">
          中文整理 Claude 的产品、新闻与政策变化，点击标题即可在本站阅读。
        </p>
        <p className="mt-4 text-xs text-muted">
          新闻发布日期与政策生效日期可能不同。新闻更新不会自动改写检查规则。
        </p>
        <div className="mt-10">
          <NewsList />
        </div>
      </main>
      <SiteFooter />
    </SiteFrame>
  ),
});
