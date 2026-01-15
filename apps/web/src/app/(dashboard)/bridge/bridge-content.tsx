"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Shield,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Play,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const recentTransfers = [
  {
    asset: "USDY (Ondo)",
    id: "RWA-ONDO-2941",
    from: "ETH",
    to: "MNT",
    daStatus: "verifying",
    status: "Pending Custody",
  },
  {
    asset: "USTB (Superstate)",
    id: "RWA-SUPR-8812",
    from: "ETH",
    to: "MNT",
    daStatus: "confirmed",
    status: "Finalized",
  },
  {
    asset: "USDY (Ondo)",
    id: "RWA-ONDO-1102",
    from: "ETH",
    to: "MNT",
    daStatus: "confirmed",
    status: "Finalized",
  },
];

export default function BridgeContent() {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("50,000.00");
  const [sourceChain, setSourceChain] = useState("Ethereum L1");
  const [destChain, setDestChain] = useState("Mantle Network");

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
              Connect your wallet to bridge RWA assets to Mantle Network.
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 lg:px-40 py-3 bg-background">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-8">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight">Yield Nexus</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden md:flex items-center gap-9">
            <a className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors" href="/yield">Vaults</a>
            <span className="text-primary text-sm font-bold">Bridge</span>
            <a className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors" href="/compliance">Governance</a>
            <a className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors" href="/dashboard">Stats</a>
          </nav>
          <div className="flex gap-2">
            <ConnectButton />
            <Button variant="secondary">Institutional</Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center py-10 px-6 lg:px-40 overflow-y-auto">
        <div className="flex flex-col max-w-[960px] flex-1 gap-8">
          {/* Page Heading */}
          <div className="flex flex-col gap-3">
            <h1 className="text-foreground text-4xl font-black leading-tight tracking-tight">Cross-Chain RWA Gateway</h1>
            <p className="text-muted-foreground text-lg font-normal leading-normal max-w-2xl">
              Securely move institutional yield-bearing assets to Mantle Network via Anchorage Digital custody.
            </p>
          </div>

          {/* Custody Status Panel */}
          <div className="flex flex-1 flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-foreground text-base font-bold leading-tight">Vault Custody Active</p>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  Secured by <strong>Anchorage Digital</strong> integration. Assets are held in segregated institutional-grade custody.
                </p>
              </div>
            </div>
            <a className="text-sm font-bold leading-normal tracking-tight flex items-center gap-2 text-primary hover:underline" href="#">
              View Security Audit
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Central Bridge Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Bridge Card */}
            <div className="lg:col-span-8 flex flex-col gap-6 p-6 rounded-xl border border-border bg-card shadow-lg">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Source */}
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Source Chain</label>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted">
                      <div className="size-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">token</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground font-bold">{sourceChain}</span>
                        <span className="text-muted-foreground text-xs">Mainnet</span>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center justify-center self-center md:pt-6">
                    <div className="size-10 rounded-full border border-border bg-card flex items-center justify-center text-primary shadow-sm rotate-90 md:rotate-0">
                      <RefreshCw className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Destination Chain</label>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
                      <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-sm">hub</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground font-bold">{destChain}</span>
                        <span className="text-primary text-xs font-medium">Modular L2</span>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Asset Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Asset to Bridge</label>
                  <div className="p-4 rounded-lg border border-border bg-muted flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border cursor-pointer">
                        <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[12px] font-bold">monetization_on</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">USDY (Ondo)</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                      <span className="text-xs text-muted-foreground">Balance: 250,000.00 USDY</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <Input
                        className="bg-transparent border-none p-0 text-3xl font-black focus-visible:ring-0 text-foreground placeholder:text-muted w-full"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <span className="text-sm font-medium text-muted-foreground mb-1">~$50,000.00</span>
                    </div>
                  </div>
                </div>

                {/* Institutional Badge */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">INSTITUTIONAL GRADE</span>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-500">Direct custody transfer via Anchorage Digital APIs. Compliance metadata attached.</p>
                  </div>
                </div>

                <Button className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                  <Wallet className="h-5 w-5" />
                  Initiate Transfer
                </Button>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Transfer Details
                </h3>
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Time</span>
                    <span className="text-foreground font-medium">~15 Minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bridge Fee</span>
                    <span className="text-foreground font-medium">0.05% ($25.00)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DA Security</span>
                    <span className="text-primary font-bold">Mantle DA Active</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs uppercase font-bold tracking-tighter">Bridge Protection</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      On-chain Provenance Track
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Multi-sig Verification
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-video bg-primary/20 border border-primary/30 flex items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center text-center p-6">
                  <Play className="h-10 w-10 text-white mb-2" />
                  <p className="text-white font-bold">How Yield Nexus Works</p>
                  <p className="text-white/70 text-xs">Bridge and Yield Orchestration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History & Provenance Table */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground text-xl font-bold">Recent RWA Transfers</h2>
                <p className="text-muted-foreground text-sm">Institutional provenance and Mantle DA proof status</p>
              </div>
              <button className="text-sm font-bold text-primary flex items-center gap-1">
                View All <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset & ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Movement</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Provenance</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Mantle DA Proof</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTransfers.map((transfer, index) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-bold text-sm">{transfer.asset}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">ID: {transfer.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{transfer.from}</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="text-xs text-foreground font-medium">{transfer.to}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a className="flex items-center gap-1 text-xs text-primary hover:underline font-medium" href="#">
                          <span className="material-symbols-outlined text-sm">description</span>
                          View Deed
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {transfer.daStatus === "verifying" ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 w-fit">
                            <div className="size-1.5 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-[10px] font-bold text-primary">VERIFYING</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">DA Confirmed</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-bold ${transfer.status === "Finalized" ? "text-emerald-500" : "text-foreground"}`}>
                          {transfer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Section */}
          <footer className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between gap-6 pb-20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="size-6 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                  </svg>
                </div>
                <span className="font-bold text-foreground">Yield Nexus Platform</span>
              </div>
              <p className="text-muted-foreground text-xs max-w-xs">
                An institutional-grade RWA yield orchestration platform on the Mantle network. Custody services provided by Anchorage Digital.
              </p>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-widest">Resources</span>
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Documentation</a>
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Security Model</a>
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">API Reference</a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-widest">Connect</span>
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Twitter</a>
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Discord</a>
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">Governance Forum</a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
