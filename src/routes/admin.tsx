import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/layout/SiteFrame";
import {
  getAdminState,
  moderateNews,
  refreshAdminNews,
  saveNewsSettings,
} from "@/lib/news";
type State = Awaited<ReturnType<typeof getAdminState>>;
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "管理后台｜check.cd" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});
function Admin() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => setState(await getAdminState({ data: { token } }));
  const perform = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setMessage("");
    try {
      await work();
      await load();
      setMessage("操作已完成。");
    } catch {
      if (state) await load().catch(() => {});
      setMessage(
        state
          ? "操作未完成，请查看同步状态；可能是 API 权限、余额或网络问题。"
          : "管理密钥无效，或服务暂不可用。",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SiteFrame>
      <main className="page-content">
        <div className="eyebrow">EDITORIAL DESK</div>
        <h1 className="page-title">新闻管理</h1>
        <p className="page-description">
          管理自动检索、发布状态与来源。API
          密钥保存在服务端，网页只显示配置状态。
        </p>
        {!state ? (
          <form
            className="mt-10 max-w-lg space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void perform(async () => {});
            }}
          >
            <label className="form-field">
              <span>管理密钥</span>
              <input
                className="squircle site-field"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="服务器 ADMIN_TOKEN"
                required
              />
            </label>
            <p className="text-xs leading-6 text-muted">
              在服务器环境变量或本地 .env.local 中查看
              ADMIN_TOKEN。管理密钥仅留在本次页面内存。
            </p>
            <button className="primary-btn squircle" disabled={busy}>
              进入管理后台
            </button>
          </form>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted">
                {state.aiConfigured
                  ? `AI 已配置 · ${state.model}`
                  : "AI 未配置"}
              </span>
              <button
                className="tab-btn squircle"
                onClick={() => {
                  setState(null);
                  setToken("");
                  setMessage("");
                }}
              >
                退出
              </button>
            </div>
            <form
              className="check-panel squircle mt-5 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                void perform(() =>
                  saveNewsSettings({
                    data: {
                      token,
                      enabled: state.enabled,
                      autoPublish: state.autoPublish,
                      intervalHours: state.intervalHours,
                    },
                  }),
                );
              }}
            >
              <h2 className="text-lg font-medium">自动更新</h2>
              <div className="mt-5 flex flex-wrap gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.enabled}
                    onChange={(e) =>
                      setState({ ...state, enabled: e.target.checked })
                    }
                  />
                  开启自动检索
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.autoPublish}
                    onChange={(e) =>
                      setState({ ...state, autoPublish: e.target.checked })
                    }
                  />
                  官方来源自动发布
                </label>
              </div>
              <label className="form-field mt-5 max-w-xs">
                <span>检索间隔</span>
                <select
                  className="squircle site-field"
                  value={state.intervalHours}
                  onChange={(e) =>
                    setState({
                      ...state,
                      intervalHours: Number(e.target.value),
                    })
                  }
                >
                  {[6, 12, 24, 48, 168].map((h) => (
                    <option key={h} value={h}>
                      每 {h} 小时
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-4 text-xs leading-6 text-muted">
                每轮最多 3
                次网页搜索。媒体报道进入待审核。服务需持续运行，持久保存
                data/news.json；多实例或无常驻进程时使用外部定时任务。
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="primary-btn squircle" disabled={busy}>
                  保存设置
                </button>
                <button
                  type="button"
                  className="tab-btn squircle"
                  disabled={busy || !state.aiConfigured}
                  onClick={() =>
                    void perform(() => refreshAdminNews({ data: { token } }))
                  }
                >
                  {busy ? "处理中…" : "立即搜索并更新"}
                </button>
              </div>
            </form>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["最近尝试", state.lastAttempt],
                ["最近成功", state.lastSuccess],
                [
                  "同步状态",
                  state.running ? "运行中" : state.error || "等待下次更新",
                ],
              ].map(([title, value]) => (
                <div className="score-card squircle" key={title}>
                  <div className="text-xs text-muted">{title}</div>
                  <p className="mt-3 break-all text-sm">
                    {value ?? "尚未执行"}
                  </p>
                </div>
              ))}
            </div>
            <section className="mt-10">
              <h2 className="text-xl font-medium">
                内容列表 · {state.items.length}
              </h2>
              <div className="admin-content-list mt-5">
                {[...state.items].reverse().map((item) => (
                  <article className="squircle admin-content-card" key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-medium"
                      >
                        {item.title} ↗
                      </a>
                      <span className="squircle result-status bg-surface-muted text-xs text-muted">
                        {item.evidence === "official" ? "官方" : "报道"} ·{" "}
                        {item.status === "published"
                          ? "已发布"
                          : item.status === "draft"
                            ? "待审核"
                            : "已隐藏"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {item.publishedAt} · {item.source}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {(["published", "draft", "hidden"] as const).map(
                        (status) => (
                          <button
                            className="tab-btn squircle"
                            key={status}
                            disabled={busy || status === item.status}
                            onClick={() =>
                              void perform(() =>
                                moderateNews({
                                  data: { token, id: item.id, status },
                                }),
                              )
                            }
                          >
                            {status === "published"
                              ? "发布"
                              : status === "draft"
                                ? "待审核"
                                : "隐藏"}
                          </button>
                        ),
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {message && (
          <p className="mt-5 text-sm text-accent" role="status">
            {message}
          </p>
        )}
      </main>
    </SiteFrame>
  );
}
