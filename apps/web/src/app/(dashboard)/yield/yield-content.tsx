"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useApproveRWA, useDepositToVault } from "@/lib/contracts/write-hooks";
import { CONTRACTS } from "@/lib/contracts/config";
import { useKYCStatus } from "@/lib/contracts/hooks";

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
  const { isConnected, address } = useAccount();
  const { isVerified, kycTierName, isLoading: kycLoading } = useKYCStatus(address as `0x${string}` | undefined);
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yieldOpportunities, setYieldOpportunities] = useState<YieldOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>("unknown");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<YieldOpportunity | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);


  // Deposit hooks
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirm, isSuccess: isApproved, hash: approveHash } = useApproveRWA();
  const { deposit, isPending: isDepositing, isConfirming: isDepositingConfirm, isSuccess: isDeposited, hash: depositHash, error: depositError } = useDepositToVault();

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
        setDataSource(data.meta?.source || "unknown");
        if (data.meta?.source === "unavailable") {
          setError("Yield data temporarily unavailable.");
        }
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

  // Handle deposit modal
  const handleOpenDeposit = (opportunity: YieldOpportunity) => {
    if (!isVerified) return;
    setSelectedOpportunity(opportunity);
    setShowDepositModal(true);
    setDepositAmount("");
  };

  const handleApprove = () => {
    if (!depositAmount || !address) return;
    approve(CONTRACTS.mantleSepolia.yieldVault, depositAmount);
  };

  const handleDeposit = () => {
    if (!depositAmount || !address) return;
    deposit(depositAmount, address);
  };

  // Reset modal on success
  useEffect(() => {
    if (isDeposited) {
      setTimeout(() => {
        setShowDepositModal(false);
        setDepositAmount("");
        setSelectedOpportunity(null);
      }, 3000);
    }
  }, [isDeposited]);

  // Handle AI recommendations
  const handleAIRecommendations = async () => {
    setShowAIModal(true);
    setIsLoadingAI(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskTolerance: "moderate",
          investmentAmount: 10000,
        }),
      });
      const data = await response.json();
      if (data.success && data.data.analysis) {
        setAiRecommendations(data.data.analysis);
      } else {
        setAiRecommendations("Failed to generate recommendations. Please try again.");
      }
    } catch (err) {
      setAiRecommendations("Error connecting to AI service.");
    } finally {
      setIsLoadingAI(false);
    }
  };

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
    yieldOpportunities.length > 0
      ? yieldOpportunities.reduce((sum, o) => sum + o.apy, 0) / yieldOpportunities.length
      : 0;


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
              Last updated: {lastUpdated.toLocaleTimeString()} · Source: {dataSource}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchYields} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="gradient-mantle" onClick={handleAIRecommendations}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Recommendations
          </Button>
        </div>
      </div>


      {/* Stats - Real Data */}
      {!isLoading && !error && (
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgApy.toFixed(2)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total TVL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalTvl)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yieldOpportunities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Best APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yieldOpportunities.length > 0
                  ? Math.max(...yieldOpportunities.map((o) => o.apy)).toFixed(2)
                  : "0"}
                %
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <Zap className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button variant="outline" onClick={fetchYields} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!kycLoading && !isVerified && (
        <Card className="mb-6 border-yellow-500/40 bg-yellow-500/5">
          <CardContent className="pt-6 text-sm text-yellow-600">
            KYC verification is required before depositing into the Yield Vault or deploying strategies.
            Please complete KYC in the <a href="/compliance" className="underline font-bold">Compliance Hub</a>.
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Tabs value={riskFilter} onValueChange={setRiskFilter}>
          <TabsList>
            <TabsTrigger value="all">All Risk</TabsTrigger>
            <TabsTrigger value="low">Low</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All Types</TabsTrigger>
            <TabsTrigger value="lending">Lending</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Yield Opportunities Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}

        {!isLoading &&
          !error &&
          filteredOpportunities.map((opp) => (
            <Card key={opp.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold">
                        {opp.protocol.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-sm">{opp.pair}</CardTitle>
                      <p className="text-xs text-muted-foreground">{opp.protocol}</p>
                    </div>
                  </div>
                  <Badge className={riskColors[opp.risk]}>{opp.risk}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {opp.apy.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      APY: {opp.apyBase?.toFixed(2)}% base + {opp.apyReward?.toFixed(2)}%
                      rewards
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">TVL</span>
                    <span className="font-medium">{formatCurrency(opp.tvl)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
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
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDeposit(opp)}
                      disabled={!isVerified || kycLoading}
                    >
                      Deposit to Vault
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

      {/* Deposit Modal */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit to Yield Vault</DialogTitle>
            <DialogDescription>
              {selectedOpportunity && (
                <>
                  Selected opportunity: {selectedOpportunity.protocol} - {selectedOpportunity.pair}
                  <br />
                  This deposit goes to the Yield Vault, which allocates via configured on-chain strategies.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (RWA tokens)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Show approve hash */}
            {approveHash && !isApproved && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <p className="text-sm text-blue-500">Approval pending...</p>
                </div>
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${approveHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-1 block"
                >
                  View on Mantlescan →
                </a>
              </div>
            )}

            {/* Show success */}
            {depositHash && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-green-500">
                    {isDeposited ? "Deposit successful!" : "Transaction submitted!"}
                  </p>
                </div>
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${depositHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-1 block"
                >
                  View on Mantlescan →
                </a>
              </div>
            )}

            {/* Show error */}
            {depositError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-500">Transaction failed</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {depositError.message || "Please try again"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositModal(false)}>
              Cancel
            </Button>
            {!isApproved ? (
              <Button onClick={handleApprove} disabled={isApproving || isApprovingConfirm || !depositAmount}>
                {isApproving || isApprovingConfirm ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve RWA"
                )}
              </Button>
            ) : (
              <Button onClick={handleDeposit} disabled={isDepositing || isDepositingConfirm || !depositAmount}>
                {isDepositing || isDepositingConfirm ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  "Deposit"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Recommendations Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Yield Recommendations</DialogTitle>
            <DialogDescription>
              Personalized yield strategy based on current Mantle opportunities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingAI ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{aiRecommendations}</pre>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowAIModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
