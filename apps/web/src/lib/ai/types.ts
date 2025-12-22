import { z } from "zod";

// Yield opportunity schema
export const YieldOpportunitySchema = z.object({
  id: z.string(),
  protocol: z.string(),
  pair: z.string(),
  apy: z.number(),
  tvl: z.number(),
  risk: z.enum(["low", "medium", "high"]),
  chain: z.string(),
  type: z.enum(["lending", "liquidity", "staking", "restaking", "vault"]),
  minDeposit: z.number().optional(),
  lockPeriod: z.number().optional(), // in days
});

export type YieldOpportunity = z.infer<typeof YieldOpportunitySchema>;

// Agent configuration schema
export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string(),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
  maxAllocation: z.number().min(0).max(100),
  minYield: z.number(),
  maxDrawdown: z.number(),
  rebalanceFrequency: z.enum(["hourly", "daily", "weekly"]),
  allowedProtocols: z.array(z.string()),
  excludedAssets: z.array(z.string()).optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Strategy recommendation schema
export const StrategyRecommendationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  expectedApy: z.number(),
  riskLevel: z.enum(["low", "medium", "high"]),
  allocations: z.array(
    z.object({
      protocol: z.string(),
      asset: z.string(),
      percentage: z.number(),
      expectedYield: z.number(),
    })
  ),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export type StrategyRecommendation = z.infer<typeof StrategyRecommendationSchema>;

// Rebalance action schema
export const RebalanceActionSchema = z.object({
  type: z.enum(["deposit", "withdraw", "swap", "stake", "unstake"]),
  fromProtocol: z.string().optional(),
  toProtocol: z.string(),
  fromAsset: z.string().optional(),
  toAsset: z.string(),
  amount: z.number(),
  reason: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  estimatedGas: z.number().optional(),
});

export type RebalanceAction = z.infer<typeof RebalanceActionSchema>;

// Portfolio state schema
export const PortfolioStateSchema = z.object({
  totalValue: z.number(),
  positions: z.array(
    z.object({
      protocol: z.string(),
      asset: z.string(),
      amount: z.number(),
      value: z.number(),
      apy: z.number(),
      unrealizedPnl: z.number(),
    })
  ),
  dailyYield: z.number(),
  weeklyYield: z.number(),
  monthlyYield: z.number(),
  riskScore: z.number().min(0).max(100),
});

export type PortfolioState = z.infer<typeof PortfolioStateSchema>;

// Chat message types
export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    action?: RebalanceAction;
    recommendation?: StrategyRecommendation;
    portfolioUpdate?: PortfolioState;
  };
}

// KYC/Compliance types
export const KYCStatusSchema = z.object({
  status: z.enum(["pending", "in_review", "approved", "rejected", "expired"]),
  tier: z.enum(["none", "retail", "accredited", "institutional"]),
  country: z.string(),
  verifiedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  documents: z.array(
    z.object({
      type: z.string(),
      status: z.enum(["pending", "verified", "rejected"]),
      uploadedAt: z.date(),
    })
  ),
});

export type KYCStatus = z.infer<typeof KYCStatusSchema>;
