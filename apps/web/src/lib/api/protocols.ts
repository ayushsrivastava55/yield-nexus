/**
 * Protocol integrations for Mantle ecosystem
 * Fetches REAL yield data from DeFiLlama API and on-chain sources
 * NO MOCK DATA - All data is fetched from real sources
 */

import { createPublicClient, http, formatUnits } from "viem";
import { mantleSepoliaTestnet } from "viem/chains";

// Mantle Mainnet chain config
const mantleMainnet = {
  id: 5000,
  name: "Mantle",
  nativeCurrency: { decimals: 18, name: "Mantle", symbol: "MNT" },
  rpcUrls: {
    default: { http: ["https://rpc.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://mantlescan.xyz" },
  },
};

// Public client for Mantle Mainnet (for reading real protocol data)
const mantleClient = createPublicClient({
  chain: mantleMainnet,
  transport: http("https://rpc.mantle.xyz"),
});

// Mantle Protocol Addresses (REAL MAINNET ADDRESSES)
export const MANTLE_PROTOCOLS = {
  merchantMoe: {
    router: "0xeaEE7EE68874218c3558b40063c42B82D3E7232a",
    factory: "0x5bEf015CA9424A7C07B68490616a4C1F094BEdEc",
    lbFactory: "0xa6630671775c4EA2571F28912f5f86E5C81Ea3E3",
    pools: {
      "cmETH/USDe": "0x38E2a053E67697e411344B184B3aBAe4fab42cC2",
      "WMNT/USDC": "0xC75D7fD1E788497dF3B347f9271287DdF6F7b8d0",
      "mETH/WMNT": "0x8eB08c4B3489E4D6Ec6c88cE2C10f4A1a5Cc8D05",
    },
  },
  initCapital: {
    core: "0x972BcB0284cca0152527c4f70f8F689852bCAFc5",
    positionManager: "0x0a1d576f3eFeF75b330424287a95A366e8281D54",
  },
  meth: {
    token: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0",
    cmETH: "0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA",
    stakingContract: "0xe3cBd06D7dadB3F4e6557bAb7EdD924CD1489E8f",
  },
  tokens: {
    WMNT: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
    USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
    USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
    USDe: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    mETH: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0",
    cmETH: "0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA",
  },
};

// Liquidity Book Pool ABI (for Merchant Moe)
const LB_POOL_ABI = [
  {
    inputs: [],
    name: "getActiveId",
    outputs: [{ internalType: "uint24", name: "activeId", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBinStep",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokenX",
    outputs: [{ internalType: "address", name: "tokenX", type: "address" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokenY",
    outputs: [{ internalType: "address", name: "tokenY", type: "address" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint128", name: "reserveX", type: "uint128" },
      { internalType: "uint128", name: "reserveY", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC20 ABI for balance/decimals
const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Protocol yield data structure
export interface ProtocolYield {
  protocol: string;
  pool: string;
  chain: string;
  apy: number;
  tvl: number;
  token: string;
  rewardTokens: string[];
  riskLevel: "low" | "medium" | "high";
  category: "lending" | "dex" | "staking" | "restaking";
  poolAddress?: string;
  apyBase?: number;
  apyReward?: number;
}

/**
 * Fetch REAL yields from DeFiLlama API
 * This is the primary source of truth for all Mantle protocol yields
 */
export async function fetchDeFiLlamaYields(): Promise<ProtocolYield[]> {
  try {
    const response = await fetch("https://yields.llama.fi/pools", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter for Mantle pools only
    const mantlePools = data.data.filter(
      (pool: any) => pool.chain?.toLowerCase() === "mantle"
    );

    console.log(`[DeFiLlama] Found ${mantlePools.length} Mantle pools`);

    return mantlePools.map((pool: any) => ({
      protocol: pool.project,
      pool: pool.symbol,
      chain: pool.chain,
      apy: pool.apy || 0,
      apyBase: pool.apyBase || 0,
      apyReward: pool.apyReward || 0,
      tvl: pool.tvlUsd || 0,
      token: pool.symbol?.split("-")[0] || "Unknown",
      rewardTokens: pool.rewardTokens || [],
      riskLevel: determineRiskLevel(pool),
      category: categorizePool(pool.project),
      poolAddress: pool.pool,
    }));
  } catch (error) {
    console.error("[DeFiLlama] Error fetching yields:", error);
    return [];
  }
}

/**
 * Determine risk level based on pool characteristics
 */
function determineRiskLevel(pool: any): "low" | "medium" | "high" {
  // Stablecoins are low risk
  if (pool.stablecoin === true) return "low";
  
  // High IL risk means high overall risk
  if (pool.ilRisk === "yes") return "high";
  
  // Low IL risk means low risk
  if (pool.ilRisk === "no") return "low";
  
  // Check exposure type
  if (pool.exposure === "single") return "low";
  if (pool.exposure === "multi") return "medium";
  
  // Default to medium
  return "medium";
}

/**
 * Categorize pool by protocol name
 */
function categorizePool(protocol: string): "lending" | "dex" | "staking" | "restaking" {
  const lendingProtocols = ["init-capital", "lendle", "aurelius", "lending"];
  const dexProtocols = ["merchant-moe", "agni-finance", "fusionx", "izumi", "butterxyz"];
  const stakingProtocols = ["meth-protocol", "mantle-staked-eth", "staking"];
  const restakingProtocols = ["renzo", "eigenlayer", "karak", "symbiotic"];

  const normalizedProtocol = protocol.toLowerCase().replace(/\s+/g, "-");
  
  if (lendingProtocols.some(p => normalizedProtocol.includes(p))) return "lending";
  if (dexProtocols.some(p => normalizedProtocol.includes(p))) return "dex";
  if (stakingProtocols.some(p => normalizedProtocol.includes(p))) return "staking";
  if (restakingProtocols.some(p => normalizedProtocol.includes(p))) return "restaking";
  
  return "dex";
}

/**
 * Fetch REAL on-chain data from Merchant Moe pools
 */
export async function fetchMerchantMoeOnChainData(): Promise<ProtocolYield[]> {
  const results: ProtocolYield[] = [];
  
  try {
    // Fetch data for cmETH/USDe pool
    const poolAddress = MANTLE_PROTOCOLS.merchantMoe.pools["cmETH/USDe"] as `0x${string}`;
    
    const [reserves, activeId, binStep] = await Promise.all([
      mantleClient.readContract({
        address: poolAddress,
        abi: LB_POOL_ABI,
        functionName: "getReserves",
      }),
      mantleClient.readContract({
        address: poolAddress,
        abi: LB_POOL_ABI,
        functionName: "getActiveId",
      }),
      mantleClient.readContract({
        address: poolAddress,
        abi: LB_POOL_ABI,
        functionName: "getBinStep",
      }),
    ]);

    // Calculate TVL from reserves (simplified - assumes 18 decimals)
    const reserveX = Number(formatUnits(reserves[0], 18));
    const reserveY = Number(formatUnits(reserves[1], 18));
    
    // Estimate TVL (would need price feed for accurate USD value)
    const estimatedTvl = (reserveX + reserveY) * 2000; // Rough estimate

    results.push({
      protocol: "Merchant Moe",
      pool: "cmETH/USDe",
      chain: "Mantle",
      apy: 0, // APY comes from DeFiLlama, this is just on-chain TVL
      tvl: estimatedTvl,
      token: "cmETH",
      rewardTokens: ["MOE"],
      riskLevel: "medium",
      category: "dex",
      poolAddress: poolAddress,
    });

    console.log(`[MerchantMoe] Fetched on-chain data - Active Bin: ${activeId}, Bin Step: ${binStep}`);
  } catch (error) {
    console.error("[MerchantMoe] Error fetching on-chain data:", error);
  }
  
  return results;
}

/**
 * Fetch REAL mETH staking data from on-chain
 */
export async function fetchMETHOnChainData(): Promise<{ totalStaked: bigint; apy: number }> {
  try {
    const mETHAddress = MANTLE_PROTOCOLS.meth.token as `0x${string}`;
    
    const totalSupply = await mantleClient.readContract({
      address: mETHAddress,
      abi: ERC20_ABI,
      functionName: "totalSupply",
    });

    console.log(`[mETH] Total Supply: ${formatUnits(totalSupply, 18)} mETH`);

    return {
      totalStaked: totalSupply,
      apy: 0, // APY comes from DeFiLlama
    };
  } catch (error) {
    console.error("[mETH] Error fetching on-chain data:", error);
    return { totalStaked: BigInt(0), apy: 0 };
  }
}

/**
 * Aggregate all protocol yields - ALL REAL DATA FROM DEFI LLAMA
 * No mock data - only real API data
 */
export async function fetchAllProtocolYields(): Promise<ProtocolYield[]> {
  // Primary source: DeFiLlama (real API data)
  const defiLlamaYields = await fetchDeFiLlamaYields();
  
  // Sort by APY descending
  const sortedYields = defiLlamaYields.sort((a, b) => b.apy - a.apy);
  
  console.log(`[Protocols] Total yields fetched: ${sortedYields.length}`);
  
  return sortedYields;
}

/**
 * Calculate risk-adjusted APY (Sharpe-like metric)
 */
export function calculateRiskAdjustedAPY(yield_: ProtocolYield): number {
  const riskMultiplier = {
    low: 1.0,
    medium: 0.8,
    high: 0.6,
  };
  return yield_.apy * riskMultiplier[yield_.riskLevel];
}

/**
 * Get recommended strategies based on risk profile
 */
export function getRecommendedStrategies(
  yields: ProtocolYield[],
  riskProfile: "conservative" | "balanced" | "aggressive"
): ProtocolYield[] {
  const riskFilter = {
    conservative: ["low"],
    balanced: ["low", "medium"],
    aggressive: ["low", "medium", "high"],
  };

  return yields
    .filter(y => riskFilter[riskProfile].includes(y.riskLevel))
    .sort((a, b) => calculateRiskAdjustedAPY(b) - calculateRiskAdjustedAPY(a))
    .slice(0, 5);
}

/**
 * Get protocol statistics from real data
 */
export function getProtocolStats(yields: ProtocolYield[]) {
  const protocols = [...new Set(yields.map(y => y.protocol))];
  const categories = {
    lending: yields.filter(y => y.category === "lending"),
    dex: yields.filter(y => y.category === "dex"),
    staking: yields.filter(y => y.category === "staking"),
    restaking: yields.filter(y => y.category === "restaking"),
  };

  return {
    totalPools: yields.length,
    totalTVL: yields.reduce((sum, y) => sum + y.tvl, 0),
    avgAPY: yields.length > 0 ? yields.reduce((sum, y) => sum + y.apy, 0) / yields.length : 0,
    maxAPY: yields.length > 0 ? Math.max(...yields.map(y => y.apy)) : 0,
    protocols,
    protocolCount: protocols.length,
    byCategory: {
      lending: categories.lending.length,
      dex: categories.dex.length,
      staking: categories.staking.length,
      restaking: categories.restaking.length,
    },
    byRisk: {
      low: yields.filter(y => y.riskLevel === "low").length,
      medium: yields.filter(y => y.riskLevel === "medium").length,
      high: yields.filter(y => y.riskLevel === "high").length,
    },
  };
}
