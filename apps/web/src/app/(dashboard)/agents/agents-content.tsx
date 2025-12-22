"use client";

import { useState } from "react";
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
  Play,
  Pause,
  Settings,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react";

// Mock agent data
const mockAgents = [
  {
    id: "agent-1",
    name: "Conservative Yield",
    status: "active",
    strategy: "Low-risk stablecoin yields",
    tvl: 50000,
    apy: 6.2,
    pnl: 1240,
    pnlPercent: 2.48,
    riskLevel: "conservative",
    protocols: ["INIT Capital", "Lendle"],
    lastRebalance: "2 hours ago",
    createdAt: "Dec 15, 2024",
  },
  {
    id: "agent-2",
    name: "Balanced Growth",
    status: "active",
    strategy: "Mixed LP + lending positions",
    tvl: 75000,
    apy: 9.8,
    pnl: 2940,
    pnlPercent: 3.92,
    riskLevel: "moderate",
    protocols: ["Merchant Moe", "mETH Protocol"],
    lastRebalance: "5 hours ago",
    createdAt: "Dec 10, 2024",
  },
  {
    id: "agent-3",
    name: "Aggressive Alpha",
    status: "paused",
    strategy: "High-yield LP farming",
    tvl: 25000,
    apy: 18.5,
    pnl: -450,
    pnlPercent: -1.8,
    riskLevel: "aggressive",
    protocols: ["Merchant Moe", "Agni Finance"],
    lastRebalance: "1 day ago",
    createdAt: "Dec 18, 2024",
  },
];

const riskColors = {
  conservative: "bg-green-500/10 text-green-500",
  moderate: "bg-yellow-500/10 text-yellow-500",
  aggressive: "bg-red-500/10 text-red-500",
};

export default function AgentsContent() {
  const { isConnected } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const totalTvl = mockAgents.reduce((sum, a) => sum + a.tvl, 0);
  const totalPnl = mockAgents.reduce((sum, a) => sum + a.pnl, 0);
  const activeAgents = mockAgents.filter((a) => a.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Yield Agents</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage autonomous yield optimization agents
          </p>
        </div>
        <Button className="gradient-mantle" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAgents.length}</p>
                <p className="text-xs text-muted-foreground">Total Agents</p>
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
                <p className="text-2xl font-bold">{activeAgents}</p>
                <p className="text-xs text-muted-foreground">Active</p>
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
                <p className="text-2xl font-bold">${(totalTvl / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Total TVL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${totalPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                <TrendingUp className={`h-5 w-5 ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total P&L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockAgents.map((agent) => (
          <Card key={agent.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Created {agent.createdAt}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={agent.status === "active" ? "default" : "secondary"}
                  className={agent.status === "active" ? "bg-green-500" : ""}
                >
                  {agent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{agent.strategy}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">TVL</p>
                  <p className="text-lg font-semibold">
                    ${agent.tvl.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">APY</p>
                  <p className="text-lg font-semibold text-primary">
                    {agent.apy}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">P&L</span>
                <span
                  className={`font-semibold ${
                    agent.pnl >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {agent.pnl >= 0 ? "+" : ""}${agent.pnl.toLocaleString()} (
                  {agent.pnlPercent >= 0 ? "+" : ""}
                  {agent.pnlPercent}%)
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Risk Level</span>
                  <Badge className={riskColors[agent.riskLevel as keyof typeof riskColors]}>
                    {agent.riskLevel}
                  </Badge>
                </div>
                <Progress
                  value={
                    agent.riskLevel === "conservative"
                      ? 30
                      : agent.riskLevel === "moderate"
                      ? 60
                      : 90
                  }
                  className="h-1"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Protocols</p>
                <div className="flex flex-wrap gap-1">
                  {agent.protocols.map((protocol) => (
                    <Badge key={protocol} variant="outline" className="text-xs">
                      {protocol}
                    </Badge>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Last rebalance: {agent.lastRebalance}
              </p>

              <div className="flex gap-2 pt-2">
                {agent.status === "active" ? (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Pause className="mr-1 h-3 w-3" />
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1">
                    <Play className="mr-1 h-3 w-3" />
                    Resume
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Agent Card */}
        <Card
          className="border-dashed hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Create New Agent</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Deploy an AI agent to automatically optimize your yields
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
