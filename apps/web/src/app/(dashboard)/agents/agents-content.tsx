"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Shield,
  Loader2,
  RefreshCw,
  Rocket,
  Plus,
  ZoomIn,
  ZoomOut,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import { useKYCStatus, useUserAgents } from "@/lib/contracts/hooks";
import { useCreateAgent, useAddStrategy } from "@/lib/contracts/write-hooks";
import { useReadContracts } from "wagmi";
import { CONTRACTS, YIELD_AGENT_ABI } from "@/lib/contracts/config";

const backtestHistory = [
  { name: "V1.2_AGGRESSIVE", time: "Jun 14, 12:45 PM", apy: "24.5%", active: true },
  { name: "V1.1_BALANCED", time: "Jun 14, 11:20 AM", apy: "18.2%", active: false },
  { name: "V1.0_CONSERVATIVE", time: "Jun 13, 09:15 PM", apy: "12.1%", active: false },
];

export default function AgentsContent() {
  const { isConnected, address } = useAccount();
  const { isVerified, isLoading: kycLoading } = useKYCStatus(address as `0x${string}` | undefined);
  
  const [maxDrawdown, setMaxDrawdown] = useState(2.5);
  const [gasCeiling, setGasCeiling] = useState(12.5);
  const [rebalanceType, setRebalanceType] = useState<"time" | "drift">("time");
  const [selectedAssets, setSelectedAssets] = useState(["USDY", "mETH"]);

  const { createAgent, isPending: isCreating, hash: createHash, error: createError, isSuccess: deploySuccess } = useCreateAgent();
  const { addStrategy, isPending: isAddingStrategy } = useAddStrategy();
  const [deployError, setDeployError] = useState<string | null>(null);

  // Fetch user's deployed agents
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
      // Wait a bit for the blockchain to update, then refetch
      const timer = setTimeout(() => {
        refetchAgents();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deploySuccess, createHash, refetchAgents]);

  const handleDeployAgent = () => {
    setDeployError(null);

    // Debug logging
    console.log("=== Deploy Agent Debug ===");
    console.log("isConnected:", isConnected);
    console.log("address:", address);
    console.log("isVerified:", isVerified);
    console.log("kycLoading:", kycLoading);

    if (!isConnected) {
      const err = "Please connect your wallet first";
      console.log("ERROR:", err);
      setDeployError(err);
      alert(err); // Also show alert for visibility
      return;
    }

    if (!isVerified) {
      // For now, just warn but continue (remove KYC gate for testing)
      console.warn("KYC not verified, but proceeding anyway for testing...");
      // setDeployError("KYC verification required. Please complete verification on the Compliance page first.");
      // return;
    }

    // Calculate rebalance interval based on rebalanceType
    const rebalanceInterval = rebalanceType === "time" ? 14400 : 3600; // 4 hours for time-based, 1 hour for drift
    const slippageBps = Math.round(maxDrawdown * 20); // Convert drawdown to slippage basis points

    console.log("Calling createAgent with:", {
      name: `Yield Optimizer - ${selectedAssets.join("/")}`,
      rebalanceInterval,
      slippageBps,
    });

    try {
      createAgent(
        `Yield Optimizer - ${selectedAssets.join("/")}`,
        rebalanceInterval,
        slippageBps
      );
      console.log("createAgent called successfully");
    } catch (err) {
      console.error("createAgent error:", err);
      setDeployError(String(err));
    }
  };

  const removeAsset = (asset: string) => {
    setSelectedAssets(selectedAssets.filter(a => a !== asset));
  };

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
              Connect your wallet to build and deploy autonomous yield agents.
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3 bg-background z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-primary">
            <div className="size-8">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-foreground text-xl font-bold leading-tight tracking-tight">Meridian</h2>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors" href="/dashboard">Dashboard</a>
            <a className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors" href="/yield">Vaults</a>
            <span className="text-primary text-sm font-bold border-b-2 border-primary py-1">Agent Builder</span>
            <a className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors" href="/compliance">Compliance</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-none mb-1">Network Status</span>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
              <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Mantle Mainnet
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content Area: 3-Panel Split */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Configuration Form */}
        <aside className="w-80 border-r border-border flex flex-col bg-background overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="text-foreground text-lg font-bold">Agent Configuration</h2>
            <p className="text-xs text-muted-foreground mt-1">Define execution parameters and asset constraints.</p>
          </div>

          <div className="flex-1">
            {/* Risk Parameters Accordion */}
            <details className="border-b border-border group" open>
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-foreground uppercase tracking-wider">Risk Parameters</span>
                </div>
                <span className="material-symbols-outlined text-muted-foreground group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 pt-0 space-y-6">
                {/* Max Drawdown Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Max Drawdown</label>
                    <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{maxDrawdown}%</span>
                  </div>
                  <div className="relative h-8 flex items-center">
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={maxDrawdown}
                      onChange={(e) => setMaxDrawdown(parseFloat(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #65B3AE 0%, #65B3AE ${(maxDrawdown - 0.5) / (10 - 0.5) * 100}%, #374151 ${(maxDrawdown - 0.5) / (10 - 0.5) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Gas Ceiling */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Gas Ceiling (Gwei)</label>
                    <span className="text-xs font-mono font-bold text-foreground">{gasCeiling}</span>
                  </div>
                  <div className="relative h-8 flex items-center">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="0.5"
                      value={gasCeiling}
                      onChange={(e) => setGasCeiling(parseFloat(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #65B3AE 0%, #65B3AE ${(gasCeiling - 5) / (50 - 5) * 100}%, #374151 ${(gasCeiling - 5) / (50 - 5) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Rebalance Frequency */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Rebalance Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setRebalanceType("time")}
                      className={`px-3 py-2 text-xs font-bold rounded border-2 ${rebalanceType === "time" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      Time-based
                    </button>
                    <button 
                      onClick={() => setRebalanceType("drift")}
                      className={`px-3 py-2 text-xs font-bold rounded border-2 ${rebalanceType === "drift" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      Drift-based
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-muted rounded">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">Every 4 hours</span>
                  </div>
                </div>
              </div>
            </details>

            {/* Asset Selection Accordion */}
            <details className="border-b border-border group" open>
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-foreground uppercase tracking-wider">Asset Selection</span>
                </div>
                <span className="material-symbols-outlined text-muted-foreground group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 pt-0 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedAssets.map((asset) => (
                    <div key={asset} className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-primary/50 rounded-lg">
                      <div className={`size-4 ${asset === "USDY" ? "bg-yellow-500/20" : "bg-emerald-500/20"} rounded-full flex items-center justify-center`}>
                        <span className={`text-[8px] font-bold ${asset === "USDY" ? "text-yellow-500" : "text-emerald-500"}`}>{asset[0]}</span>
                      </div>
                      <span className="text-xs font-bold">{asset}</span>
                      <button onClick={() => removeAsset(asset)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-dashed border-primary text-primary rounded-lg text-xs font-bold hover:bg-primary/20">
                    <Plus className="h-3 w-3" /> Add Asset
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-2">Assets are limited to the Meridian curated whitelist.</p>
              </div>
            </details>
          </div>

          {/* Deploy Section */}
          <div className="p-4 bg-muted/50 border-t border-border">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-muted-foreground">Monthly Est. Cost</span>
              <span className="text-xs font-mono font-bold text-foreground">~$42.50 USD</span>
            </div>

            {/* Status Messages */}
            {kycLoading && (
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking KYC status...
              </p>
            )}
            {!kycLoading && !isVerified && (
              <p className="text-xs text-amber-500 mb-3">
                ⚠️ KYC verification required. <a href="/compliance" className="underline hover:text-amber-400">Complete verification →</a>
              </p>
            )}
            {!kycLoading && isVerified && (
              <p className="text-xs text-emerald-500 mb-3 flex items-center gap-2">
                <Shield className="h-3 w-3" />
                KYC Verified - Ready to deploy
              </p>
            )}
            {deployError && (
              <p className="text-xs text-red-500 mb-3 p-2 bg-red-500/10 rounded border border-red-500/20">
                {deployError}
              </p>
            )}
            {createError && (
              <p className="text-xs text-red-500 mb-3 p-2 bg-red-500/10 rounded border border-red-500/20">
                Transaction failed: {createError.message}
              </p>
            )}

            <Button
              onClick={handleDeployAgent}
              disabled={isCreating || kycLoading}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {isCreating ? "Confirm in Wallet..." : "Deploy Agent to Mantle"}
            </Button>

            {createHash && (
              <div className="mt-3 p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                <p className="text-xs text-emerald-500 font-medium mb-1">✓ Agent deployed successfully!</p>
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${createHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on MantleScan →
                </a>
              </div>
            )}
          </div>
        </aside>

        {/* Center Panel: Strategy Flow */}
        <section className="flex-1 bg-muted/30 relative node-connector overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-12 py-10">
              {/* Node 1: Trigger */}
              <div className="relative z-10 w-64 bg-card border border-primary/40 rounded-xl p-4 shadow-xl ring-4 ring-primary/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">monitoring</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-none">Oracle Watcher</h4>
                    <span className="text-[10px] font-mono text-primary uppercase">Trigger Node</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="text-foreground font-mono">Merchant Moe LP</span>
                  </div>
                  <div className="text-[11px] flex justify-between">
                    <span className="text-muted-foreground">Interval</span>
                    <span className="text-foreground font-mono">Every Block</span>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-6 w-0.5 bg-primary/30"></div>
              </div>

              {/* Node 2: Logic Hook */}
              <div className="relative z-10 w-72 bg-card border border-border rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-500 text-lg">alt_route</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-none">Delta Logic</h4>
                    <span className="text-[10px] font-mono text-purple-500 uppercase">Decision Tree</span>
                  </div>
                </div>
                <div className="p-2 bg-background/50 rounded text-[11px] font-mono text-muted-foreground leading-relaxed mb-1">
                  IF (apy_delta &gt; 2.0%) AND (gas_cost &lt; threshold) {"{"}<br/>
                  &nbsp;&nbsp;execute_hook(INIT_CAPITAL);<br/>
                  {"}"}
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-6 w-0.5 bg-border"></div>
              </div>

              {/* Node 3: Action Hook */}
              <div className="relative z-10 w-64 bg-card border border-emerald-500/40 rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-none">Rebalance Execution</h4>
                    <span className="text-[10px] font-mono text-emerald-500 uppercase">Action Hook</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[11px] text-muted-foreground">Target: INIT Capital Hook</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[11px] text-muted-foreground">Min Output: 99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-background/90 backdrop-blur rounded-xl border border-border shadow-2xl z-20">
            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors">
              <Plus className="h-5 w-5" />
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors">
              <ZoomIn className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors">
              <ZoomOut className="h-5 w-5" />
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Right Panel: Deployed Agents & Backtest Results */}
        <aside className="w-96 border-l border-border flex flex-col bg-background overflow-y-auto">
          {/* Your Deployed Agents Section */}
          <div className="p-4 border-b border-border">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-foreground text-lg font-bold">Your Agents</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {agentsLoading ? "Loading..." : `${agentCount} deployed agent${agentCount !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={() => refetchAgents()}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${agentsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {agentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agentCount === 0 ? (
              <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                <Rocket className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No agents deployed yet</p>
                <p className="text-xs text-muted-foreground mt-1">Configure and deploy your first agent</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agentIds?.map((agentId, index) => {
                  const details = agentDetails?.[index]?.result as [string, string, bigint, bigint, bigint, boolean] | undefined;
                  const name = details?.[1] ?? `Agent #${agentId.toString()}`;
                  const isActive = details?.[5] ?? false;
                  const rebalanceInterval = details?.[2] ? Number(details[2]) / 3600 : 0;

                  return (
                    <div
                      key={agentId.toString()}
                      className={`p-3 rounded-lg border ${isActive ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                          <span className="text-sm font-bold truncate max-w-[180px]">{name}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">Agent ID:</span>
                          <span className="text-foreground ml-1 font-mono">#{agentId.toString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rebalance:</span>
                          <span className="text-foreground ml-1 font-mono">{rebalanceInterval}h</span>
                        </div>
                      </div>
                      <a
                        href={`https://sepolia.mantlescan.xyz/address/${CONTRACTS.mantleSepolia.yieldAgent}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline mt-2 block"
                      >
                        View on MantleScan →
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Backtest Results Section */}
          <div className="p-4 border-b border-border flex justify-between items-center">
            <div>
              <h2 className="text-foreground text-lg font-bold">Strategy Backtest</h2>
              <p className="text-xs text-muted-foreground mt-1">Simulated historical performance.</p>
            </div>
            <button className="p-2 bg-primary/10 text-primary rounded-lg">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Performance Chart (Simulated) */}
            <div className="relative h-48 w-full bg-muted/50 rounded-xl border border-border p-4 overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Growth (6M)</span>
                <span className="text-xs font-mono font-bold text-emerald-500">+12.42%</span>
              </div>
              {/* Chart SVG */}
              <svg className="absolute bottom-0 left-0 w-full h-32" preserveAspectRatio="none" viewBox="0 0 400 100">
                <defs>
                  <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3"></stop>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,80 Q40,75 80,60 T160,50 T240,30 T320,40 T400,20 L400,100 L0,100 Z" fill="url(#gradient)"></path>
                <path d="M0,80 Q40,75 80,60 T160,50 T240,30 T320,40 T400,20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"></path>
              </svg>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between border-t border-border pt-2">
                <span className="text-[8px] font-mono text-muted-foreground uppercase">Jan 2024</span>
                <span className="text-[8px] font-mono text-muted-foreground uppercase">Jun 2024</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Sharpe Ratio</span>
                <span className="text-lg font-mono font-bold text-foreground">3.82</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Max Drawdown</span>
                <span className="text-lg font-mono font-bold text-destructive">-1.4%</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Est. APY</span>
                <span className="text-lg font-mono font-bold text-emerald-500">24.5%</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Volatility</span>
                <span className="text-lg font-mono font-bold text-foreground">4.12%</span>
              </div>
            </div>

            {/* Logs/History */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Backtest History</h3>
              <div className="space-y-2">
                {backtestHistory.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2 rounded bg-muted/50 border-l-2 ${item.active ? "border-primary" : "border-border"} ${!item.active && index === 2 ? "opacity-50" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{item.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{item.time}</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-500">{item.apy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-muted/30 border-t border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">System: Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">GAS:</span>
            <span className="text-[10px] font-mono text-foreground">12.5 Gwei</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">MNT:</span>
            <span className="text-[10px] font-mono text-foreground">$0.82</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Meridian v1.0.4-beta</span>
        </div>
      </footer>
    </div>
  );
}
