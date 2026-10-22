import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getServiceStatus } from "@/lib/service-status";
const labels: Record<string,string> = {none:"所有服务运行正常",minor:"部分服务性能下降",major:"部分服务发生故障",critical:"服务严重中断",operational:"运行正常",degraded_performance:"性能下降",partial_outage:"部分中断",major_outage:"严重中断",under_maintenance:"维护中",investigating:"调查中",identified:"已定位问题",monitoring:"恢复观察中",resolved:"已解决",postmortem:"事后分析",scheduled:"计划维护",in_progress:"维护中",verifying:"验证中",completed:"维护完成"};
const label = (value:string) => labels[value] || "状态待确认";
const time = (value:string) => value ? `${value.slice(0,19).replace("T"," ")} UTC` : "尚未取得";
export const Route = createFileRoute("/status/")({
  head: () => ({meta:[{title:"Claude 服务状态｜check.cd"},{name:"description",content:"查看 Claude 官方服务状态、故障事件和计划维护。"}],links:[{rel:"canonical",href:"https://check.cd/status"}]}),
  loader: () => getServiceStatus(),
  component: StatusPage,
});
function StatusPage() {
  const initial = Route.useLoaderData();
  const [data,setData] = useState(initial);
  const [refreshing,setRefreshing] = useState(false);
  const [clientError,setClientError] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const refresh = async () => {
    if (busy.current) return;
    busy.current=true; setRefreshing(true);
    try { const next=await getServiceStatus(); if (alive.current) {setData(next);setClientError(false);} }
    catch { if (alive.current) setClientError(true); }
    finally { busy.current=false; if (alive.current) setRefreshing(false); }
  };
  useEffect(() => {
    alive.current=true;
    const timer=window.setInterval(()=>{if(!document.hidden) void refresh();},60_000);
    return ()=>{alive.current=false;window.clearInterval(timer);};
  },[]);
  const stale=data.stale||clientError;
  const tone = stale ? "text-warn" : data.indicator === "none" ? "text-ok" : data.indicator === "unknown" ? "text-muted" : "text-risk";
  return <SiteFrame><main className="page-content status-page"><div className="eyebrow">CLAUDE STATUS</div><div className="section-heading mt-3"><h1 className="page-title mt-0">Claude 服务状态</h1><button className="primary-btn squircle" onClick={()=>void refresh()} disabled={refreshing}>{refreshing?"刷新中…":"刷新状态"}</button></div><p className="page-description">同步 Claude 官方公布的服务状态，帮助区分服务故障与个人网络、账号问题。</p><section className="status-overview squircle"><p className="text-xs text-muted">当前官方状态</p><h2 className={`mt-3 text-2xl font-medium ${tone}`}>{stale ? data.components.length ? "状态信息待更新" : "状态暂不可用" : label(data.indicator)}</h2><p className="mt-3 text-sm text-muted">最近获取：{time(data.fetchedAt)} · 页面每分钟自动更新</p>{stale ? <p role="alert" className="mt-3 text-sm text-warn">{data.error || "网络请求失败，显示上次取得的信息。"}</p>:null}<a href="https://status.claude.com/" target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-accent">Claude 官方状态页 ↗</a></section><section className="mt-8"><h2 className="text-lg font-medium">服务组件</h2><div className="status-components mt-4">{data.components.map(c=><div className="status-component squircle" key={c.id}><h3>{c.name}</h3><span className={`squircle result-status bg-surface-muted ${stale ? "text-muted" : c.status === "operational" ? "text-ok" : "text-warn"}`}>{label(c.status)}{stale?"（上次记录）":""}</span></div>)}</div>{!data.components.length?<p className="mt-4 text-sm text-muted">暂无可确认的服务数据。</p>:null}</section><section className="mt-8"><h2 className="text-lg font-medium">当前事件</h2><div className="status-events">{data.incidents.length ? data.incidents.map(i=><article className="squircle status-event" key={i.id}><span className="squircle result-status bg-warn-bg text-warn">{label(i.status)}</span><h3><a href={`/status/${i.id}`}>{i.name} →</a></h3><p>{time(i.updatedAt)}</p></article>) : <p className="py-5 text-sm text-muted">{stale ? "当前事件尚待核实。" : "官方当前未报告进行中的故障事件。"}</p>}</div></section><section className="mt-8"><h2 className="text-lg font-medium">计划维护</h2><div className="status-events">{data.maintenances.length ? data.maintenances.map(i=><article className="squircle status-event" key={i.id}><span className="squircle result-status bg-surface-muted text-muted">{label(i.status)}</span><h3><a href={`/status/${i.id}`}>{i.name} →</a></h3><p>{i.scheduledFor ? `计划开始：${time(i.scheduledFor)}` : `最近更新：${time(i.updatedAt)}`}{i.scheduledUntil ? ` · 结束：${time(i.scheduledUntil)}` : ""}</p></article>) : <p className="py-5 text-sm text-muted">{stale ? "维护信息尚待核实。" : "官方当前未公布计划维护。"}</p>}</div></section><section className="mt-8"><h2 className="text-lg font-medium">最近已解决的事件</h2><div className="status-events">{data.history.map(i=><article className="squircle status-event" key={i.id}><span className="squircle result-status bg-surface-muted text-muted">{label(i.status)}</span><h3><a href={`/status/${i.id}`}>{i.name} →</a></h3><p>{time(i.updatedAt)}</p></article>)}{!data.history.length && !data.historyError ? <p className="py-4 text-sm text-muted">暂无已解决事件记录。</p> : null}{data.historyError?<p className="py-4 text-sm text-warn">历史事件暂时无法更新。</p>:null}</div></section><p className="mt-8 border-t border-line pt-5 text-sm text-muted">来源：status.claude.com。状态由官方提供，可能存在公布延迟；不代表你的账号可用性或所在网络一定正常。官方最近更新：{time(data.updatedAt)}。</p></main><SiteFooter /></SiteFrame>;
}
