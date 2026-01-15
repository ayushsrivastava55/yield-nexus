"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Shield,
  Loader2,
  Download,
  FileText,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Zap,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const ledgerEntries = [
  {
    type: "rebalance",
    title: "Portfolio Asset Shift",
    timestamp: "Oct 31, 2023 • 14:22:45 UTC",
    verified: true,
    icon: "swap_horiz",
    iconColor: "bg-primary",
    reasoning: `Trigger: Yield variance detected in Merchant Moe LP pools.
Condition: APR dropped from 12.4% to 7.1% (threshold 8%).
Action: Reallocating 500,000 USDC to Ondo USDY Treasury to maintain risk-adjusted yield targets.
Execution slippage: 0.02%.`,
    txId: "0x4a...c9e2",
    daBatch: "#928,112",
  },
  {
    type: "compliance",
    title: "Quarterly AML Refresh",
    timestamp: "Oct 31, 2023 • 09:15:02 UTC",
    verified: true,
    icon: "shield",
    iconColor: "bg-emerald-500",
    reasoning: `Compliance agent 'Sentry-04' completed automated wallet screening for 1,402 associated LPs.
No high-risk addresses found. Attestation published to Mantle DA.`,
    attestation: "sha256:7f08...",
  },
  {
    type: "alert",
    title: "Volatility Guard Triggered",
    timestamp: "Oct 30, 2023 • 23:58:12 UTC",
    verified: true,
    icon: "notification_important",
    iconColor: "bg-amber-500",
    reasoning: `Mantle Network congestion detected (>200 gwei).
Automated decision: Deferred non-critical rebalancing for 120 minutes to save 0.45% in gas-related yield erosion.`,
    status: "Throttled",
  },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  rebalance: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400" },
  compliance: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400" },
  alert: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400" },
};

export default function AuditContent() {
  const { isConnected } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);

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
              Connect your wallet to view the audit and reasoning ledger.
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
      <header className="flex items-center justify-between border-b border-border px-8 py-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-foreground text-xl font-bold">Audit & Reasoning Ledger</h2>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2 bg-mantle-teal/10 px-2 py-1 rounded">
            <div className="size-2 rounded-full bg-mantle-teal animate-pulse"></div>
            <span className="text-[10px] font-bold text-mantle-teal uppercase">Mantle DA</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <ConnectButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-border hidden lg:flex flex-col justify-between p-4 bg-background">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col px-3">
              <h1 className="text-foreground text-base font-bold">Institutional Pro</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <p className="text-muted-foreground text-xs font-medium">Verified Node: MN-482</p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
                <p className="text-sm font-bold">Full Ledger</p>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
                <Zap className="h-5 w-5" />
                <p className="text-sm font-medium">Yield Reasoning</p>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
                <Shield className="h-5 w-5" />
                <p className="text-sm font-medium">Compliance Vault</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Network Status</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Mantle DA Sync</span>
              <span className="text-xs font-bold text-emerald-500">Healthy</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[98%]"></div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Page Heading */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
              <div className="flex min-w-72 flex-col gap-2">
                <p className="text-foreground text-4xl font-black leading-tight tracking-tight">Audit & Reasoning Ledger</p>
                <p className="text-muted-foreground text-base font-normal">Real-time verifiable record of AI orchestration and compliance on Mantle DA.</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-5 w-5" />
                  <p className="text-sm font-medium">Total Actions (24h)</p>
                </div>
                <p className="text-foreground text-3xl font-bold leading-tight">1,284</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-5 w-5" />
                  <p className="text-sm font-medium">Compliance Status</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-foreground text-3xl font-bold leading-tight">Verified</p>
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5" />
                  <p className="text-sm font-medium">Last Mantle DA Sync</p>
                </div>
                <p className="text-foreground text-3xl font-bold leading-tight">2.4s ago</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 bg-card border border-border rounded-xl mb-8">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Oct 24 - Oct 31, 2023</span>
                </div>
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border cursor-pointer hover:border-primary transition-colors">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">All Asset Classes</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                  <FileText className="h-4 w-4" />
                  Export PDF for Auditors
                </Button>
              </div>
            </div>

            {/* Ledger Feed */}
            <div className="flex flex-col gap-6 relative">
              {ledgerEntries.map((entry, index) => (
                <div key={index} className="ledger-item relative flex gap-6">
                  <div className="ledger-line relative z-10">
                    <div className={`w-10 h-10 rounded-full ${entry.iconColor} flex items-center justify-center text-white ring-4 ring-background`}>
                      <span className="material-symbols-outlined text-[20px]">{entry.icon}</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-card rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2 py-0.5 rounded ${typeColors[entry.type].bg} ${typeColors[entry.type].text} text-[10px] font-bold uppercase tracking-wider`}>
                            {entry.type}
                          </span>
                          <h3 className="text-foreground font-bold text-lg">{entry.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-xs font-medium">{entry.timestamp}</p>
                      </div>
                      {entry.verified && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Mantle DA Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border mb-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 font-mono">
                        {entry.type === "compliance" ? "Agent Verification" : entry.type === "alert" ? "Decision Reasoning" : "AI Reasoning Log"}
                      </p>
                      <p className="text-sm font-mono text-muted-foreground leading-relaxed whitespace-pre-line">
                        {entry.reasoning}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4">
                        {entry.txId && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-bold">TX ID:</span> <span className="font-mono">{entry.txId}</span>
                          </div>
                        )}
                        {entry.daBatch && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-bold">DA Batch:</span> <span className="font-mono">{entry.daBatch}</span>
                          </div>
                        )}
                        {entry.attestation && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-bold">Attestation:</span> <span className="font-mono">{entry.attestation}</span>
                          </div>
                        )}
                        {entry.status && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-bold">Protocol Status:</span> <span className="text-amber-500">{entry.status}</span>
                          </div>
                        )}
                      </div>
                      <button className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                        {entry.type === "compliance" ? "View Certificate" : entry.type === "alert" ? "Gas Metrics" : "View on Explorer"}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold">1</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">2</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">3</button>
              <span className="px-2 text-muted-foreground">...</span>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">24</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
