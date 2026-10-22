type RouteState = { status: "idle" | "loading" | "same" | "none" | "unknown" | "dual-stack" | "exposed"; ips?: string[]; reason?: string };
type RouteCopy = { leakSame: string; leakExposed: string; leakLoading: string; leakNone: string };

/** Incomplete sampling and a missing reference address must never sound like a negative finding. */
export function routeObservationMessage(state: RouteState, locale: string, copy: RouteCopy) {
  const zh = locale === "zh" || locale === "zh-HK";
  const ru = locale === "ru";
  if (state.status === "idle" || state.status === "loading") return copy.leakLoading;
  if (state.status === "same") return copy.leakSame;
  if (state.status === "exposed") return copy.leakExposed;
  if (state.status === "dual-stack") return zh ? "观察到不同地址族，可能是 IPv4 / IPv6 双栈；不能据此判断泄漏。" : ru ? "Наблюдаются разные семейства адресов: возможен двойной стек IPv4 / IPv6. Это не доказывает утечку." : "Different address families observed; possible IPv4 / IPv6 dual-stack, not proof of a leak.";
  if (state.status === "none") return copy.leakNone;
  if (state.reason === "visitor-ip-unavailable") return zh ? `浏览器记录到 ${state.ips?.length ?? 0} 个公网候选，但未取得本站可信出口，暂时无法比较网络路径。` : ru ? "Нет подтверждённого адреса HTTPS-запроса для сравнения с кандидатами WebRTC." : "No trusted request exit is available for comparison with the browser's public candidates.";
  if (state.ips?.length) return zh ? "采样未完整结束。已保留可见公网候选，暂时无法判断是否存在额外路径。" : ru ? "Сбор не завершён. Найденные адреса сохранены; сравнение маршрутов остаётся неопределённым." : "Sampling did not complete. Public candidates are retained; additional routes remain undetermined.";
  return zh ? "未取得可比较的网络采样，无法判断是否存在额外路径。无结果不表示没有其他出口。" : ru ? "Сравнимые сетевые данные недоступны. Это не доказывает отсутствие других маршрутов." : "Comparable network evidence is unavailable. This does not establish that no other route exists.";
}
