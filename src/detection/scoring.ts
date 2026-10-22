// Legacy profile compatibility: only a reported country can match a region.
// Browser preferences and additive technical scores never establish product access.
import { REGION_PROFILES } from "../regions";
import type { AccessStatus, ProductAccess, RegionCode, RegionProfile, SignalResult } from "./types";

type Input = {
  region: RegionCode;
  country?: string | null;
  timezone?: string | null;
  languages?: string[];
  locale?: string | null;
  userAgent?: string | null;
  source: "browser" | "server";
};
const UNKNOWN_PRODUCTS: ProductAccess = { web: "unknown", pro: "unknown", api: "unknown", payment: "unknown" };

export function accessStatus(_score: number): AccessStatus {
  // Scores are observations, not evidence of access, eligibility or account safety.
  return "unknown";
}

export function recommendations(_score: number, _profile: RegionProfile | null) { return []; }

export function evaluateAccess(input: Input) {
  const country = input.country?.trim().toUpperCase();
  const profile = country ? REGION_PROFILES.find((candidate) => candidate.countries.includes(country)) ?? null : null;
  const signals: SignalResult[] = country ? [{ id: "country", label: "country", value: country, score: 0, weight: 0, contribution: 0, source: input.source, category: "network", availability: "available", evidence: "observed" }] : [];
  return {
    matchedRegion: profile?.code ?? null,
    score: 0,
    status: accessStatus(0),
    products: { ...UNKNOWN_PRODUCTS },
    signals,
    recommendations: recommendations(0, profile),
  };
}
