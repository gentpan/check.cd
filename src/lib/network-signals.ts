import type { IpPurityReport } from "../server/ip-purity";
import type { SignalResult } from "../detection/types";

/** A transport address, a provider classification and a provider score are independent evidence. */
export function networkSignals(report: IpPurityReport | null, labels: Record<string, string>, unknown: string, flagNames: Record<string, string>, wording: { partial: string; clear: string; anonymous: string }): SignalResult[] {
  if (!report?.ok) return [];
  const make = (id: string, value: string | null, review = false): SignalResult => ({
    id, label: labels[id] ?? id, value: value || unknown, source: "server", category: "network",
    score: review ? 1 : 0, weight: review ? 1 : 0, contribution: review ? 1 : 0,
    availability: value ? "available" : "unavailable", evidence: "observed",
  });
  const checks = report.flagChecks;
  const relevant = Object.entries(checks).filter(([name]) => name !== "mobile");
  const labelsFound = report.flags.filter(flag => flag !== "mobile").map(flag => flagNames[flag] ?? flag);
  const incomplete = relevant.some(([, value]) => value === null);
  const anonymous = report.anonymous === true;
  const markings = labelsFound.length ? labelsFound.join(" · ") + (incomplete ? ` · ${wording.partial}` : "") : anonymous ? wording.anonymous + (incomplete ? ` · ${wording.partial}` : "") : !incomplete ? wording.clear : null;
  const review = anonymous || ["vpn", "proxy", "residentialProxy", "tor", "abuser"].some(flag => checks[flag as keyof typeof checks] === true);
  return [
    make("ipAddress", report.ip),
    make("country", report.countryCode ? report.location || report.countryCode : null),
    make("ipType", report.ipType || report.networkType),
    make("ipMarks", markings, review),
    // Do not synthesize an Anthropic subscription assessment from an IP classification.
    make("aiSubscription", report.aiSubscription),
  ];
}
