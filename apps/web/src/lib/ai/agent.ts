import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { getYieldOpportunitiesAsync, getRealYieldsWithSource } from "./yield-data";

// Message type for the agent
export type YieldAgentMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// System prompt for the yield agent
const YIELD_AGENT_SYSTEM_PROMPT = `You are Yield Nexus AI, an autonomous yield optimization agent for institutional RWA (Real World Assets) on the Mantle Network.

## Your Capabilities:
1. **Yield Discovery**: Search and analyze yield opportunities across Mantle DeFi protocols
2. **Portfolio Optimization**: Calculate optimal allocations based on risk tolerance
3. **Rebalancing**: Recommend portfolio rebalancing actions
4. **Compliance Checking**: Verify KYC/AML compliance for investment actions

## Mantle Ecosystem Knowledge:
- **Merchant Moe**: Primary DEX on Mantle, offers liquidity pools with competitive yields (8-25% APY)
- **INIT Capital**: Lending protocol with liquidity hooks, supports looping strategies (4-10% APY)
- **mETH Protocol**: Liquid staking (mETH ~5.2% APY) and restaking (cmETH ~8.1% APY)
- **Lendle**: Money market protocol for lending/borrowing (5-8% APY)
- **Agni Finance**: Concentrated liquidity DEX (3-15% APY)

## Risk Levels:
- **Low Risk**: Stablecoin lending, ETH staking (3-6% APY)
- **Medium Risk**: Blue-chip LP pairs, restaking (6-12% APY)  
- **High Risk**: Volatile pairs, leveraged positions (12-30% APY)

## Guidelines:
- Always consider risk-adjusted returns, not just raw APY
- For institutional clients, prioritize capital preservation
- Recommend diversification across protocols to minimize smart contract risk
- Be transparent about risks including impermanent loss and market volatility
- Consider gas costs when recommending rebalancing actions

## Response Style:
- Be concise but thorough
- Use data to support recommendations
- Present allocations in clear, actionable formats
- Always explain the reasoning behind recommendations`;

function buildProtocolStats(yields: { protocol: string; tvl: number; apy: number }[]) {
  const protocols = new Map<string, { tvl: number; totalApy: number; count: number }>();
  for (const y of yields) {
    const existing = protocols.get(y.protocol) || { tvl: 0, totalApy: 0, count: 0 };
    protocols.set(y.protocol, {
      tvl: existing.tvl + y.tvl,
      totalApy: existing.totalApy + y.apy,
      count: existing.count + 1,
    });
  }
  return Array.from(protocols.entries()).map(([name, stats]) => ({
    name,
    tvl: stats.tvl,
    avgApy: stats.count > 0 ? stats.totalApy / stats.count : 0,
  }));
}

// Build context with current yield data
async function buildYieldContext(): Promise<string> {
  const { yields, source } = await getRealYieldsWithSource();
  const topYields = [...yields].sort((a, b) => b.apy - a.apy).slice(0, 5);
  const stats = buildProtocolStats(yields);

  const yieldsInfo = topYields
    .map((y) => `- ${y.protocol} ${y.pair}: ${y.apy}% APY (${y.risk} risk, $${(y.tvl / 1e6).toFixed(0)}M TVL)`)
    .join("\n");

  const protocolInfo = stats
    .map((p) => `- ${p.name}: $${(p.tvl / 1e6).toFixed(0)}M TVL, ${p.avgApy.toFixed(1)}% avg APY`)
    .join("\n");

  const sourceNote =
    source === "defillama"
      ? "Data source: DeFiLlama (live)."
      : "Data source: static fallback (DeFiLlama unavailable).";

  return `\n\n## Current Market Data (Live):
${sourceNote}

### Top Yield Opportunities:
${yieldsInfo || "- No yield data available"}

### Protocol Overview:
${protocolInfo.length > 0 ? protocolInfo : "- No protocol stats available"}`;
}

// Non-streaming chat completion
export async function chatWithAgent(
  messages: YieldAgentMessage[],
  userContext?: {
    kycTier?: "retail" | "accredited" | "institutional";
    country?: string;
    portfolioValue?: number;
  }
) {
  const contextMessage = userContext
    ? `\n\nUser Context: KYC Tier: ${userContext.kycTier || "unknown"}, Country: ${userContext.country || "unknown"}, Portfolio Value: $${userContext.portfolioValue?.toLocaleString() || "unknown"}`
    : "";

  const yieldContext = await buildYieldContext();

  const result = await generateText({
    model: openai("gpt-4o"),
    system: YIELD_AGENT_SYSTEM_PROMPT + yieldContext + contextMessage,
    messages,
  });

  return {
    response: result.text,
    usage: result.usage,
  };
}

// Streaming chat completion
export async function streamChatWithAgent(
  messages: YieldAgentMessage[],
  userContext?: {
    kycTier?: "retail" | "accredited" | "institutional";
    country?: string;
    portfolioValue?: number;
  }
) {
  const contextMessage = userContext
    ? `\n\nUser Context: KYC Tier: ${userContext.kycTier || "unknown"}, Country: ${userContext.country || "unknown"}, Portfolio Value: $${userContext.portfolioValue?.toLocaleString() || "unknown"}`
    : "";

  const yieldContext = await buildYieldContext();

  return streamText({
    model: openai("gpt-4o"),
    system: YIELD_AGENT_SYSTEM_PROMPT + yieldContext + contextMessage,
    messages,
  });
}

// Quick yield analysis
export async function analyzeYields(
  riskTolerance: "conservative" | "moderate" | "aggressive",
  investmentAmount: number
) {
  const riskFilter = {
    conservative: "low" as const,
    moderate: "medium" as const,
    aggressive: "high" as const,
  };

  const opportunities = await getYieldOpportunitiesAsync({ maxRisk: riskFilter[riskTolerance] });
  const yieldContext = await buildYieldContext();

  const result = await generateText({
    model: openai("gpt-4o"),
    system: YIELD_AGENT_SYSTEM_PROMPT + yieldContext,
    prompt: `Analyze yield opportunities for a ${riskTolerance} investor with $${investmentAmount.toLocaleString()} to invest. 
    
Available opportunities matching risk profile:
${opportunities.map((o) => `- ${o.protocol} ${o.pair}: ${o.apy}% APY`).join("\n")}

Provide:
1. Top 3 recommended allocations with percentages
2. Expected portfolio yield
3. Key risks to consider
4. Suggested rebalancing frequency`,
  });

  return {
    analysis: result.text,
    opportunities,
  };
}

// Generate strategy recommendation
export async function generateStrategy(
  portfolioValue: number,
  riskTolerance: "conservative" | "moderate" | "aggressive",
  targetYield?: number
) {
  const yieldContext = await buildYieldContext();

  const result = await generateText({
    model: openai("gpt-4o"),
    system: YIELD_AGENT_SYSTEM_PROMPT + yieldContext,
    prompt: `Create an optimal yield strategy for:
- Portfolio Value: $${portfolioValue.toLocaleString()}
- Risk Tolerance: ${riskTolerance}
${targetYield ? `- Target Annual Yield: ${targetYield}%` : ""}

Provide a detailed allocation strategy with:
1. Specific protocol and pool allocations (percentages and dollar amounts)
2. Expected combined APY
3. Risk assessment for each position
4. Entry strategy (DCA vs lump sum)
5. Monitoring and rebalancing recommendations`,
  });

  return {
    strategy: result.text,
  };
}
