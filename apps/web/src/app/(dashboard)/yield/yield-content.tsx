"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  RefreshCw,
} from "lucide-react";

interface YieldOpportunity {
  id: string;
  protocol: string;
  pair: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  type: string;
  apyBase?: number;
  apyReward?: number;
  isStablecoin?: boolean;
}

const riskColors = {
  low: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

// Format currency helper
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export default function YieldContent() {
  const { isConnected } = useAccount();
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yieldOpportunities, setYieldOpportunities] = useState<YieldOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real yield data from DeFiLlama API
  const fetchYields = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/yields");
      const data = await response.json();
      if (data.success && data.data) {
        setYieldOpportunities(data.data);
        setLastUpdated(new Date());
      } else {
        setError("Failed to fetch yield data");
      }
    } catch (err) {
      setError("Network error fetching yields");
      console.error("Yield fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYields();
    // Refresh every 5 minutes
    const interval = setInterval(fetchYields, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
            Real-time DeFi yields from Mantle protocols via DeFiLlama
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchYields} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="gradient-mantle">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Recommendations
          </Button>
        </div>
      </div>

      {/* Stats - Real Data */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${avgApy.toFixed(2)}%`}
                </p>
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
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(totalTvl)}
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
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : yieldOpportunities.length}
                </p>
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
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : yieldOpportunities.length > 0 ? (
                    `${Math.max(...yieldOpportunities.map(o => o.apy)).toFixed(2)}%`
                  ) : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">Best APY</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-500" />
            <p className="text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchYields} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

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
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">
                        {opp.apy?.toFixed(2)}%
                      </span>
                      {opp.apyBase !== undefined && opp.apyReward !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Base: {opp.apyBase?.toFixed(2)}% + Rewards: {opp.apyReward?.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">TVL</span>
                    <span className="font-medium">{formatCurrency(opp.tvl)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" className="capitalize">
                      {opp.type}
                    </Badge>
                  </div>
                  {opp.isStablecoin && (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Stablecoin Pool
                    </Badge>
                  )}
                  <Progress
                    value={Math.min((opp.apy / 10) * 100, 100)}
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
