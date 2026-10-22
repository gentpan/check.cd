import type { SummaryPayload } from "../server/ai-summary";

/** Deterministic fallback: describe missing evidence, never invent an overall safety verdict. */
export function templateSummary(payload: SummaryPayload): string {
  const { locale, quality, total, hits, purity } = payload;
  const missing = quality?.unknown;
  const zh = locale === "zh" || locale === "zh-HK";
  if (zh) {
    const parts = [quality ? `本次 ${total} 项检查中，${quality.available} 项已取得数据，${missing} 项未取得，${quality.pending} 项仍在等待。` : `本次包含 ${total} 项检查，数据覆盖情况未提供，不能据此判定全部正常。`];
    parts.push(purity ? `已记录当前网络出口信息${purity.location ? `（${purity.location}）` : "，归属地尚未确认"}。${purity.score == null ? "情报源未提供声誉评分，不补成 0 分。" : `供应商声誉评分为 ${purity.score}/100，不是账号安全分。`}` : "尚未取得可信的出口 IP 情报，网络相关结论保留未知。");
    parts.push(hits.length ? `需核对 ${hits.length} 项：${hits.slice(0, 3).map(hit => hit.label).join("、")}。${hits[0].fix ?? "先结合实际设置核对来源和上下文。"}` : "已取得的数据中暂无需核对的计分项；这不代表缺失项目已经通过。");
    if (payload.unknownLabels?.length) parts.push(`未取得：${payload.unknownLabels.slice(0, 4).join("、")}${payload.unknownLabels.length > 4 ? "等" : ""}。`);
    parts.push("实际所在地、注册与付款条件须按对应产品的当前官方规则另行核对。");
    return parts.join("\n");
  }
  if (locale === "ru") return [quality ? `Получены данные ${quality.available} из ${total} проверок; недоступно ${missing}, ожидается ${quality.pending}.` : `Всего проверок: ${total}; покрытие не подтверждено.`, purity ? `IP-информация получена. ${purity.score == null ? "Оценка поставщиком не предоставлена." : `Оценка поставщика: ${purity.score}/100.`}` : "Достоверная информация об IP недоступна.", `Требуют проверки: ${hits.length}. Недоступные данные не означают успешную проверку.`, "Язык и часовой пояс не нужно подгонять под IP. Условия аккаунта проверяются по актуальным официальным правилам продукта."].join("\n");
  return [quality ? `Data obtained for ${quality.available}/${total} checks; ${missing} unavailable and ${quality.pending} pending.` : `${total} checks; evidence coverage was not provided.`, purity ? `IP information is available. ${purity.score == null ? "The provider supplies no reputation score." : `Provider reputation score: ${purity.score}/100.`}` : "Trusted network-exit intelligence is unavailable.", `${hits.length} items need review. Missing checks have not passed.`, "Check actual location, registration and payment conditions against current product-specific official rules. Browser settings do not establish account safety."].join("\n");
}
