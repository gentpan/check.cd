import type { SummaryPayload } from "@/server/ai-summary";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid input");
  return value as Record<string, unknown>;
}

function boundedText(value: unknown, limit = 256): string {
  if (typeof value !== "string" || value.length > limit)
    throw new Error("Invalid text");
  return value;
}

function nullableText(value: unknown) {
  return value === null ? null : boundedText(value);
}

function score(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  )
    throw new Error("Invalid score");
  return value;
}

export function validateLocale(value: unknown): SummaryPayload["locale"] {
  if (value !== "zh" && value !== "zh-HK" && value !== "ru" && value !== "en")
    throw new Error("Invalid locale");
  return value;
}

export function validateIpRequest(value: unknown) {
  const data = record(value);
  return { locale: validateLocale(data.locale) };
}

export function validateAddressRequest(value: unknown) {
  const data = record(value);
  return { locale: validateLocale(data.locale), ip: boundedText(data.ip, 45) };
}

export function validateSummaryPayload(value: unknown): SummaryPayload {
  const data = record(value);
  if (
    data.access !== "allowed" &&
    data.access !== "blocked" &&
    data.access !== "unknown"
  )
    throw new Error("Invalid access");
  if (!Array.isArray(data.hits) || data.hits.length > 64)
    throw new Error("Invalid hits");
  if (
    typeof data.total !== "number" ||
    !Number.isInteger(data.total) ||
    data.total < data.hits.length ||
    data.total > 64
  )
    throw new Error("Invalid total");
  const hits = data.hits.map((value) => {
    const hit = record(value);
    return {
      label: boundedText(hit.label),
      value: boundedText(hit.value, 1024),
      contribution: score(hit.contribution),
      ...(hit.fix === undefined ? {} : { fix: boundedText(hit.fix, 1024) }),
    };
  });
  let purity: SummaryPayload["purity"] = null;
  if (data.purity !== null) {
    const item = record(data.purity);
    if (!Array.isArray(item.marks) || item.marks.length > 16)
      throw new Error("Invalid marks");
    purity = {
      score: item.score === null ? null : score(item.score),
      grade: nullableText(item.grade),
      location: boundedText(item.location),
      ip: boundedText(item.ip, 45),
      type: nullableText(item.type),
      marks: item.marks.map((mark) => boundedText(mark)),
      ai: nullableText(item.ai),
    };
  }
  let quality: SummaryPayload["quality"];
  if (data.quality !== undefined) {
    const item = record(data.quality);
    const counts = [item.available, item.unknown, item.pending];
    if (counts.some(value => typeof value !== "number" || !Number.isInteger(value) || value < 0) ||
        (counts as number[]).reduce((sum, value) => sum + value, 0) !== data.total) throw new Error("Invalid coverage");
    quality = { available: item.available as number, unknown: item.unknown as number, pending: item.pending as number };
  }
  let unknownLabels: string[] | undefined;
  if (data.unknownLabels !== undefined) {
    if (!Array.isArray(data.unknownLabels) || data.unknownLabels.length > 64) throw new Error("Invalid unknown checks");
    unknownLabels = data.unknownLabels.map(value => boundedText(value, 120));
  }
  const result: SummaryPayload = {
    locale: validateLocale(data.locale),
    envScore: score(data.envScore),
    riskLabel: boundedText(data.riskLabel),
    matchedRegion: nullableText(data.matchedRegion),
    access: data.access,
    purity,
    hits,
    total: data.total,
    ...(quality ? { quality } : {}),
    ...(unknownLabels ? { unknownLabels } : {}),
  };
  if (JSON.stringify(result).length > 16_000)
    throw new Error("Input too large");
  return result;
}
