/**
 * Advanced Portfolio Optimization for Yield Nexus
 * Based on Modern Portfolio Theory, CVaR, and institutional best practices
 */

export interface YieldOpportunity {
  id: string;
  protocol: string;
  pair: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  type: "lending" | "liquidity" | "staking" | "restaking" | "vault";
  apyBase?: number;
  apyReward?: number;
  isStablecoin?: boolean;
}

export interface PortfolioAllocation {
  opportunity: YieldOpportunity;
  allocation: number; // percentage
  amount: number; // dollar amount
  expectedAnnualReturn: number;
  riskScore: number;
  sharpeRatio: number;
}

export interface OptimizedPortfolio {
  allocations: PortfolioAllocation[];
  totalExpectedAPY: number;
  totalExpectedAnnualReturn: number;
  portfolioSharpeRatio: number;
  portfolioRiskScore: number;
  diversificationScore: number;
  recommendations: string[];
  rebalancingFrequency: string;
  gasEstimate: number;
}

// Risk scoring based on multiple factors
function calculateRiskScore(opp: YieldOpportunity): number {
  let score = 0;
  
  // Base risk level
  if (opp.risk === "low") score += 20;
  else if (opp.risk === "medium") score += 50;
  else score += 80;
  
  // TVL factor (higher TVL = lower risk)
  if (opp.tvl > 10_000_000) score -= 10;
  else if (opp.tvl > 1_000_000) score -= 5;
  else if (opp.tvl < 100_000) score += 15;
  
  // Type factor
  if (opp.type === "lending") score -= 5;
  else if (opp.type === "staking" || opp.type === "restaking") score -= 3;
  else if (opp.type === "liquidity") score += 10; // IL risk
  else if (opp.type === "vault") score += 0; // Neutral
  
  // Stablecoin bonus
  if (opp.isStablecoin) score -= 15;
  
  // APY sanity check (too good to be true)
  if (opp.apy > 50) score += 20;
  else if (opp.apy > 30) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

// Simplified Sharpe Ratio calculation
// Sharpe = (Return - RiskFreeRate) / Volatility
function calculateSharpeRatio(apy: number, riskScore: number): number {
  const riskFreeRate = 4.5; // US Treasury rate ~4.5%
  const estimatedVolatility = riskScore / 2; // Rough estimate
  
  if (estimatedVolatility === 0) return 0;
  return (apy - riskFreeRate) / estimatedVolatility;
}

// Calculate portfolio diversification score
function calculateDiversificationScore(allocations: PortfolioAllocation[]): number {
  const protocols = new Set(allocations.map(a => a.opportunity.protocol));
  const types = new Set(allocations.map(a => a.opportunity.type));
  
  let score = 0;
  
  // Protocol diversification (max 40 points)
  score += Math.min(40, protocols.size * 13);
  
  // Type diversification (max 30 points)
  score += Math.min(30, types.size * 15);
  
  // Allocation balance (max 30 points)
  const maxAllocation = Math.max(...allocations.map(a => a.allocation));
  if (maxAllocation < 40) score += 30;
  else if (maxAllocation < 50) score += 20;
  else if (maxAllocation < 60) score += 10;
  
  return score;
}

// Main optimization function using a greedy approach with constraints
export function optimizePortfolio(
  opportunities: YieldOpportunity[],
  investmentAmount: number,
  riskTolerance: "conservative" | "moderate" | "aggressive"
): OptimizedPortfolio {
  // Risk tolerance parameters
  const riskParams = {
    conservative: { maxRiskScore: 35, minDiversification: 4, maxSingleAllocation: 30 },
    moderate: { maxRiskScore: 55, minDiversification: 3, maxSingleAllocation: 40 },
    aggressive: { maxRiskScore: 75, minDiversification: 2, maxSingleAllocation: 50 },
  };
  
  const params = riskParams[riskTolerance];
  
  // Filter and score opportunities
  const scoredOpps = opportunities
    .map(opp => ({
      opportunity: opp,
      riskScore: calculateRiskScore(opp),
      sharpeRatio: calculateSharpeRatio(opp.apy, calculateRiskScore(opp)),
      efficiencyScore: opp.apy / (calculateRiskScore(opp) + 1), // APY per unit of risk
    }))
    .filter(s => s.riskScore <= params.maxRiskScore)
    .sort((a, b) => b.sharpeRatio - a.sharpeRatio); // Sort by Sharpe ratio
  
  if (scoredOpps.length === 0) {
    throw new Error("No suitable opportunities found for risk profile");
  }
  
  // Greedy allocation with constraints
  const allocations: PortfolioAllocation[] = [];
  let remainingPercentage = 100;
  const minAllocationPercentage = 10; // Minimum 10% per position
  
  // Select top opportunities ensuring diversification
  const selectedProtocols = new Set<string>();
  const selectedTypes = new Set<string>();
  
  for (const scored of scoredOpps) {
    if (remainingPercentage < minAllocationPercentage) break;
    if (allocations.length >= 5) break; // Max 5 positions
    
    // Prefer diversification
    const protocolBonus = selectedProtocols.has(scored.opportunity.protocol) ? 0 : 1.2;
    const typeBonus = selectedTypes.has(scored.opportunity.type) ? 0 : 1.1;
    const adjustedScore = scored.sharpeRatio * protocolBonus * typeBonus;
    
    // Calculate allocation percentage
    let allocationPct = Math.min(
      params.maxSingleAllocation,
      remainingPercentage,
      Math.max(minAllocationPercentage, scored.sharpeRatio * 15)
    );
    
    // Round to nearest 5%
    allocationPct = Math.round(allocationPct / 5) * 5;
    
    if (allocationPct >= minAllocationPercentage) {
      const amount = (investmentAmount * allocationPct) / 100;
      
      allocations.push({
        opportunity: scored.opportunity,
        allocation: allocationPct,
        amount,
        expectedAnnualReturn: (amount * scored.opportunity.apy) / 100,
        riskScore: scored.riskScore,
        sharpeRatio: scored.sharpeRatio,
      });
      
      remainingPercentage -= allocationPct;
      selectedProtocols.add(scored.opportunity.protocol);
      selectedTypes.add(scored.opportunity.type);
    }
  }
  
  // Normalize allocations to 100%
  const totalAllocation = allocations.reduce((sum, a) => sum + a.allocation, 0);
  if (totalAllocation < 100 && allocations.length > 0) {
    const adjustment = (100 - totalAllocation) / allocations.length;
    allocations.forEach(a => {
      a.allocation += adjustment;
      a.amount = (investmentAmount * a.allocation) / 100;
      a.expectedAnnualReturn = (a.amount * a.opportunity.apy) / 100;
    });
  }
  
  // Calculate portfolio metrics
  const totalExpectedAnnualReturn = allocations.reduce((sum, a) => sum + a.expectedAnnualReturn, 0);
  const totalExpectedAPY = (totalExpectedAnnualReturn / investmentAmount) * 100;
  
  const portfolioRiskScore = allocations.reduce(
    (sum, a) => sum + (a.riskScore * a.allocation) / 100,
    0
  );
  
  const portfolioSharpeRatio = calculateSharpeRatio(totalExpectedAPY, portfolioRiskScore);
  const diversificationScore = calculateDiversificationScore(allocations);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (diversificationScore < 50) {
    recommendations.push("⚠️ Consider adding more protocols for better diversification");
  }
  
  if (portfolioRiskScore > 60) {
    recommendations.push("⚠️ High risk portfolio - consider reducing exposure to volatile assets");
  }
  
  if (allocations.some(a => a.opportunity.type === "liquidity")) {
    recommendations.push("💡 Monitor impermanent loss on liquidity positions");
  }
  
  if (investmentAmount > 100_000) {
    recommendations.push("💡 Consider splitting deployment over 2-4 weeks (DCA) to reduce timing risk");
  }
  
  const hasHighAPY = allocations.some(a => a.opportunity.apy > 20);
  if (hasHighAPY) {
    recommendations.push("⚠️ High APY positions may be unsustainable - monitor closely");
  }
  
  // Rebalancing frequency based on portfolio characteristics
  let rebalancingFrequency = "Monthly";
  if (riskTolerance === "aggressive" || portfolioRiskScore > 60) {
    rebalancingFrequency = "Bi-weekly";
  } else if (riskTolerance === "conservative" && portfolioRiskScore < 40) {
    rebalancingFrequency = "Quarterly";
  }
  
  // Gas estimate (rough)
  const gasEstimate = allocations.length * 15; // ~$15 per transaction on Mantle
  
  return {
    allocations,
    totalExpectedAPY,
    totalExpectedAnnualReturn,
    portfolioSharpeRatio,
    portfolioRiskScore,
    diversificationScore,
    recommendations,
    rebalancingFrequency,
    gasEstimate,
  };
}

// Generate detailed explanation for the portfolio
export function generatePortfolioExplanation(portfolio: OptimizedPortfolio): string {
  const { allocations, totalExpectedAPY, portfolioSharpeRatio, diversificationScore } = portfolio;
  
  let explanation = "## 📊 Optimized Portfolio Analysis\n\n";
  
  // Allocations
  explanation += "### Recommended Allocations:\n\n";
  allocations.forEach((alloc, idx) => {
    const { opportunity, allocation, amount, expectedAnnualReturn, sharpeRatio } = alloc;
    explanation += `**${idx + 1}. ${opportunity.protocol} - ${opportunity.pair}** (${opportunity.type})\n`;
    explanation += `   - Allocation: ${allocation.toFixed(1)}% ($${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })})\n`;
    explanation += `   - APY: ${opportunity.apy.toFixed(2)}% | Expected Return: $${expectedAnnualReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year\n`;
    explanation += `   - Risk: ${opportunity.risk} | Sharpe Ratio: ${sharpeRatio.toFixed(2)}\n`;
    explanation += `   - TVL: $${(opportunity.tvl / 1_000_000).toFixed(1)}M\n\n`;
  });
  
  // Portfolio metrics
  explanation += "### Portfolio Metrics:\n\n";
  explanation += `- **Blended APY**: ${totalExpectedAPY.toFixed(2)}%\n`;
  explanation += `- **Expected Annual Return**: $${portfolio.totalExpectedAnnualReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`;
  explanation += `- **Portfolio Sharpe Ratio**: ${portfolioSharpeRatio.toFixed(2)} ${portfolioSharpeRatio > 1 ? "✅ (Excellent)" : portfolioSharpeRatio > 0.5 ? "✓ (Good)" : "⚠️ (Review)"}\n`;
  explanation += `- **Risk Score**: ${portfolio.portfolioRiskScore.toFixed(0)}/100\n`;
  explanation += `- **Diversification**: ${diversificationScore.toFixed(0)}/100 ${diversificationScore > 70 ? "✅" : diversificationScore > 50 ? "✓" : "⚠️"}\n\n`;
  
  // Recommendations
  if (portfolio.recommendations.length > 0) {
    explanation += "### Key Recommendations:\n\n";
    portfolio.recommendations.forEach(rec => {
      explanation += `${rec}\n`;
    });
    explanation += "\n";
  }
  
  // Execution strategy
  explanation += "### Execution Strategy:\n\n";
  explanation += `- **Rebalancing**: ${portfolio.rebalancingFrequency}\n`;
  explanation += `- **Estimated Gas**: ~$${portfolio.gasEstimate} for initial deployment\n`;
  explanation += `- **Entry**: ${allocations.reduce((sum, a) => sum + a.amount, 0) > 50000 ? "Consider DCA over 2-4 weeks" : "Lump sum acceptable"}\n\n`;
  
  // Risk factors
  explanation += "### Risk Factors to Monitor:\n\n";
  explanation += "- Smart contract risk across protocols\n";
  explanation += "- Market volatility and price fluctuations\n";
  if (allocations.some(a => a.opportunity.type === "liquidity")) {
    explanation += "- Impermanent loss on LP positions\n";
  }
  explanation += "- Protocol governance changes\n";
  explanation += "- Mantle Network congestion and gas costs\n";
  
  return explanation;
}
