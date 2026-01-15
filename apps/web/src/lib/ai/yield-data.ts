import { YieldOpportunity } from "./types";
import { fetchMantleYields, fetchProtocolStats as fetchRealProtocolStats } from "../api/defillama";

// Cache for real-time data
let cachedYields: YieldOpportunity[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch real yields with caching + source metadata
export async function getRealYieldsWithSource(): Promise<{
  yields: YieldOpportunity[];
  source: "defillama" | "unavailable";
}> {
  const now = Date.now();
  
  if (cachedYields && now - cacheTimestamp < CACHE_DURATION) {
    return { yields: cachedYields, source: "defillama" };
  }

  try {
    const realYields = await fetchMantleYields();
    if (realYields.length > 0) {
      cachedYields = realYields;
      cacheTimestamp = now;
      return { yields: realYields, source: "defillama" };
    }
  } catch (error) {
    console.error("Failed to fetch real yields, using fallback:", error);
  }

  // No fallback: return empty when API is unavailable
  return { yields: [], source: "unavailable" };
}

// Backwards-compatible helper
export async function getRealYields(): Promise<YieldOpportunity[]> {
  const result = await getRealYieldsWithSource();
  return result.yields;
}

// Fallback static yield data (used when API is unavailable)
export const MANTLE_YIELD_OPPORTUNITIES: YieldOpportunity[] = [];

// Filter helper function
function filterYields(
  opportunities: YieldOpportunity[],
  filters?: {
    minApy?: number;
    maxRisk?: "low" | "medium" | "high";
    protocol?: string;
    type?: string;
  }
): YieldOpportunity[] {
  let filtered = [...opportunities];

  if (filters?.minApy) {
    filtered = filtered.filter((o) => o.apy >= filters.minApy!);
  }

  if (filters?.maxRisk) {
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const maxRiskLevel = riskLevels[filters.maxRisk];
    filtered = filtered.filter((o) => riskLevels[o.risk] <= maxRiskLevel);
  }

  if (filters?.protocol) {
    filtered = filtered.filter((o) =>
      o.protocol.toLowerCase().includes(filters.protocol!.toLowerCase())
    );
  }

  if (filters?.type) {
    filtered = filtered.filter((o) => o.type === filters.type);
  }

  return filtered.sort((a, b) => b.apy - a.apy);
}

// ASYNC: Get real yield opportunities with filters
export async function getYieldOpportunitiesAsync(filters?: {
  minApy?: number;
  maxRisk?: "low" | "medium" | "high";
  protocol?: string;
  type?: string;
}): Promise<YieldOpportunity[]> {
  const yields = await getRealYields();
  return filterYields(yields, filters);
}

export async function getYieldOpportunitiesAsyncWithSource(filters?: {
  minApy?: number;
  maxRisk?: "low" | "medium" | "high";
  protocol?: string;
  type?: string;
}): Promise<{ data: YieldOpportunity[]; source: "defillama" | "unavailable" }> {
  const result = await getRealYieldsWithSource();
  return { data: filterYields(result.yields, filters), source: result.source };
}

// SYNC: Get yield opportunities (uses fallback static data)
export function getYieldOpportunities(filters?: {
  minApy?: number;
  maxRisk?: "low" | "medium" | "high";
  protocol?: string;
  type?: string;
}): YieldOpportunity[] {
  return [];
}

// ASYNC: Get top yields from real data
export async function getTopYieldsAsync(count: number = 5): Promise<YieldOpportunity[]> {
  const yields = await getRealYields();
  return yields.sort((a, b) => b.apy - a.apy).slice(0, count);
}

export async function getTopYieldsAsyncWithSource(count: number = 5): Promise<{
  data: YieldOpportunity[];
  source: "defillama" | "unavailable";
}> {
  const result = await getRealYieldsWithSource();
  const data = result.yields.sort((a, b) => b.apy - a.apy).slice(0, count);
  return { data, source: result.source };
}

// SYNC: Get top yields (uses fallback static data)
export function getTopYields(count: number = 5): YieldOpportunity[] {
  return [];
}

export function calculateRiskAdjustedReturn(opportunity: YieldOpportunity): number {
  const riskMultiplier = { low: 1, medium: 0.8, high: 0.6 };
  return opportunity.apy * riskMultiplier[opportunity.risk];
}

export async function getProtocolStats() {
  const yields = await getRealYields();
  const protocols = new Map<string, { tvl: number; avgApy: number; count: number }>();

  for (const opp of yields) {
    const existing = protocols.get(opp.protocol) || { tvl: 0, avgApy: 0, count: 0 };
    protocols.set(opp.protocol, {
      tvl: existing.tvl + opp.tvl,
      avgApy: (existing.avgApy * existing.count + opp.apy) / (existing.count + 1),
      count: existing.count + 1,
    });
  }

  return Array.from(protocols.entries()).map(([name, stats]) => ({
    name,
    ...stats,
  }));
}
