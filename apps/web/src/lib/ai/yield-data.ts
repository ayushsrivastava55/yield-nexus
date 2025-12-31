import { YieldOpportunity } from "./types";
import { fetchMantleYields, fetchProtocolStats as fetchRealProtocolStats } from "../api/defillama";

// Cache for real-time data
let cachedYields: YieldOpportunity[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch real yields with caching + source metadata
export async function getRealYieldsWithSource(): Promise<{
  yields: YieldOpportunity[];
  source: "defillama" | "fallback";
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

  // Fallback to static data if API fails
  return { yields: MANTLE_YIELD_OPPORTUNITIES, source: "fallback" };
}

// Backwards-compatible helper
export async function getRealYields(): Promise<YieldOpportunity[]> {
  const result = await getRealYieldsWithSource();
  return result.yields;
}

// Fallback static yield data (used when API is unavailable)
export const MANTLE_YIELD_OPPORTUNITIES: YieldOpportunity[] = [
  // Merchant Moe DEX
  {
    id: "mm-meth-usdt",
    protocol: "Merchant Moe",
    pair: "mETH/USDT",
    apy: 12.4,
    tvl: 45_000_000,
    risk: "medium",
    chain: "mantle",
    type: "liquidity",
  },
  {
    id: "mm-wmnt-usdc",
    protocol: "Merchant Moe",
    pair: "WMNT/USDC",
    apy: 8.7,
    tvl: 32_000_000,
    risk: "medium",
    chain: "mantle",
    type: "liquidity",
  },
  {
    id: "mm-moe-wmnt",
    protocol: "Merchant Moe",
    pair: "MOE/WMNT",
    apy: 24.5,
    tvl: 12_000_000,
    risk: "high",
    chain: "mantle",
    type: "liquidity",
  },
  // INIT Capital
  {
    id: "init-usdy-loop",
    protocol: "INIT Capital",
    pair: "USDY Loop",
    apy: 9.8,
    tvl: 32_000_000,
    risk: "low",
    chain: "mantle",
    type: "lending",
  },
  {
    id: "init-meth-lending",
    protocol: "INIT Capital",
    pair: "mETH Lending",
    apy: 4.2,
    tvl: 85_000_000,
    risk: "low",
    chain: "mantle",
    type: "lending",
  },
  {
    id: "init-usdc-lending",
    protocol: "INIT Capital",
    pair: "USDC Lending",
    apy: 6.1,
    tvl: 120_000_000,
    risk: "low",
    chain: "mantle",
    type: "lending",
  },
  // mETH Protocol
  {
    id: "meth-staking",
    protocol: "mETH Protocol",
    pair: "ETH Staking",
    apy: 5.2,
    tvl: 1_200_000_000,
    risk: "low",
    chain: "mantle",
    type: "staking",
  },
  {
    id: "cmeth-restaking",
    protocol: "mETH Protocol",
    pair: "cmETH Restaking",
    apy: 8.1,
    tvl: 450_000_000,
    risk: "medium",
    chain: "mantle",
    type: "restaking",
  },
  // Lendle
  {
    id: "lendle-usdt",
    protocol: "Lendle",
    pair: "USDT Supply",
    apy: 5.8,
    tvl: 65_000_000,
    risk: "low",
    chain: "mantle",
    type: "lending",
  },
  {
    id: "lendle-wmnt",
    protocol: "Lendle",
    pair: "WMNT Supply",
    apy: 7.3,
    tvl: 42_000_000,
    risk: "medium",
    chain: "mantle",
    type: "lending",
  },
  // Agni Finance
  {
    id: "agni-usdc-usdt",
    protocol: "Agni Finance",
    pair: "USDC/USDT",
    apy: 3.2,
    tvl: 28_000_000,
    risk: "low",
    chain: "mantle",
    type: "liquidity",
  },
];

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
}): Promise<{ data: YieldOpportunity[]; source: "defillama" | "fallback" }> {
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
  return filterYields(MANTLE_YIELD_OPPORTUNITIES, filters);
}

// ASYNC: Get top yields from real data
export async function getTopYieldsAsync(count: number = 5): Promise<YieldOpportunity[]> {
  const yields = await getRealYields();
  return yields.sort((a, b) => b.apy - a.apy).slice(0, count);
}

export async function getTopYieldsAsyncWithSource(count: number = 5): Promise<{
  data: YieldOpportunity[];
  source: "defillama" | "fallback";
}> {
  const result = await getRealYieldsWithSource();
  const data = result.yields.sort((a, b) => b.apy - a.apy).slice(0, count);
  return { data, source: result.source };
}

// SYNC: Get top yields (uses fallback static data)
export function getTopYields(count: number = 5): YieldOpportunity[] {
  return [...MANTLE_YIELD_OPPORTUNITIES]
    .sort((a, b) => b.apy - a.apy)
    .slice(0, count);
}

export function calculateRiskAdjustedReturn(opportunity: YieldOpportunity): number {
  const riskMultiplier = { low: 1, medium: 0.8, high: 0.6 };
  return opportunity.apy * riskMultiplier[opportunity.risk];
}

export function getProtocolStats() {
  const protocols = new Map<string, { tvl: number; avgApy: number; count: number }>();

  for (const opp of MANTLE_YIELD_OPPORTUNITIES) {
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
