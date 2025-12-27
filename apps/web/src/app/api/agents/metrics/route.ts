import { NextResponse } from "next/server";
import { createPublicClient, http, formatEther } from "viem";

export const runtime = "edge";

// Mantle Sepolia chain config
const mantleSepolia = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { decimals: 18, name: "Mantle", symbol: "MNT" },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
};

// YieldAgent contract address on Mantle Sepolia
const YIELD_AGENT_ADDRESS = "0xD7E8c4E890933dff614c01cb5085fAf33B2A7F19";

// YieldAgent ABI for reading agent data
const YIELD_AGENT_ABI = [
  {
    inputs: [],
    name: "nextAgentId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "agents",
    outputs: [
      { name: "owner", type: "address" },
      { name: "name", type: "string" },
      { name: "minRebalanceInterval", type: "uint256" },
      { name: "maxSlippage", type: "uint256" },
      { name: "gasLimit", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "agentTVL",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "agentProfits",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "agentGasSpent",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "getAgentStrategies",
    outputs: [
      {
        components: [
          { name: "protocol", type: "address" },
          { name: "inputToken", type: "address" },
          { name: "outputToken", type: "address" },
          { name: "targetAllocation", type: "uint256" },
          { name: "currentAllocation", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Create public client for Mantle Sepolia
const client = createPublicClient({
  chain: mantleSepolia,
  transport: http("https://rpc.sepolia.mantle.xyz"),
});

// Agent performance metrics structure
interface AgentMetrics {
  agentId: number;
  name: string;
  owner: string;
  tvl: number;
  totalProfit: number;
  profitPercent: number;
  gasSpent: number;
  rebalanceCount: number;
  lastRebalance: string;
  strategies: {
    protocol: string;
    allocation: number;
    apy: number;
  }[];
  performance: {
    day: number;
    week: number;
    month: number;
  };
  status: "active" | "paused" | "inactive";
  minRebalanceInterval: number;
  maxSlippage: number;
}

// Fetch REAL agent data from on-chain contract
async function fetchRealAgentData(): Promise<AgentMetrics[]> {
  const agents: AgentMetrics[] = [];

  try {
    // Get total number of agents
    const nextAgentId = await client.readContract({
      address: YIELD_AGENT_ADDRESS as `0x${string}`,
      abi: YIELD_AGENT_ABI,
      functionName: "nextAgentId",
    });

    const totalAgents = Number(nextAgentId);
    console.log(`[YieldAgent] Total agents on-chain: ${totalAgents}`);

    // Fetch data for each agent
    for (let i = 0; i < totalAgents; i++) {
      try {
        const [agentData, tvl, profits, gasSpent] = await Promise.all([
          client.readContract({
            address: YIELD_AGENT_ADDRESS as `0x${string}`,
            abi: YIELD_AGENT_ABI,
            functionName: "agents",
            args: [BigInt(i)],
          }),
          client.readContract({
            address: YIELD_AGENT_ADDRESS as `0x${string}`,
            abi: YIELD_AGENT_ABI,
            functionName: "agentTVL",
            args: [BigInt(i)],
          }),
          client.readContract({
            address: YIELD_AGENT_ADDRESS as `0x${string}`,
            abi: YIELD_AGENT_ABI,
            functionName: "agentProfits",
            args: [BigInt(i)],
          }),
          client.readContract({
            address: YIELD_AGENT_ADDRESS as `0x${string}`,
            abi: YIELD_AGENT_ABI,
            functionName: "agentGasSpent",
            args: [BigInt(i)],
          }),
        ]);

        const tvlNumber = Number(formatEther(tvl));
        const profitsNumber = Number(formatEther(profits));
        const gasSpentNumber = Number(gasSpent) / 1e9; // Convert gas to MNT estimate

        agents.push({
          agentId: i,
          name: agentData[1] || `Agent #${i}`,
          owner: agentData[0],
          tvl: tvlNumber,
          totalProfit: profitsNumber,
          profitPercent: tvlNumber > 0 ? (profitsNumber / tvlNumber) * 100 : 0,
          gasSpent: gasSpentNumber,
          rebalanceCount: 0, // Would need event logs to track
          lastRebalance: new Date().toISOString(),
          strategies: [], // Would need to fetch from getAgentStrategies
          performance: {
            day: 0,
            week: 0,
            month: 0,
          },
          status: agentData[5] ? "active" : "inactive",
          minRebalanceInterval: Number(agentData[2]),
          maxSlippage: Number(agentData[3]),
        });

        console.log(`[YieldAgent] Agent ${i}: ${agentData[1]} - TVL: ${tvlNumber}, Active: ${agentData[5]}`);
      } catch (agentError) {
        console.error(`[YieldAgent] Error fetching agent ${i}:`, agentError);
      }
    }
  } catch (error) {
    console.error("[YieldAgent] Error fetching agent count:", error);
  }

  return agents;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const owner = searchParams.get("owner");

    // Fetch REAL agent data from on-chain
    let metrics = await fetchRealAgentData();

    // Filter by agent ID
    if (agentId) {
      metrics = metrics.filter(m => m.agentId === parseInt(agentId));
    }

    // Filter by owner
    if (owner) {
      metrics = metrics.filter(m => m.owner.toLowerCase() === owner.toLowerCase());
    }

    // Calculate aggregate stats from REAL data
    const stats = {
      totalAgents: metrics.length,
      totalTVL: metrics.reduce((sum, m) => sum + m.tvl, 0),
      totalProfit: metrics.reduce((sum, m) => sum + m.totalProfit, 0),
      avgProfitPercent: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.profitPercent, 0) / metrics.length
        : 0,
      totalRebalances: metrics.reduce((sum, m) => sum + m.rebalanceCount, 0),
      totalGasSpent: metrics.reduce((sum, m) => sum + m.gasSpent, 0),
      activeAgents: metrics.filter(m => m.status === "active").length,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      stats,
      meta: {
        timestamp: new Date().toISOString(),
        chain: "Mantle Sepolia",
        chainId: 5003,
        contractAddress: YIELD_AGENT_ADDRESS,
        dataSource: "on-chain",
      },
    });
  } catch (error) {
    console.error("Error fetching agent metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agent metrics from on-chain",
        data: [],
        meta: {
          timestamp: new Date().toISOString(),
          chain: "Mantle Sepolia",
          contractAddress: YIELD_AGENT_ADDRESS,
          dataSource: "on-chain",
        },
      },
      { status: 500 }
    );
  }
}
