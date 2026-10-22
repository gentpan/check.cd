import { useEffect, useState } from "react";
import { getNews } from "@/lib/news";
import { seedNews, type NewsItem } from "@/content/news";
export function NewsList({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>(
    [...seedNews].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  );
  const [last, setLast] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    getNews()
      .then((data) => {
        if (active) {
          setItems(data.items);
          setLast(data.lastSuccess);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">中文整理 · 日期 · 来源</p>
        <span className="text-xs text-muted">
          {error
            ? "更新服务暂不可用，显示已核对资料"
            : last
              ? `最近检索 ${last.slice(0, 10)}`
              : "初始资料已核对；等待首次自动检索"}
        </span>
      </div>
      <div className={compact ? "grid gap-4 md:grid-cols-3" : "news-list"}>
        {(compact ? items.slice(0, 3) : items).map((item) => (
          <article key={item.id} className="news-card squircle">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="squircle result-status bg-surface-muted px-2 py-1">
                {item.evidence === "official" ? "官方来源" : "媒体报道"}
              </span>
              <time>{item.publishedAt}</time>
              {item.effectiveAt && <span>政策生效：{item.effectiveAt}</span>}
            </div>
            <h3 className="mt-4 text-lg font-medium leading-7">
              <a href={`/news/${encodeURIComponent(item.id)}`}>
                {item.title} <span className="text-accent">→</span>
              </a>
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{item.summary}</p>
            <p className="mt-4 text-xs text-muted">{item.source}</p>
          </article>
        ))}
      </div>
      {items.length === 0 && (
        <p className="py-10 text-sm text-muted">暂时没有已发布的新闻。</p>
      )}
    </div>
  );
}
