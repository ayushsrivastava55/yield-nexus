"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  TrendingUp,
  Bot,
  ShieldCheck,
  Loader2,
  Search,
  Bell,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboardStats } from "@/lib/contracts/hooks";
import { CONTRACTS } from "@/lib/contracts/config";
import { TopHeader } from "@/components/layout/sidebar";

interface YieldData {
  protocol: string;
  pair: string;
  apy: number;
  tvl: number;
  risk: string;
  type: string;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

const strategies = [
  {
    name: "Ondo USDY + Merchant Moe",
    type: "Stablecoin Yield • Liquidity Provision",
    apy: 8.4,
    tvl: 420000000,
    risk: "AAA",
    icon: "payments",
  },
  {
    name: "Mantle LSP (mETH) + Lendle",
    type: "Liquid Staking • Lending Loop",
    apy: 5.2,
    tvl: 310500000,
    risk: "AA",
    icon: "eco",
  },
  {
    name: "Ethena sUSDe + Agni",
    type: "Basis Trade • DEX Incentives",
    apy: 14.1,
    tvl: 185200000,
    risk: "B+",
    icon: "trending_up",
  },
  {
    name: "Goldfinch V3 + USDC",
    type: "Emerging Market Credits",
    apy: 9.8,
    tvl: 94000000,
    risk: "AA-",
    icon: "account_balance_wallet",
  },
];

const pendingApprovals = [
  {
    name: "Fund Manager A-04",
    time: "2h ago",
    description: "Identity verification required for sub-account level 2 access.",
    actionType: "primary",
    actionText: "Review Documents",
  },
  {
    name: "Lending Agent E-12",
    time: "5h ago",
    description: "Risk parameter override requested for Agni Pool sUSDe.",
    actionType: "secondary",
    actionText: "View Analysis",
  },
  {
    name: "Treasury Multisig",
    time: "1d ago",
    description: "Quarterly compliance audit trail generation.",
    actionType: "disabled",
    actionText: "Processing...",
  },
];

export default function DashboardContent() {
  const { isConnected, address } = useAccount();
  const stats = useDashboardStats(address as `0x${string}` | undefined);
  const [topYields, setTopYields] = useState<YieldData[]>([]);
  const [yieldsLoading, setYieldsLoading] = useState(true);

  useEffect(() => {
    async function fetchYields() {
      try {
        const res = await fetch("/api/ai/yields?top=5");
        const data = await res.json();
        if (data.success && data.data) {
          setTopYields(data.data.slice(0, 4));
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
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
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
    <>
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-border px-8 py-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-foreground text-xl font-bold">Institutional Dashboard</h2>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2 bg-mantle-teal/10 px-2 py-1 rounded">
            <div className="size-2 rounded-full bg-mantle-teal animate-pulse"></div>
            <span className="text-[10px] font-bold text-mantle-teal uppercase">Mantle Mainnet Live</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input 
              className="bg-card border border-border text-foreground text-sm rounded-lg pl-10 pr-4 py-2 w-64 focus:ring-primary focus:border-primary transition-all" 
              placeholder="Search strategies..." 
              type="text"
            />
          </div>
          <button className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <ConnectButton />
        </div>
      </header>

      <div className="p-8">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Value Managed</p>
              <span className="text-mantle-teal text-xs font-bold">+4.2%</span>
            </div>
            <p className="text-foreground text-2xl font-bold tracking-tight">
              {stats.balance.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `$${formatCurrency(parseFloat(stats.balance.balance) * 1000)}`
              )}
            </p>
            <div className="w-full bg-border h-1 rounded-full mt-4">
              <div className="bg-primary h-1 rounded-full w-[65%]"></div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Active Agents</p>
              <span className="text-mantle-teal text-xs font-bold">+2 New</span>
            </div>
            <p className="text-foreground text-2xl font-bold tracking-tight">
              {stats.agents.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `${stats.agents.agentCount} / 30`
              )}
            </p>
            <p className="text-muted-foreground text-[10px] mt-2 italic">80% Utilization Capacity</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Yield Earned (30d)</p>
              <span className="text-mantle-teal text-xs font-bold">+1.8%</span>
            </div>
            <p className="text-foreground text-2xl font-bold tracking-tight">+$12,482,000</p>
            <p className="text-muted-foreground text-[10px] mt-2">Daily Avg: $416k</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Compliance Status</p>
              <span className="text-muted-foreground text-xs font-bold">99% Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-foreground text-2xl font-bold tracking-tight">
                {stats.kyc.isVerified ? "94%" : "0%"}
              </p>
              <span className="px-2 py-0.5 bg-mantle-teal/10 text-mantle-teal text-[10px] font-bold rounded">
                {stats.kyc.isVerified ? "HEALTHY" : "PENDING"}
              </span>
            </div>
            <p className="text-muted-foreground text-[10px] mt-2">Next Audit in 12 days</p>
          </div>
        </div>

        {/* Middle Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Yield Leaderboard (Left 8 Columns) */}
          <div className="col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-foreground text-lg font-bold">Yield Leaderboard</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-medium bg-card border border-border text-muted-foreground rounded hover:text-foreground transition-colors">
                  Risk: All
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-card border border-border text-muted-foreground rounded hover:text-foreground transition-colors">
                  Asset: RWA
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">
                    <th className="px-6 py-4">Strategy</th>
                    <th className="px-6 py-4">Risk-Adj APY</th>
                    <th className="px-6 py-4">TVL</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {strategies.map((strategy, index) => (
                    <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded bg-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-mantle-teal text-sm">{strategy.icon}</span>
                          </div>
                          <div>
                            <p className="text-foreground text-sm font-semibold">{strategy.name}</p>
                            <p className="text-muted-foreground text-xs">{strategy.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-mantle-teal font-bold text-sm">{strategy.apy}%</span>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3].map((i) => (
                              <div 
                                key={i} 
                                className={`h-1 w-2 rounded-full ${i <= Math.ceil(strategy.apy / 5) ? 'bg-mantle-teal' : 'bg-mantle-teal/30'}`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-muted-foreground text-sm font-medium">
                        {formatCurrency(strategy.tvl)}
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-0.5 bg-white/5 border border-border text-muted-foreground text-[10px] font-bold rounded">
                          {strategy.risk}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href="/agents">
                          <Button size="sm" variant="gradient" className="text-xs font-bold px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            Deploy Agent
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-border flex justify-center">
                <Link href="/yield">
                  <button className="text-xs text-muted-foreground font-bold hover:text-foreground uppercase tracking-widest transition-colors">
                    View All Institutional Strategies
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Sidebar Widgets (Right 4 Columns) */}
          <div className="col-span-4 flex flex-col gap-6">
            {/* Compliance Health */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-foreground font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-mantle-teal" />
                Compliance Health
              </h3>
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="donut-chart w-[120px] h-[120px] flex items-center justify-center relative">
                  <div className="absolute w-[90px] h-[90px] bg-card rounded-full"></div>
                  <div className="z-10 flex flex-col items-center">
                    <span className="text-foreground text-xl font-bold">{stats.kyc.isVerified ? "94%" : "0%"}</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">Ready</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Identity Verification</span>
                  <span className="text-foreground text-xs font-bold">{stats.kyc.isVerified ? "94%" : "Pending"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">KYC/KYB Checks</span>
                  <span className="text-foreground text-xs font-bold">{stats.kyc.isVerified ? "100%" : "Pending"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Audit Logging</span>
                  <span className="text-mantle-teal text-xs font-bold">Active</span>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-card border border-border rounded-xl p-6 flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-foreground font-bold text-sm">Pending Approvals</h3>
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded">3 ACTION</span>
              </div>
              <div className="flex flex-col gap-4">
                {pendingApprovals.map((approval, index) => (
                  <div 
                    key={index} 
                    className={`p-3 bg-white/5 rounded-lg border border-border ${approval.actionType === 'disabled' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground text-xs font-bold">{approval.name}</span>
                      <span className="text-muted-foreground text-[10px]">{approval.time}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mb-3 leading-relaxed">{approval.description}</p>
                    <button
                      className={`w-full py-1.5 text-[10px] font-bold rounded-md ${
                        approval.actionType === 'primary'
                          ? 'gradient-mantle text-white'
                          : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                      disabled={approval.actionType === 'disabled'}
                    >
                      {approval.actionText}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
