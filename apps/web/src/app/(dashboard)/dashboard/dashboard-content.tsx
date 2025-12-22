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
} from "lucide-react";
import Link from "next/link";

const portfolioStats = [
  {
    title: "Total Value Locked",
    value: "$125,430.50",
    change: "+12.5%",
    positive: true,
    icon: Wallet,
  },
  {
    title: "Active Yield",
    value: "8.42%",
    change: "+0.3%",
    positive: true,
    icon: TrendingUp,
  },
  {
    title: "Active Agents",
    value: "3",
    change: "Running",
    positive: true,
    icon: Bot,
  },
  {
    title: "Compliance Score",
    value: "98%",
    change: "Verified",
    positive: true,
    icon: ShieldCheck,
  },
];

const recentActivity = [
  {
    type: "Agent Rebalance",
    description: "USDY → mETH swap executed",
    amount: "+$2,450",
    time: "2 hours ago",
    positive: true,
  },
  {
    type: "Yield Claimed",
    description: "Merchant Moe LP rewards",
    amount: "+$156.32",
    time: "5 hours ago",
    positive: true,
  },
  {
    type: "KYC Updated",
    description: "Institutional tier approved",
    amount: "",
    time: "1 day ago",
    positive: true,
  },
  {
    type: "Agent Created",
    description: "Conservative yield strategy",
    amount: "",
    time: "2 days ago",
    positive: true,
  },
];

const topYields = [
  { protocol: "Merchant Moe", pair: "mETH/USDT", apy: "12.4%", tvl: "$45M" },
  { protocol: "INIT Capital", pair: "USDY Loop", apy: "9.8%", tvl: "$32M" },
  { protocol: "mETH Protocol", pair: "Staking", apy: "5.2%", tvl: "$1.2B" },
];

export default function DashboardContent() {
  const { isConnected } = useAccount();

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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {portfolioStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <Badge
                  variant={stat.positive ? "success" : "destructive"}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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

        {/* Top Yields */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Yields</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
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
                      <p className="font-bold text-primary">{yield_.apy}</p>
                      <p className="text-xs text-muted-foreground">
                        TVL: {yield_.tvl}
                      </p>
                    </div>
                  </div>
                  <Progress value={70 - index * 20} className="h-1" />
                </div>
              ))}
            </div>
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
