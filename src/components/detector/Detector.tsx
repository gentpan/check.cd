// Evidence-first report with actual progress, explicit unavailable states and optional AI explanation.
import { useEffect, useMemo, useRef, useState } from "react";
import { detectionConfig, signalCategoryOrder } from "@/detection/config";
import { signalsScore, withTimeout, type DetectionProbes, type SignalView } from "@/detection/client-engine";
import { detectorLocaleText } from "@/detection/locale";
import { runDetection, reconcileDetection, type DetectionRunResult } from "@/detection/runner";
import type { SignalCategory, SignalResult, SignalVerdict } from "@/detection/types";
import { messages, type LocaleCode } from "@/i18n/messages";
import { purityCopy } from "@/i18n/purity";
import { claudeAccessCopy } from "@/i18n/claude-access";
import { observeWebRtcIps } from "@/detection/leak-ip";
import { claudeAccess, CLAUDE_REGION_POLICY } from "@/lib/claude-regions";
import { compareNetworkObservation } from "@/lib/network-observation";
import { samePublicIp } from "@/lib/public-ip";
import { networkSignals } from "@/lib/network-signals";
import { reportQuality, signalVerdict } from "@/lib/report-quality";
import { routeObservationMessage } from "@/lib/route-observation";
import { fetchCheckedIp, fetchIpPurity, type IpPurityReport } from "@/lib/ip-purity";
import { fetchAiSummary, hashSummaryPayload, readSummaryCache, writeSummaryCache, type SummaryPayload } from "@/lib/ai-summary";
import { ActualLocation } from "./ActualLocation";
import { ReportOverview } from "./ReportOverview";
import { SignalCard } from "./SignalCard";
import { LeakState, PurityPanel } from "./PurityPanel";

type Props = { locale?: LocaleCode; onComplete?: (done: boolean) => void };

type SignalMeta = { id: string; weight: number; source: SignalResult["source"]; category: SignalCategory };


export function CategoryIcon({ category }: { category: SignalCategory }) {
  const paths: Record<SignalCategory, string> = {
    network: "M12 3a9 9 0 1 0 9 9M12 7v5l3 3M21 3l-6 6M15 3h6v6",
    browser: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 4h18M6.5 7.5v.01M9 7.5v.01",
    device: "M7 8h10v8H7zM4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm5 16h6",
    runtime: "M12 8v4l2.5 2.5M12 21a9 9 0 1 1 9-9M17 3.5l1.5 1.5L21 3.5",
    consistency: "M7 16V8l5-4 5 4v8l-5 4-5-4Zm5-12v20M7 8l10 8M17 8 7 16",
  };
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[category]} />
    </svg>
  );
}

export function Detector({ locale = "zh", onComplete }: Props) {
  const copy = messages[locale].detector;
  const aiCopy = messages[locale].aiSummary;
  const purityText = purityCopy[locale];
  const detectorText = detectorLocaleText[locale];
  const accessText = claudeAccessCopy[locale];
  const [result, setResult] = useState<DetectionRunResult | null>(null);
  const [purity, setPurity] = useState<IpPurityReport | null>(null);
  const [leak, setLeak] = useState<LeakState>({ status: "idle" });
  const [phase, setPhase] = useState<"scanning" | "done">("scanning");
  const [progressSignals, setProgressSignals] = useState<SignalResult[]>([]);
  const [measuredAt, setMeasuredAt] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"all" | SignalCategory>("all");
  const [hitsOnly, setHitsOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ text: string; source: "ai" | "template"; cached: boolean } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const probesRef = useRef<DetectionProbes>({});
  const runIdRef = useRef(0);
  const summaryIdRef = useRef(0);
  const runCheckRef = useRef<() => Promise<void>>(async () => {});
  const generateSummaryRef = useRef<(force?: boolean) => Promise<void>>(async () => {});

  useEffect(() => { onComplete?.(phase === "done"); }, [phase, onComplete]);

  const signalOrder = useMemo<SignalMeta[]>(
    () =>
      Object.entries(detectionConfig.signals)
        .filter(([, config]) => config.enabled)
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([id, config]) => ({ id, weight: config.weight, source: config.source, category: config.category })),
    [],
  );

  const signalMap = useMemo(() => {
    const map = new Map<string, SignalResult>();
    for (const signal of result?.signals ?? progressSignals) map.set(signal.id, signal);
    for (const signal of networkSignals(purity, detectorText.signalLabels, detectorText.unknown, purityText.flags, {
      partial: purityText.unknownFlags, clear: purityText.cleanFlags,
      anonymous: locale === "zh" || locale === "zh-HK" ? "供应商标记为匿名网络，具体类型仍需核对" : "Provider reports an anonymous network; verify its type",
    })) map.set(signal.id, signal);
    const networkMeta = { id: "proxyCountry", label: detectorText.signalLabels.proxyCountry, score: 0, weight: 0, contribution: 0, source: "browser" as const, category: "network" as const, evidence: "observed" as const };
    if (leak.status !== "loading" && leak.status !== "idle") {
      const unavailable = leak.status === "unknown" || leak.status === "none";
      const value = routeObservationMessage(leak, locale, accessText);
      map.set("proxyCountry", { ...networkMeta, value, availability: unavailable ? "unavailable" : "available" });
    }
    return map;
  }, [result, progressSignals, purity, leak, detectorText, purityText, accessText, locale]);

  const views = useMemo<SignalView[]>(() => {
    return signalOrder.map((meta) => {
      const found = signalMap.get(meta.id);
      const ready = revealed.has(meta.id) || phase === "done";
      const base: SignalView = found
        ? { ...found, label: detectorText.signalLabels[found.id] ?? found.label, state: ready ? "done" : "pending" }
        : { id: meta.id, label: detectorText.signalLabels[meta.id] ?? meta.id, value: null, score: 0, weight: meta.weight, contribution: 0, source: meta.source, category: meta.category, state: "pending" };
      let verdict: SignalVerdict = signalVerdict(found, ready, phase === "done");
      if (base.id === "tzIp" && base.value === detectorText.signalValues.waitingIp) {
        verdict = phase === "done" ? "unknown" : "pending";
        if (phase === "done") base.value = locale === "zh" || locale === "zh-HK" ? "未取得 IP 情报，无法交叉核对。" : "IP intelligence unavailable; cross-check not completed.";
      }
      if (verdict !== "pending" && !base.value) base.value = detectorText.unknown;
      return { ...base, verdict };
    });
  }, [signalOrder, signalMap, revealed, phase, detectorText]);

  const rawScore = useMemo(() => Math.min(100, signalsScore([...signalMap.values()])), [signalMap]);
  const quality = reportQuality(views);
  const doneCount = quality.available;
  const hitCount = quality.attention;
  const riskLabel = phase === "scanning" ? detectorText.risk.checking : quality.unknown ? `${quality.unknown} ${locale === "zh" ? "项未取得" : "unavailable"}` : `${hitCount} ${locale === "zh" ? "项需核对" : "need review"}`;
  const accessVerdict = purity?.ok ? claudeAccess(purity.countryCode, purity.regionName) : null;
  const categoryStats = useMemo(() => {
    const stats = new Map<SignalCategory, { total: number; hits: number }>();
    for (const category of signalCategoryOrder) stats.set(category, { total: 0, hits: 0 });
    for (const view of views) {
      const stat = stats.get(view.category);
      if (!stat) continue;
      stat.total += 1;
      if (view.verdict === "hit" || view.verdict === "warn") stat.hits += 1;
    }
    return stats;
  }, [views]);

  const runCheck = async () => {
    const id = runIdRef.current + 1;
    runIdRef.current = id;
    summaryIdRef.current += 1;
    probesRef.current = {};
    const probes = probesRef.current;
    let completedPurity: IpPurityReport | null = null;
    setResult(null);
    setPurity(null);
    setLeak({ status: "loading" });
    setRevealed(new Set());
    setProgressSignals([]);
    setPhase("scanning");
    setMeasuredAt(null);
    setSummary(null);
    setSummaryFailed(false);
    setTab("all");
    setHitsOnly(false);
    setSummaryLoading(false);

    const leakIpsTask = observeWebRtcIps();
    const purityTask = (async () => {
      try {
        const report = await withTimeout(fetchIpPurity({ data: { locale } }), 8000);
        if (runIdRef.current !== id) return;
        completedPurity = report;
        setPurity(report);
        const observation = await leakIpsTask;
        const ips = observation.ips;
        if (runIdRef.current !== id) return;
        if (!report.ok) {
          setLeak({ status: "unknown", reason: "visitor-ip-unavailable", ips, observedAt: observation.observedAt });
          return;
        }
        if (observation.status !== "complete") {
          setLeak({ status: "unknown", reason: observation.status, ips, observedAt: observation.observedAt });
          return;
        }
        const other = ips.find((ip) => !samePublicIp(ip, report.ip));
        if (!other) {
          setLeak({ status: ips.length ? "same" : "none", ips, observedAt: observation.observedAt });
          return;
        }
        try {
          const leaked = await withTimeout(fetchCheckedIp({ data: { locale, ip: other } }), 8000);
          if (runIdRef.current !== id) return;
          setLeak({ status: compareNetworkObservation(report, { ip: other, countryCode: leaked.ok ? leaked.countryCode : null }) === "possible-dual-stack" ? "dual-stack" : "exposed", ip: other, report: leaked.ok ? leaked : null, ips, observedAt: observation.observedAt });
        } catch {
          if (runIdRef.current === id) setLeak({ status: compareNetworkObservation(report, { ip: other, countryCode: null }) === "possible-dual-stack" ? "dual-stack" : "exposed", ip: other, report: null, ips, observedAt: observation.observedAt });
        }
      } catch {
        if (runIdRef.current !== id) return;
        setPurity({ ok: false });
        setLeak({ status: "unknown" });
      }
    })();

    const onProgress = (signals: SignalResult[]) => {
      if (runIdRef.current !== id) return;
      setProgressSignals(signals);
      setRevealed(new Set(signals.map(signal => signal.id)));
    };
    let first: DetectionRunResult;
    try {
      first = await runDetection({ region: "auto", locale, text: detectorText, probes, onProgress });
    } catch {
      await purityTask;
      if (runIdRef.current !== id) return;
      setPhase("done");
      setMeasuredAt(new Date().toISOString());
      return;
    }
    if (runIdRef.current !== id) return;
    setResult(first);
    await purityTask;
    if (runIdRef.current !== id) return;
    let finalResult = first;
    try {
      finalResult = await reconcileDetection({ region: "auto", locale, text: detectorText, purity: completedPurity, probes, previous: first });
    } catch {
      // Browser values already collected remain usable; missing cross-checks remain unknown.
      finalResult = { ...first, signals: first.signals.map(signal => signal.category === "consistency" ? { ...signal, value: detectorText.unknown, availability: "unavailable", score: 0, contribution: 0 } : signal) };
    }
    if (runIdRef.current !== id) return;
    setResult(finalResult);
    setRevealed(new Set(signalOrder.map(signal => signal.id)));
    setMeasuredAt(new Date().toISOString());
    setPhase("done");
  };

  runCheckRef.current = runCheck;

  const generateSummary = async (force = false) => {
    const id = runIdRef.current;
    if (phase !== "done") return;
    const summaryId = ++summaryIdRef.current;
    const payloadAccess = accessVerdict ?? "unknown";
    const payloadHits = views
      .filter((view) => view.verdict === "hit" || view.verdict === "warn")
      .map((view) => ({ label: view.label, value: view.value ?? "", contribution: view.contribution, fix: detectorText.fixes[view.id] }));
    const payload: SummaryPayload = {
      locale,
      envScore: rawScore,
      riskLabel,
      matchedRegion: null,
      access: payloadAccess,
      purity: purity?.ok
        ? {
            score: purity.score,
            grade: purity.grade,
            location: purity.location || purity.countryCode || detectorText.unknown,
            ip: purity.ip,
            type: purity.ipType,
            marks: purity.flags.map((flag) => purityText.flags[flag]),
            ai: purity.aiSubscription ? purityText.aiLevels[purity.aiSubscription] : null,
          }
        : null,
      hits: payloadHits,
      total: views.length,
      quality: { available: quality.available, unknown: quality.unknown, pending: quality.pending },
      unknownLabels: views.filter(view => view.verdict === "unknown").map(view => view.label),
    };
    // 缓存键只取稳定字段：IP、纯净度分、访问结论、风险分、命中项与贡献。
    // 不含音频延迟、视口尺寸等每次会抖动的原始值，避免结果实质相同时缓存失效。
    const digest = hashSummaryPayload({
      version: "evidence-coverage-v4",
      policyVersion: CLAUDE_REGION_POLICY.version,
      locale,
      ip: purity?.ok ? purity.ip : null,
      purityScore: purity?.ok ? purity.score : null,
      access: payloadAccess,
      envScore: rawScore,
      quality: payload.quality,
      unknown: payload.unknownLabels,
      provider: purity?.ok ? [purity.source.status, purity.source.fetchedAt] : null,
      hits: payloadHits.map((hit) => `${hit.label}:${hit.value}:${hit.contribution}`),
    });
    if (!force) {
      const cached = readSummaryCache(locale);
      if (cached && cached.digest === digest) {
        setSummary({ text: cached.text, source: cached.source, cached: true });
        setSummaryLoading(false);
        return;
      }
    }
    setSummaryLoading(true);
    setSummaryFailed(false);
    try {
      const result = await fetchAiSummary({ data: payload });
      if (runIdRef.current !== id || summaryIdRef.current !== summaryId) return;
      writeSummaryCache(locale, { digest, text: result.text, source: result.source, at: Date.now() });
      setSummary({ ...result, cached: false });
    } catch {
      if (runIdRef.current === id && summaryIdRef.current === summaryId) { setSummary(null); setSummaryFailed(true); }
    } finally {
      if (runIdRef.current === id && summaryIdRef.current === summaryId) setSummaryLoading(false);
    }
  };

  generateSummaryRef.current = generateSummary;

  useEffect(() => {
    const start = () => {
      document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });
      void runCheckRef.current();
    };
    window.addEventListener("start-check", start);
    void runCheckRef.current();
    return () => {
      window.removeEventListener("start-check", start);
      runIdRef.current += 1;
      summaryIdRef.current += 1;
    };
  }, [locale]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const copyReport = async () => {
    const lines = [
      "check.cd · 检测摘要",
      `采样完成：${measuredAt ?? "未完成"}`,
      `已取得 ${doneCount}/${views.length} 项；未取得 ${quality.unknown} 项；需核对 ${hitCount} 项。`,
      `IP 情报：${purity?.ok ? `${purity.source.provider} / ${purity.source.status}` : "未取得可信出口"}`,
      purity?.ok && purity.source.fetchedAt ? `情报查询：${purity.source.fetchedAt}` : null,
      purity?.ok && purity.source.expiresAt ? `情报缓存截止：${purity.source.expiresAt}` : null,
      `地区规则版本：${CLAUDE_REGION_POLICY.version}`,
      ...views.map(view => `- ${view.label}：${view.verdict === "unknown" ? "未取得" : view.verdict === "pending" ? "等待中" : view.evidence === "inferred" ? "推断信息" : view.verdict === "hit" || view.verdict === "warn" ? "需核对" : "已取得"} · ${view.source}`),
      "摘要已省略完整 IP、User-Agent 与指纹值。覆盖率不是通过率；未知不是安全。",
      "方法与来源：https://check.cd/methodology",
      copy.disclaimer,
    ].filter((line): line is string => Boolean(line));
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setToast(copy.copied);
    } catch {
      setToast(copy.copyFail);
    }
  };

  const visibleViews = views.filter((view) => (tab === "all" || view.category === tab) && (!hitsOnly || view.verdict === "hit" || view.verdict === "warn" || view.verdict === "unknown"));
  const shownTabs = signalCategoryOrder.filter((category) => tab === "all" || category === tab);

  return (
    <section className="relative inspection-result refined-report">
      <ReportOverview quality={quality} network={purity} measuredAt={measuredAt} scanning={phase === "scanning"} locale={locale} />
      <div className="report-actions">
        <button type="button" onClick={() => void runCheck()} disabled={phase === "scanning"} className="primary-btn squircle" aria-busy={phase === "scanning"}>{phase === "done" ? purityText.recheck : detectorText.risk.checking}<span aria-hidden="true">↻</span></button>
        <button type="button" onClick={() => void copyReport()} disabled={phase !== "done"} className="tab-btn squircle">{copy.copyReport}<span aria-hidden="true">↗</span></button>
      </div>

      {phase === "done" && locale === "zh" ? <ActualLocation ipCountry={purity?.ok ? purity.countryCode : null} /> : null}

      {phase === "done" ? <section className="report-observations mt-7">
        <h3 className="report-section-label">{locale === "zh" ? "需要留意的观察" : "OBSERVATIONS"}</h3>
        {views.some(view => view.verdict === "hit" || view.verdict === "warn") ? <ul className="observation-list">{views.filter(view => view.verdict === "hit" || view.verdict === "warn").map(view => <li key={view.id} className="squircle observation-item text-sm"><span className="font-medium">{view.label}</span><span className="text-muted break-words">{view.value}</span></li>)}</ul> : <p className="mt-4 text-sm leading-7 text-muted">{locale === "zh" ? "已获取的检测项中，暂未发现需要留意的环境信号。" : "No observations flagged in the available checks."}</p>}
        {views.some(view => view.verdict === "unknown") ? <p className="mt-3 text-xs text-warn">{locale === "zh" ? `${views.filter(view => view.verdict === "unknown").length} 项未取得结果，请在检测明细中查看。` : "Some checks are unavailable; see details below."}</p> : null}
      </section> : null}

      <section className="check-panel squircle mt-6 p-5"><h3 className="text-base font-medium">{locale === "zh" ? "IP 详情与网络路径" : "IP details & network paths"}</h3><PurityPanel report={purity} leak={leak} text={purityText} access={accessText} locale={locale} /></section>

      <section className="result-details">
        <div className="result-details-content">
        <div className="result-toolbar">
          <div>
            <h3 className="result-details-title">{copy.title}</h3>
            <p className="result-details-description text-sm text-muted">{locale === "zh" ? `共 ${views.length} 项 · 已取得 ${doneCount} 项 · 需注意 ${hitCount} 项 · 未取得 ${views.filter(view => view.verdict === "unknown").length} 项` : `${detectorText.ui.all} · ${views.length} · ${copy.signalCount(hitCount, phase === "done")}`}</p>
          </div>
          <div className="result-filters" role="group" aria-label={locale === "zh" ? "按检测类别筛选" : "Filter checks"}>
            <button type="button" aria-pressed={tab === "all"} onClick={() => setTab("all")} className={`tab-btn squircle ${tab === "all" ? "tab-btn-active" : ""}`}>{detectorText.ui.all}</button>
            {signalCategoryOrder.map((category) => (
              <button key={category} type="button" aria-pressed={tab === category} onClick={() => setTab(category)} className={`tab-btn squircle ${tab === category ? "tab-btn-active" : ""}`}>
                <CategoryIcon category={category} />
                {detectorText.categories[category].name}
                {(categoryStats.get(category)?.hits ?? 0) > 0 ? <span className="tab-count squircle">{categoryStats.get(category)?.hits}</span> : null}
              </button>
            ))}
            <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 squircle result-status border border-line px-3 py-1.5 text-xs text-muted select-none">
              <input type="checkbox" checked={hitsOnly} onChange={(event) => setHitsOnly(event.target.checked)} className="result-filter-checkbox" />
              {locale === "zh" ? "仅看需注意 / 未取得结果" : detectorText.ui.hits}
            </label>
          </div>
        </div>

        {visibleViews.length === 0 ? <div className="squircle result-empty" role="status"><h4>{locale === "zh" ? "没有符合筛选条件的项目" : "No checks match these filters"}</h4><p>{locale === "zh" ? "可以查看全部检查，包括尚未取得的数据。" : "Show all checks, including unavailable evidence."}</p><button type="button" className="tab-btn squircle" onClick={() => { setHitsOnly(false); setTab("all"); }}>{locale === "zh" ? "查看全部检查" : "Show all checks"}</button></div> : null}
        <div className="result-groups">
          {shownTabs.map((category) => {
            const stat = categoryStats.get(category);
            const groupViews = visibleViews.filter((view) => view.category === category);
            if (groupViews.length === 0) return null;
            return (
              <section key={category} id={`results-${category}`} className="squircle signal-group" aria-labelledby={`group-${category}`}>
                <header className="signal-group-header">
                  <span className="squircle result-icon result-group-icon"><CategoryIcon category={category} /></span>
                  <div className="signal-group-title">
                    <h4 id={`group-${category}`}>{detectorText.categories[category].name}</h4>
                    <p className="signal-group-description">{detectorText.categories[category].desc}</p>
                  </div>
                  <div className="signal-group-status">
                    {(stat?.hits ?? 0) > 0 ? (
                      <>
                        <span className="squircle result-status bg-risk-bg px-2.5 py-1 font-medium text-risk-solid">{stat?.hits} {detectorText.ui.statusHit}</span>
                      </>
                    ) : (
                      <span className="squircle result-status bg-surface-muted px-2.5 py-1 text-muted">{`${groupViews.filter(view => view.verdict !== "unknown" && view.verdict !== "pending").length} / ${groupViews.length} ${locale === "zh" ? "项有数据" : "available"}`}</span>
                    )}
                  </div>
                </header>
                <ul className="signal-list">
                  {groupViews.map((view) => (
                    <SignalCard key={view.id} signal={view} text={detectorText} locale={locale} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        </div>
      </section>

      {phase === "done" ? (
        <section className="check-panel squircle mt-6">
          <header className="result-summary-header">
            <span className="squircle result-icon result-group-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M12 2.5l2 5.4 5.5 2-5.5 2-2 5.4-2-5.4-5.5-2 5.5-2 2-5.4zM19 14l1 2.6L22.6 17.5 20 18.5 19 21l-1-2.5-2.6-1 2.6-1 1-2.5z" /></svg>
            </span>
            <h3 className="text-base font-medium text-ink">{locale === "zh" ? "解读与建议" : aiCopy.title}</h3>
            <div className="signal-group-status">
              {summary ? <span className="squircle result-status bg-surface-muted text-muted">{summary.source === "ai" ? "AI" : locale === "zh" ? "本地规则解读" : "Local rules"}</span> : null}
              {summary?.cached ? <span className="squircle result-status bg-surface-muted px-2.5 py-1 text-muted">{aiCopy.cached}</span> : null}
              <button type="button" onClick={() => void generateSummaryRef.current(Boolean(summary))} disabled={summaryLoading} className="tab-btn squircle disabled:cursor-not-allowed disabled:opacity-50">
                <svg viewBox="0 0 24 24" className={`size-3.5 ${summaryLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></svg>
                {summary ? aiCopy.regenerate : locale === "zh" ? "生成本次报告解读" : "Explain this report"}
              </button>
            </div>
          </header>
          <div className="result-summary-body">
            {summaryLoading && !summary ? (
              <div className="space-y-2.5" aria-hidden="true">
                <div className="h-3.5 w-full animate-pulse squircle result-skeleton bg-surface-muted" />
                <div className="h-3.5 w-10/12 animate-pulse squircle result-skeleton bg-surface-muted" />
                <div className="h-3.5 w-7/12 animate-pulse squircle result-skeleton bg-surface-muted" />
              </div>
            ) : summary ? (
              <>
                <p className="text-sm leading-7 whitespace-pre-line text-ink">{summary.text}</p>
                <p className="mt-3 text-xs text-muted">{aiCopy.footnote}</p>
              </>
            ) : (
              <p className="text-sm text-muted" role={summaryFailed ? "status" : undefined}>{summaryFailed ? aiCopy.error : locale === "zh" ? "按需解读本次结果。AI 只能解释已采集的证据，不会补齐缺失数据或验证账号可用性。" : "Request an explanation of the evidence collected. AI cannot fill in missing measurements or verify account access."}</p>
            )}
          </div>
        </section>
      ) : null}

      <p className="mt-10 border-t border-line pt-5 text-xs text-muted">{copy.disclaimer}</p>

      {toast ? <div className="toast squircle" role="status">{toast}</div> : null}
    </section>
  );
}
