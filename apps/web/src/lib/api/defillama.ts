// DeFiLlama API integration for real yield data
// Docs: https://defillama.com/docs/api

const DEFILLAMA_BASE_URL = "https://yields.llama.fi";

export interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  rewardTokens: string[] | null;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta: string | null;
  underlyingTokens: string[] | null;
}

export interface YieldOpportunity {
  id: string;
  protocol: string;
  pair: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  chain: string;
  type: "liquidity" | "lending" | "staking" | "restaking";
  apyBase?: number;
  apyReward?: number;
  isStablecoin?: boolean;
}

// Mantle protocol mappings
const MANTLE_PROTOCOLS: Record<string, string> = {
  "merchant-moe": "Merchant Moe",
  "merchant-moe-liquidity-book": "Merchant Moe",
  "init-capital": "INIT Capital",
  "lendle": "Lendle",
  "agni-finance": "Agni Finance",
  "meth-protocol": "mETH Protocol",
  "aurelius": "Aurelius",
  "cleopatra-exchange": "Cleopatra",
};

// Determine risk level based on pool characteristics
function calculateRiskLevel(pool: DefiLlamaPool): "low" | "medium" | "high" {
  // Stablecoins are low risk
  if (pool.stablecoin) return "low";
  
  // High APY usually means higher risk
  if (pool.apy > 20) return "high";
  if (pool.apy > 10) return "medium";
  
  // IL risk from DeFiLlama
  if (pool.ilRisk === "yes") return "medium";
  
  // Large TVL indicates lower risk
  if (pool.tvlUsd > 50_000_000) return "low";
  if (pool.tvlUsd > 10_000_000) return "medium";
  
  return "medium";
}

// Determine pool type
function getPoolType(pool: DefiLlamaPool): YieldOpportunity["type"] {
  const project = pool.project.toLowerCase();
  
  if (project.includes("lend") || project.includes("aave") || project.includes("compound")) {
    return "lending";
  }
  if (project.includes("stak") || project.includes("lido") || project.includes("meth")) {
    return "staking";
  }
  if (project.includes("restak")) {
    return "restaking";
  }
  return "liquidity";
}

// Fetch all Mantle yields from DeFiLlama
export async function fetchMantleYields(): Promise<YieldOpportunity[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/pools`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    const data = await response.json();
    const pools: DefiLlamaPool[] = data.data || [];

    // Filter for Mantle chain pools
    const mantlePools = pools.filter(
      (pool) => pool.chain.toLowerCase() === "mantle" && pool.tvlUsd > 100_000 // Min $100k TVL
    );

    // Transform to our format
    const opportunities: YieldOpportunity[] = mantlePools
      .filter((pool) => pool.apy > 0) // Only include pools with positive APY
      .map((pool) => ({
        id: pool.pool,
        protocol: MANTLE_PROTOCOLS[pool.project] || formatProtocolName(pool.project),
        pair: pool.symbol,
        apy: Math.round(pool.apy * 100) / 100, // APY is already in percentage
        tvl: Math.round(pool.tvlUsd),
        risk: calculateRiskLevel(pool),
        chain: "mantle",
        type: getPoolType(pool),
        apyBase: pool.apyBase || undefined,
        apyReward: pool.apyReward || undefined,
        isStablecoin: pool.stablecoin,
      }));

    // Sort by APY descending
    return opportunities.sort((a, b) => b.apy - a.apy);
  } catch (error) {
    console.error("Failed to fetch DeFiLlama data:", error);
    // Return empty array on error - caller should handle fallback
    return [];
  }
}

// Fetch TVL for Mantle protocols
export async function fetchMantleProtocolTVL(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.llama.fi/v2/chains", {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama TVL API error: ${response.status}`);
    }

    const chains = await response.json();
    const mantle = chains.find((c: { name: string }) => c.name.toLowerCase() === "mantle");

    return {
      totalTvl: mantle?.tvl || 0,
    };
  } catch (error) {
    console.error("Failed to fetch Mantle TVL:", error);
    return { totalTvl: 0 };
  }
}

// Format protocol name from slug
function formatProtocolName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Get protocol stats from real data
export async function fetchProtocolStats() {
  const yields = await fetchMantleYields();
  
  const protocols = new Map<string, { tvl: number; totalApy: number; count: number }>();

  for (const opp of yields) {
    const existing = protocols.get(opp.protocol) || { tvl: 0, totalApy: 0, count: 0 };
    protocols.set(opp.protocol, {
      tvl: existing.tvl + opp.tvl,
      totalApy: existing.totalApy + opp.apy,
      count: existing.count + 1,
    });
  }

  return Array.from(protocols.entries())
    .map(([name, stats]) => ({
      name,
      tvl: stats.tvl,
      avgApy: stats.count > 0 ? stats.totalApy / stats.count : 0,
      poolCount: stats.count,
    }))
    .sort((a, b) => b.tvl - a.tvl);
}
