import { Flag } from "@/components/Flag";
import { claudeAccess } from "@/lib/claude-regions";
import type { ClaudeAccessCopy } from "@/i18n/claude-access";
import type { PurityCopy } from "@/i18n/purity";
import type { IpPurityReport } from "@/lib/ip-purity";
import type { LocaleCode } from "@/i18n/messages";
import { routeObservationMessage } from "@/lib/route-observation";

export type LeakState = {
  status: "idle" | "loading" | "same" | "none" | "unknown" | "dual-stack" | "exposed";
  ip?: string;
  report?: IpPurityReport | null;
  ips?: string[];
  reason?: string;
  observedAt?: string;
};
const dimensionKeys = ["identity", "anonymity", "abuse", "blacklist", "attack", "local"] as const;
export function accessLabel(verdict: ReturnType<typeof claudeAccess>, access: ClaudeAccessCopy) {
  return verdict === "allowed" ? access.allowed : verdict === "blocked" ? access.blocked : access.unknown;
}
export function accessTone(verdict: ReturnType<typeof claudeAccess>) {
  return verdict === "allowed" ? "text-ok" : verdict === "blocked" ? "text-warn" : "text-muted";
}

export function PurityPanel({ report, leak, text, access, locale = "zh" }: { report: IpPurityReport | null; leak: LeakState; text: PurityCopy; access: ClaudeAccessCopy; locale?: LocaleCode }) {
  const zh = locale === "zh" || locale === "zh-HK";
  const available = report?.ok === true;
  const marks = available ? report.flags.map(flag => text.flags[flag]) : [];
  const incomplete = available && Object.values(report.flagChecks).some(value => value === null);
  const flagValue = marks.length ? `${marks.join(" · ")}${incomplete ? ` · ${text.unknownFlags}` : ""}` : available && !incomplete ? text.cleanFlags : text.unknownFlags;
  const routeCopy = routeObservationMessage(leak, locale, access);
  const hasDimensions = available && dimensionKeys.some(key => report.dimensions[key] !== null);
  return <div className="network-evidence">
    {available ? <>
      <div className="network-evidence-header"><div>{report.countryCode && <Flag code={report.countryCode} />}<strong>{report.location || (zh ? "IP 归属地未取得" : "IP location unavailable")}</strong></div><span className="squircle result-status bg-surface-muted text-muted">{text.sourceStatuses[report.source.status]}</span></div>
      <dl className="purity-details">
        <Row label={access.visitorIp} value={report.ip} mono />
        <Row label={text.network} value={[report.asn, report.asnName || report.isp].filter(Boolean).join(" · ") || null} />
        <Row label={text.type} value={report.ipType ? text.ipTypes[report.ipType] ?? report.ipType : report.networkType} />
        <Row label={zh ? "匿名网络线索" : "Anonymity observation"} value={report.anonymous === true ? (zh ? "供应商标记为匿名网络，具体类型仍需核对" : "Provider reports an anonymous network; verify its type") : report.anonymous === false ? (zh ? "供应商未标记（不能证明不存在）" : "Not flagged by provider; absence is not proof") : null} />
        <Row label={text.marks} value={flagValue} />
        <Row label={zh ? "供应商声誉分" : "Provider reputation score"} value={report.score === null ? null : `${report.score}/100`} missing={text.unavailableScore} />
      </dl>
      {report.source.error ? <p className="network-source-note text-warn" role="status">{text.sourceErrors[report.source.error] ?? text.sourceStatuses.error}</p> : null}
      {hasDimensions ? <div className="purity-dimensions">{dimensionKeys.map(key => <div key={key} className="squircle purity-dimension"><span>{text.dimensions[key]}</span><strong>{report.dimensions[key] ?? "—"}</strong></div>)}</div> : null}
      <div className="network-source-note"><span>{zh ? "访问 IP 来源" : "IP observed through"}：{report.ipSource === "trusted-header" ? (zh ? "已配置的可信入口" : "configured trusted ingress") : report.ipSource === "socket" ? (zh ? "请求连接" : "request connection") : zh ? "候选地址查询" : "candidate lookup"}</span>{report.source.fetchedAt ? <span>{zh ? "查询时间" : "Queried"}：{new Date(report.source.fetchedAt).toLocaleString(locale === "zh" ? "zh-CN" : locale)}</span> : null}<p>{text.source}</p></div>
    </> : <div className="squircle network-unavailable" role="status"><strong>{report?.ok === false ? (zh ? "公网出口尚未确认" : "Public exit is not confirmed") : text.loading}</strong><p>{zh ? "不会把服务器自身的出口当成你的 IP。浏览器检查可继续，网络归属和供应商标记暂时保持未知。" : "The server's own exit is not substituted for yours. Browser checks continue; IP intelligence stays unknown."}</p><a href="/methodology">{zh ? "查看数据获取方式" : "How this data is collected"} ↗</a></div>}
    <section className="network-route-observation"><div className="section-heading"><h4>{access.leakTitle}</h4><span className="squircle result-status bg-surface-muted text-muted">STUN / ICE</span></div><p>{routeCopy}</p>{leak.ips?.length ? <div className="network-candidates">{leak.ips.map(ip => <code className="squircle" key={ip}>{ip}</code>)}</div> : null}</section>
  </div>;
}
function Row({ label, value, mono = false, missing = "—" }: { label: string; value: string | null; mono?: boolean; missing?: string }) {
  return <div className="purity-detail-row"><dt>{label}</dt><dd className={value === null ? "text-muted" : mono ? "network-address" : ""}>{value ?? missing}</dd></div>;
}
