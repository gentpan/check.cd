import type { SignalResult, SignalVerdict } from "../detection/types";

export type ReportSignal = SignalResult & { verdict?: SignalVerdict };

/** Missing evidence is never a passing check, including during incremental runs. */
export function signalVerdict(signal: SignalResult | undefined, ready: boolean, complete: boolean): SignalVerdict {
  if (!ready) return "pending";
  if (!signal) return complete ? "unknown" : "pending";
  if (signal.availability === "unavailable" || !signal.value?.trim()) return "unknown";
  if (signal.evidence === "inferred") return "info";
  if (signal.contribution > 0) return signal.score >= .7 ? "hit" : "warn";
  return signal.weight === 0 ? "info" : "clear";
}

export function reportQuality(signals: ReportSignal[]) {
  const total = signals.length;
  const pending = signals.filter(signal => signal.verdict === "pending").length;
  const unknown = signals.filter(signal => signal.verdict === "unknown").length;
  const available = signals.filter(signal => signal.verdict && signal.verdict !== "pending" && signal.verdict !== "unknown").length;
  const attention = signals.filter(signal => signal.verdict === "hit" || signal.verdict === "warn").length;
  const inferred = signals.filter(signal => signal.evidence === "inferred" && signal.verdict === "info").length;
  return { total, available, pending, unknown, attention, inferred, coverage: total ? Math.round(available / total * 100) : 0 };
}
