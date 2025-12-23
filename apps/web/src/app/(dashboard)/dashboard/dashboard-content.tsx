"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  TrendingUp,
  Bot,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboardStats } from "@/lib/contracts/hooks";
import { CONTRACTS } from "@/lib/contracts/config";

interface YieldData {
  protocol: string;
  pair: string;
  apy: number;
  tvl: number;
}

// Format number as currency
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

// Recent activity - would come from event indexer in production
const recentActivity = [
  {
    type: "Contract Deployed",
    description: "YieldAgent on Mantle Sepolia",
    amount: "",
    time: "Just now",
    positive: true,
  },
  {
    type: "KYC System",
    description: "IdentityRegistry initialized",
    amount: "",
    time: "Just now",
    positive: true,
  },
  {
    type: "Compliance",
    description: "ComplianceModule configured",
    amount: "",
    time: "Just now",
    positive: true,
  },
  {
    type: "RWA Token",
    description: "ynRWA token deployed",
    amount: "",
    time: "Just now",
    positive: true,
  },
];

export default function DashboardContent() {
  const { isConnected, address } = useAccount();
  const stats = useDashboardStats(address as `0x${string}` | undefined);
  const [topYields, setTopYields] = useState<YieldData[]>([]);
  const [yieldsLoading, setYieldsLoading] = useState(true);

  // Fetch real yield data from API
  useEffect(() => {
    async function fetchYields() {
      try {
        const res = await fetch("/api/ai/yields?top=5");
        const data = await res.json();
        if (data.success && data.data) {
          setTopYields(data.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch yields:", error);
      } finally {
        setYieldsLoading(false);
      }
    }
    fetchYields();
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
              Connect your wallet to access the institutional dashboard, manage
              compliance, and deploy AI yield agents.
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your RWA portfolio and yield performance
        </p>
      </div>

      {/* Stats Grid - Real Contract Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* RWA Token Balance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-xs">
                {stats.token.symbol || "ynRWA"}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {stats.balance.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `${parseFloat(stats.balance.balance).toFixed(2)}`
                )}
              </p>
              <p className="text-sm text-muted-foreground">RWA Token Balance</p>
            </div>
          </CardContent>
        </Card>

        {/* Top APY from Real Data */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-xs">Live</Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {yieldsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : topYields.length > 0 ? (
                  `${topYields[0]?.apy?.toFixed(2)}%`
                ) : (
                  "N/A"
                )}
              </p>
              <p className="text-sm text-muted-foreground">Top APY Available</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Agents from Contract */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-xs">On-chain</Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {stats.agents.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stats.agents.agentCount
                )}
              </p>
              <p className="text-sm text-muted-foreground">Your Agents</p>
            </div>
          </CardContent>
        </Card>

        {/* KYC Status from Contract */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <Badge 
                variant={stats.kyc.isVerified ? "success" : "secondary"} 
                className="text-xs"
              >
                {stats.kyc.isLoading ? "..." : stats.kyc.isVerified ? "Verified" : "Pending"}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {stats.kyc.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stats.kyc.kycTierName
                )}
              </p>
              <p className="text-sm text-muted-foreground">KYC Status</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        activity.positive
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {activity.positive ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p
                        className={`font-medium text-sm ${
                          activity.positive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {activity.amount}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Yields - Real DeFiLlama Data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Yields</CardTitle>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            {yieldsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : topYields.length > 0 ? (
              <div className="space-y-4">
                {topYields.map((yield_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{yield_.protocol}</p>
                        <p className="text-xs text-muted-foreground">
                          {yield_.pair}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{yield_.apy?.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">
                          TVL: {formatCurrency(yield_.tvl)}
                        </p>
                      </div>
                    </div>
                    <Progress value={Math.min(100, (yield_.apy / 5) * 100)} className="h-1" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No yield data available
              </p>
            )}
            <Link href="/yield">
              <Button variant="outline" className="w-full mt-4">
                View All Opportunities
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/compliance">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold">Issue RWA Token</p>
                <p className="text-sm text-muted-foreground">
                  ERC-3643 compliant
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/agents">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold">Create Agent</p>
                <p className="text-sm text-muted-foreground">
                  Autonomous yield
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/yield">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold">Explore Yields</p>
                <p className="text-sm text-muted-foreground">
                  Discover opportunities
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
