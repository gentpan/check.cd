// Run independent probes concurrently, then reconcile checks that depend on them.
import { collectBrowserEnvironment, unavailableSignal, withTimeout, type BrowserEnvironmentSnapshot, type DetectionProbes } from "./client-engine";
import { detectionConfig, type DetectionConfig } from "./config";
import type { DetectorLocaleText } from "./locale";
import type { DetectionPlugin, DetectionPluginContext } from "./plugin";
import { detectionPlugins } from "./plugins";
import { consistencyPlugin } from "./plugins/consistency";
import type { IpPurityReport } from "@/server/ip-purity";
import type { LocaleCode } from "@/i18n/messages";
import type { RegionCode, SignalResult } from "./types";

export type DetectionRunResult = {
  signals: SignalResult[];
  matchedRegion: RegionCode | null;
  profileScore: number;
  browser: BrowserEnvironmentSnapshot;
};
export type DetectionRunContext = {
  region: RegionCode;
  locale: LocaleCode;
  text: DetectorLocaleText;
  config?: DetectionConfig;
  purity?: IpPurityReport | null;
  probes?: DetectionProbes;
  browser?: BrowserEnvironmentSnapshot;
  onProgress?: (signals: SignalResult[]) => void;
};

function uniqueSignals(signals: SignalResult[]) {
  return [...new Map(signals.map((signal) => [`${signal.source}:${signal.id}`, signal])).values()];
}

async function runPlugin(plugin: DetectionPlugin, context: DetectionPluginContext) {
  try {
    return await withTimeout(Promise.resolve().then(() => plugin.run(context)), context.config.runner.defaultTimeoutMs);
  } catch {
    // Preserve the expected rows and measurement coverage on errors and timeouts.
    return plugin.signalIds.map((id) => unavailableSignal(id, context.text.signalLabels[id] ?? id, context.text.unknown, context.text, context.config));
  }
}

export async function runDetection(context: DetectionRunContext): Promise<DetectionRunResult> {
  const config = context.config ?? detectionConfig;
  const browser = context.browser ?? collectBrowserEnvironment(context.text);
  // Do not allow a late timed-out run to mutate another run's probe cache.
  const probes: DetectionProbes = {};
  const pluginContext: DetectionPluginContext = { ...context, config, browser, purity: context.purity ?? null, probes };
  let signals: SignalResult[] = [];
  const results = new Map<string, Promise<void>>();
  const execute = (plugin: DetectionPlugin): Promise<void> => {
    const existing = results.get(plugin.id);
    if (existing) return existing;
    const task = (async () => {
      await Promise.all((plugin.dependsOn ?? []).map((id) => {
        const dependency = detectionPlugins.find((candidate) => candidate.id === id);
        if (!dependency) throw new Error(`Missing detection dependency: ${id}`);
        return execute(dependency);
      }));
      const output = await runPlugin(plugin, pluginContext);
      signals = uniqueSignals([...signals, ...output.filter((signal) => config.signals[signal.id]?.enabled !== false)]);
      try { context.onProgress?.([...signals]); } catch { /* A UI callback must not discard measurements. */ }
    })();
    results.set(plugin.id, task);
    return task;
  };
  if (config.runner.mode === "sequential") {
    for (const plugin of detectionPlugins) await execute(plugin);
  } else await Promise.all(detectionPlugins.map(execute));
  if (context.probes) Object.assign(context.probes, probes);
  // Browser language, fonts and device brands cannot establish a user's region.
  return { signals, matchedRegion: null, profileScore: 0, browser };
}

export async function reconcileDetection(context: Omit<DetectionRunContext, "browser"> & { previous: DetectionRunResult }): Promise<DetectionRunResult> {
  const config = context.config ?? detectionConfig;
  const ids = new Set(consistencyPlugin.signalIds);
  const updated = await runPlugin(consistencyPlugin, { ...context, config, browser: context.previous.browser, purity: context.purity ?? null, probes: context.probes ?? {} });
  const signals = uniqueSignals([...context.previous.signals.filter((signal) => !ids.has(signal.id)), ...updated.filter((signal) => config.signals[signal.id]?.enabled !== false)]);
  try { context.onProgress?.([...signals]); } catch { /* Reporting must not discard results. */ }
  return { ...context.previous, signals };
}
