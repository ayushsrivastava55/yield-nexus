"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  TrendingUp,
  Shield,
  Zap,
  Filter,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

// Yield opportunities data (matches backend)
const yieldOpportunities = [
  {
    id: "mm-meth-usdt",
    protocol: "Merchant Moe",
    pair: "mETH/USDT",
    apy: 12.4,
    tvl: 45000000,
    risk: "medium",
    type: "liquidity",
  },
  {
    id: "mm-wmnt-usdc",
    protocol: "Merchant Moe",
    pair: "WMNT/USDC",
    apy: 8.7,
    tvl: 32000000,
    risk: "medium",
    type: "liquidity",
  },
  {
    id: "mm-moe-wmnt",
    protocol: "Merchant Moe",
    pair: "MOE/WMNT",
    apy: 24.5,
    tvl: 12000000,
    risk: "high",
    type: "liquidity",
  },
  {
    id: "init-usdy-loop",
    protocol: "INIT Capital",
    pair: "USDY Loop",
    apy: 9.8,
    tvl: 32000000,
    risk: "low",
    type: "lending",
  },
  {
    id: "init-meth-lending",
    protocol: "INIT Capital",
    pair: "mETH Lending",
    apy: 4.2,
    tvl: 85000000,
    risk: "low",
    type: "lending",
  },
  {
    id: "meth-staking",
    protocol: "mETH Protocol",
    pair: "ETH Staking",
    apy: 5.2,
    tvl: 1200000000,
    risk: "low",
    type: "staking",
  },
  {
    id: "cmeth-restaking",
    protocol: "mETH Protocol",
    pair: "cmETH Restaking",
    apy: 8.1,
    tvl: 450000000,
    risk: "medium",
    type: "restaking",
  },
  {
    id: "lendle-usdt",
    protocol: "Lendle",
    pair: "USDT Supply",
    apy: 5.8,
    tvl: 65000000,
    risk: "low",
    type: "lending",
  },
];

const riskColors = {
  low: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function YieldContent() {
  const { isConnected } = useAccount();
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
              Connect your wallet to explore yield opportunities on Mantle.
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const filteredOpportunities = yieldOpportunities.filter((opp) => {
    if (riskFilter !== "all" && opp.risk !== riskFilter) return false;
    if (typeFilter !== "all" && opp.type !== typeFilter) return false;
    return true;
  });

  const totalTvl = yieldOpportunities.reduce((sum, o) => sum + o.tvl, 0);
  const avgApy =
    yieldOpportunities.reduce((sum, o) => sum + o.apy, 0) /
    yieldOpportunities.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yield Discovery</h1>
          <p className="mt-1 text-muted-foreground">
            Explore DeFi yield opportunities across Mantle protocols
          </p>
        </div>
        <Button className="gradient-mantle">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Recommendations
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgApy.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Avg APY</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(totalTvl / 1e9).toFixed(2)}B
                </p>
                <p className="text-xs text-muted-foreground">Total TVL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{yieldOpportunities.length}</p>
                <p className="text-xs text-muted-foreground">Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">24.5%</p>
                <p className="text-xs text-muted-foreground">Best APY</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
        <Tabs value={riskFilter} onValueChange={setRiskFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 h-6">
              All Risk
            </TabsTrigger>
            <TabsTrigger value="low" className="text-xs px-3 h-6">
              Low
            </TabsTrigger>
            <TabsTrigger value="medium" className="text-xs px-3 h-6">
              Medium
            </TabsTrigger>
            <TabsTrigger value="high" className="text-xs px-3 h-6">
              High
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 h-6">
              All Types
            </TabsTrigger>
            <TabsTrigger value="lending" className="text-xs px-3 h-6">
              Lending
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="text-xs px-3 h-6">
              Liquidity
            </TabsTrigger>
            <TabsTrigger value="staking" className="text-xs px-3 h-6">
              Staking
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Opportunities Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOpportunities
          .sort((a, b) => b.apy - a.apy)
          .map((opp) => (
            <Card
              key={opp.id}
              className="hover:border-primary/50 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {opp.protocol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-sm">{opp.pair}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {opp.protocol}
                      </p>
                    </div>
                  </div>
                  <Badge className={riskColors[opp.risk as keyof typeof riskColors]}>
                    {opp.risk}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">APY</span>
                    <span className="text-2xl font-bold text-primary">
                      {opp.apy}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">TVL</span>
                    <span>${(opp.tvl / 1e6).toFixed(0)}M</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" className="capitalize">
                      {opp.type}
                    </Badge>
                  </div>
                  <Progress
                    value={Math.min((opp.apy / 25) * 100, 100)}
                    className="h-1"
                  />
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      Deposit
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No opportunities match your filters
          </p>
        </div>
      )}
    </div>
  );
}
