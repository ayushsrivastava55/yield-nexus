"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, AlertTriangle, Loader2, Play, Pause, Settings, RefreshCw, ExternalLink } from "lucide-react";
import { useKYCStatus, useUserAgents } from "@/lib/contracts/hooks";
import { CONTRACTS, YIELD_AGENT_ABI } from "@/lib/contracts/config";
import { StrategyFlowBuilder, StrategyFlow } from "@/components/agents/strategy-flow-builder";
import { useCreateAgent } from "@/lib/contracts/write-hooks";
import { toast } from "sonner";

export default function NewAgentsContent() {
  const { isConnected, address } = useAccount();
  const { isVerified, isLoading: kycLoading } = useKYCStatus(address as `0x${string}` | undefined);

  const [savedFlows, setSavedFlows] = useState<StrategyFlow[]>([]);
  const [activeTab, setActiveTab] = useState("builder");

  const { createAgent, isPending: isCreating, hash: createHash, isSuccess: deploySuccess } = useCreateAgent();

  // Fetch on-chain deployed agents
  const { agentIds, agentCount, isLoading: agentsLoading } = useUserAgents(address as `0x${string}` | undefined);

  // Fetch agent details for owned agents
  const agentDetailCalls = agentIds?.map((id) => ({
    address: CONTRACTS.mantleSepolia.yieldAgent,
    abi: YIELD_AGENT_ABI,
    functionName: "agents" as const,
    args: [id],
    chainId: 5003,
  })) ?? [];

  const { data: agentDetails, refetch: refetchAgents } = useReadContracts({
    contracts: agentDetailCalls,
    query: { enabled: agentDetailCalls.length > 0 },
  });

  // Refetch agents after successful deployment
  useEffect(() => {
    if (deploySuccess && createHash) {
      console.log("Agent deployed successfully, refetching agents list...");
      toast.success("Agent deployed! Refreshing list...");
      const timer = setTimeout(() => {
        refetchAgents();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deploySuccess, createHash, refetchAgents]);

  const handleSaveFlow = (flow: StrategyFlow) => {
    setSavedFlows((prev) => {
      const existing = prev.findIndex((f) => f.id === flow.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = flow;
        return updated;
      }
      return [...prev, flow];
    });
    toast.success("Strategy flow saved!");
  };

  const handleDeployFlow = async (flow: StrategyFlow) => {
    if (!isVerified) {
      toast.error("KYC verification required");
      return;
    }

    try {
      // Convert flow to on-chain agent configuration
      const rebalanceInterval = 14400; // 4 hours
      const slippage = 50; // 0.5%

      toast.info("Deploying agent to Mantle Network...");

      await createAgent(flow.name, rebalanceInterval, slippage);

      toast.success("Agent deployed successfully! 🚀");

      // Mark flow as active
      setSavedFlows((prev) =>
        prev.map((f) => (f.id === flow.id ? { ...f, isActive: true } : f))
      );
    } catch (error: any) {
      console.error("Deployment error:", error);
      toast.error(error.message || "Failed to deploy agent");
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-border-dark bg-card-dark max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Wallet className="size-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to build autonomous yield agents
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-border-dark bg-card-dark max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              KYC Required
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Complete KYC verification to deploy autonomous agents
            </p>
            <Button onClick={() => (window.location.href = "/compliance")} className="bg-mantle-teal">
              Go to Compliance Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Autonomous Agent Builder</h1>
          <p className="text-muted-foreground mt-1">
            Build and deploy AI-powered yield optimization agents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-200px)]">
        <TabsList className="bg-background-dark border border-border-dark">
          <TabsTrigger value="builder">Strategy Builder</TabsTrigger>
          <TabsTrigger value="deployed">
            Deployed Agents
            {agentCount > 0 && (
              <Badge variant="default" className="ml-2 text-xs">
                {agentCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="h-[calc(100%-50px)] mt-4">
          <StrategyFlowBuilder onSave={handleSaveFlow} onDeploy={handleDeployFlow} />
        </TabsContent>

        <TabsContent value="deployed" className="mt-4">
          <div className="space-y-4">
            {/* Refresh button */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {agentsLoading ? "Loading agents..." : `${agentCount} agent${agentCount !== 1 ? "s" : ""} deployed on-chain`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchAgents()}
                disabled={agentsLoading}
              >
                <RefreshCw className={`size-4 mr-2 ${agentsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* Loading state */}
            {agentsLoading ? (
              <Card className="border-border-dark bg-card-dark">
                <CardContent className="py-12 text-center">
                  <Loader2 className="size-8 text-muted-foreground mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading your agents...</p>
                </CardContent>
              </Card>
            ) : agentCount === 0 ? (
              <Card className="border-border-dark bg-card-dark">
                <CardContent className="py-12 text-center">
                  <Settings className="size-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">No agents deployed yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Build and deploy a strategy to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {agentIds?.map((agentId, index) => {
                  const details = agentDetails?.[index]?.result as [string, string, bigint, bigint, bigint, boolean] | undefined;
                  const owner = details?.[0] ?? "";
                  const name = details?.[1] ?? `Agent #${agentId.toString()}`;
                  const rebalanceInterval = details?.[2] ? Number(details[2]) : 0;
                  const maxSlippage = details?.[3] ? Number(details[3]) : 0;
                  const gasLimit = details?.[4] ? Number(details[4]) : 0;
                  const isActive = details?.[5] ?? false;

                  return (
                    <Card key={agentId.toString()} className={`border-border-dark bg-card-dark ${isActive ? "border-l-4 border-l-mantle-teal" : ""}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                              {name}
                              <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                                {isActive ? "Active" : "Inactive"}
                              </Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Agent ID: #{agentId.toString()} • Rebalance: {Math.round(rebalanceInterval / 3600)}h
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={!isActive}>
                              <Pause className="size-4 mr-1" />
                              Pause
                            </Button>
                            <a
                              href={`https://sepolia.mantlescan.xyz/address/${CONTRACTS.mantleSepolia.yieldAgent}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <ExternalLink className="size-4 mr-1" />
                                View
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                            <div className="text-xs text-muted-foreground mb-1">Max Slippage</div>
                            <div className="text-lg font-bold text-foreground">{maxSlippage / 100}%</div>
                          </div>
                          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                            <div className="text-xs text-muted-foreground mb-1">Gas Limit</div>
                            <div className="text-lg font-bold text-foreground">{gasLimit.toLocaleString()}</div>
                          </div>
                          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                            <div className="text-xs text-muted-foreground mb-1">Rebalance</div>
                            <div className="text-lg font-bold text-foreground">{Math.round(rebalanceInterval / 3600)}h</div>
                          </div>
                          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                            <div className="text-xs text-muted-foreground mb-1">Status</div>
                            <div className={`text-lg font-bold ${isActive ? "text-mantle-teal" : "text-muted-foreground"}`}>
                              {isActive ? "Running" : "Stopped"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                name: "Conservative Stablecoin",
                description: "Low-risk strategy focusing on stablecoin lending",
                apy: "4-6%",
                risk: "Low",
              },
              {
                name: "Balanced Multi-Protocol",
                description: "Diversified across lending and liquidity pools",
                apy: "8-12%",
                risk: "Medium",
              },
              {
                name: "Aggressive Yield Farming",
                description: "High-yield LP positions with active rebalancing",
                apy: "15-25%",
                risk: "High",
              },
              {
                name: "ETH Restaking",
                description: "Focus on liquid staking and restaking protocols",
                apy: "6-10%",
                risk: "Medium",
              },
            ].map((template, idx) => (
              <Card key={idx} className="border-border-dark bg-card-dark hover:border-mantle-teal/30 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Expected APY</div>
                      <div className="text-lg font-bold text-mantle-teal">{template.apy}</div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        template.risk === "Low"
                          ? "border-green-500/30 text-green-500"
                          : template.risk === "Medium"
                          ? "border-yellow-500/30 text-yellow-500"
                          : "border-red-500/30 text-red-500"
                      }
                    >
                      {template.risk} Risk
                    </Badge>
                  </div>
                  <Button className="w-full mt-4" variant="outline" size="sm">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
