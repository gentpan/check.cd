import type { IpPurityReport } from "@/lib/ip-purity";
import type { reportQuality } from "@/lib/report-quality";
import type { LocaleCode } from "@/i18n/messages";

type Props = { quality: ReturnType<typeof reportQuality>; network: IpPurityReport | null; measuredAt: string | null; scanning: boolean; locale: LocaleCode };

export function ReportOverview({ quality, network, measuredAt, scanning, locale }: Props) {
  const zh = locale === "zh" || locale === "zh-HK";
  const title = scanning ? (zh ? "正在记录本次环境" : "Recording your environment") : quality.unknown ? (zh ? "检查完成，缺失信息已标出。" : "Checks finished. Missing evidence is marked.") : (zh ? "本次环境快照已就绪。" : "Your environment snapshot is ready.");
  return <section className="report-overview" aria-labelledby="report-overview-title">
    <div className="report-overview-top"><span className="landing-eyebrow">ENVIRONMENT SNAPSHOT</span><span className="squircle result-status bg-surface-muted text-muted" role="status">{scanning ? (zh ? "采样中" : "Measuring") : (zh ? "本次采样已结束" : "Measurement finished")}</span></div>
    <h2 id="report-overview-title">{title}</h2>
    <p className="report-overview-description">{zh ? "区分浏览器实测、第三方情报和推断。未取得的数据保留未知，不换算成账号安全分。" : "Browser measurements, provider intelligence and inferences stay distinct. Missing data is unknown; no account safety score is calculated."}</p>
    <div className="report-metrics" aria-live="polite" aria-atomic="true">
      <div className="squircle report-metric"><span>{zh ? "已取得数据" : "Data available"}</span><strong>{quality.available}<small> / {quality.total}</small></strong><p>{zh ? "表示数据覆盖，不代表检查全部通过" : "Evidence coverage, not a pass rate"}</p></div>
      <div className="squircle report-metric"><span>{zh ? "需要核对" : "Needs review"}</span><strong className={quality.attention ? "text-warn" : ""}>{quality.attention}</strong><p>{zh ? "有来源的技术线索，结合实际设置核对" : "Review observations in their context"}</p></div>
      <div className="squircle report-metric"><span>{zh ? "未取得 / 等待中" : "Unavailable / pending"}</span><strong>{quality.unknown}<small> / {quality.pending}</small></strong><p>{zh ? "权限、能力限制和缺失情报单独记录" : "Policy limits and missing intelligence remain visible"}</p></div>
    </div>
    <div className="report-evidence-strip">
      <dl><div><dt>{zh ? "访问本站的出口" : "This site exit"}</dt><dd>{network?.ok ? network.ip : zh ? "公网出口尚未确认" : "Public exit not confirmed"}</dd></div><div><dt>{zh ? "网络情报" : "IP intelligence"}</dt><dd>{network?.ok && ["live", "cached"].includes(network.source.status) ? `IPinfo · ${network.source.status === "cached" ? (zh ? "5 分钟内缓存" : "cached within 5 min") : zh ? "本次查询" : "live query"}` : zh ? "尚未取得，保留未知" : "Unavailable; kept unknown"}</dd></div><div><dt>{zh ? "采样完成时间" : "Measured at"}</dt><dd>{measuredAt ? new Date(measuredAt).toLocaleTimeString(locale === "zh-HK" ? "zh-HK" : locale === "zh" ? "zh-CN" : locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" }) : scanning ? (zh ? "采样中" : "In progress") : "—"}</dd></div></dl>
      <a href="/methodology">{zh ? "检测方法与局限" : "Methods & limitations"}<span aria-hidden="true">↗</span></a>
    </div>
  </section>;
}
