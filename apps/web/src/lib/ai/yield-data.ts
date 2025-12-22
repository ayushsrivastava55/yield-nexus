import { YieldOpportunity } from "./types";

// Simulated yield data from Mantle protocols
// In production, this would fetch real-time data from protocol APIs/subgraphs
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

export function getYieldOpportunities(filters?: {
  minApy?: number;
  maxRisk?: "low" | "medium" | "high";
  protocol?: string;
  type?: string;
}): YieldOpportunity[] {
  let opportunities = [...MANTLE_YIELD_OPPORTUNITIES];

  if (filters?.minApy) {
    opportunities = opportunities.filter((o) => o.apy >= filters.minApy!);
  }

  if (filters?.maxRisk) {
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const maxRiskLevel = riskLevels[filters.maxRisk];
    opportunities = opportunities.filter(
      (o) => riskLevels[o.risk] <= maxRiskLevel
    );
  }

  if (filters?.protocol) {
    opportunities = opportunities.filter((o) =>
      o.protocol.toLowerCase().includes(filters.protocol!.toLowerCase())
    );
  }

  if (filters?.type) {
    opportunities = opportunities.filter((o) => o.type === filters.type);
  }

  return opportunities.sort((a, b) => b.apy - a.apy);
}

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
