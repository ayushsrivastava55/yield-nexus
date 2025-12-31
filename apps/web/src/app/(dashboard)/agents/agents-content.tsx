"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  Bot,
  Plus,
  Pause,
  Play,
  Settings,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Loader2,
  ExternalLink,
  AlertCircle,
  DollarSign,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useUserAgents, useYieldAgentStats } from "@/lib/contracts/hooks";
import { useCreateAgent, useAgentControl } from "@/lib/contracts/write-hooks";
import { CONTRACTS } from "@/lib/contracts/config";

// Strategy templates for creating agents
const strategyTemplates = [
  {
    id: "conservative",
    name: "Conservative Yield",
    description: "Low-risk stablecoin lending and staking",
    riskLevel: "conservative",
    targetApy: "3-6%",
    protocols: ["Lendle", "mETH Protocol"],
  },
  {
    id: "balanced",
    name: "Balanced Growth",
    description: "Mixed LP positions with moderate risk",
    riskLevel: "moderate",
    targetApy: "6-12%",
    protocols: ["Lendle", "Woofi Earn"],
  },
  {
    id: "aggressive",
    name: "Aggressive Alpha",
    description: "High-yield farming with elevated risk",
    riskLevel: "aggressive",
    targetApy: "12%+",
    protocols: ["Woofi Earn", "Circuit Protocol"],
  },
];

const riskColors = {
  conservative: "bg-green-500/10 text-green-500",
  moderate: "bg-yellow-500/10 text-yellow-500",
  aggressive: "bg-red-500/10 text-red-500",
};

interface AgentMetrics {
  agentId: number;
  name: string;
  tvl: number;
  totalProfit: number;
  profitPercent: number;
  gasSpent: number;
  rebalanceCount: number;
  lastRebalance: string;
  strategies: { protocol: string; allocation: number; apy: number }[];
  performance: { day: number; week: number; month: number };
  status: "active" | "inactive";
}

export default function AgentsContent() {
  const { isConnected, address } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Fetch agent performance metrics
    fetchAgentMetrics();
  }, []);

  const fetchAgentMetrics = async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch("/api/agents/metrics");
      const data = await response.json();
      if (data.success) {
        setAgentMetrics(data.data);
      }
    } catch (error) {
      console.error("Error fetching agent metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Real contract data
  const { agentCount, isLoading: statsLoading } = useYieldAgentStats();
  const { agentIds, agentCount: userAgentCount, isLoading: agentsLoading } = useUserAgents(
    mounted ? (address as `0x${string}` | undefined) : undefined
  );

  // Contract write hooks
  const { createAgent, isPending: isCreating, isSuccess: createSuccess, hash: createHash } = useCreateAgent();
  const { deactivateAgent } = useAgentControl();

  const handleCreateAgent = (strategyId: string) => {
    // Get the strategy template details
    const template = strategyTemplates.find(t => t.id === strategyId);
    if (!template) return;
    
    // Create agent with the strategy template name
    createAgent(`${template.name} - ${template.description}`, 3600, 100);
    setSelectedStrategy(strategyId);
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-2xl gradient-mantle flex items-center justify-center">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="mt-2 text-muted-foreground max-w-md">
              Connect your wallet to create and manage AI yield agents.
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Yield Agents</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage autonomous yield optimization agents on-chain
          </p>
        </div>
        <Button className="gradient-mantle" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Transaction Status */}
      {createHash && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            {isCreating ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : createSuccess ? (
              <Shield className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isCreating ? "Creating agent..." : createSuccess ? "Agent created!" : "Transaction pending"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{createHash}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://sepolia.mantlescan.xyz/tx/${createHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats - Real Contract Data */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : agentCount}
                </p>
                <p className="text-xs text-muted-foreground">Total Agents (On-chain)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {agentsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userAgentCount}
                </p>
                <p className="text-xs text-muted-foreground">Your Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Mantle</p>
                <p className="text-xs text-muted-foreground">Network</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Chainlink</p>
                <p className="text-xs text-muted-foreground">Automation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Templates - Create New Agents */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Agent</h2>
        <p className="text-muted-foreground mb-6">
          Choose a strategy template to deploy an autonomous yield optimization agent
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {strategyTemplates.map((template) => (
            <Card key={template.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Target APY: {template.targetApy}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={riskColors[template.riskLevel as keyof typeof riskColors]}>
                    {template.riskLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{template.description}</p>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Risk Level</span>
                  </div>
                  <Progress
                    value={
                      template.riskLevel === "conservative"
                        ? 30
                        : template.riskLevel === "moderate"
                        ? 60
                        : 90
                    }
                    className="h-1"
                  />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Protocols Used</p>
                  <div className="flex flex-wrap gap-1">
                    {template.protocols.map((protocol) => (
                      <Badge key={protocol} variant="outline" className="text-xs">
                        {protocol}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleCreateAgent(template.id)}
                  disabled={isCreating}
                >
                  {isCreating && selectedStrategy === template.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Deploy Agent
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Agent Performance Metrics */}
      {agentMetrics.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Agent Performance</h2>
            <Button variant="outline" size="sm" onClick={fetchAgentMetrics} disabled={metricsLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentMetrics.map((agent) => (
              <Card key={agent.agentId} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">ID: {agent.agentId}</p>
                      </div>
                    </div>
                    <Badge className={agent.status === "active" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}>
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        TVL
                      </div>
                      <p className="font-semibold">${agent.tvl.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Profit
                      </div>
                      <p className="font-semibold text-green-500">+{agent.profitPercent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Strategies</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.strategies.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {s.protocol} ({s.apy.toFixed(1)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {agent.rebalanceCount} rebalances
                    </span>
                    <span>Gas: {agent.gasSpent.toFixed(3)} MNT</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={agent.status !== "active"}
                      onClick={() => deactivateAgent(BigInt(agent.agentId))}
                      title="Deactivate agent (owner only)"
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
          <CardDescription>
            YieldAgent contract deployed on Mantle Sepolia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Contract Address</p>
              <p className="font-mono text-sm">{CONTRACTS.mantleSepolia.yieldAgent}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://sepolia.mantlescan.xyz/address/${CONTRACTS.mantleSepolia.yieldAgent}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </a>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Network</p>
              <p className="font-medium">Mantle Sepolia (Chain ID: 5003)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Automation</p>
              <p className="font-medium">Chainlink Keepers Compatible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
