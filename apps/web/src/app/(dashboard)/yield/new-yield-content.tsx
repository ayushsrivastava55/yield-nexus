"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, TrendingUp, Loader2, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { useKYCStatus } from "@/lib/contracts/hooks";
import { StrategyCard, ExecutableStrategy } from "@/components/yield/strategy-card";
import { useWalletPortfolio, analyzePortfolioWithAI } from "@/hooks/use-wallet-portfolio";
import { buildExecutionSteps, executeStrategy, StrategyExecution } from "@/lib/contracts/strategy-executor";
import { toast } from "sonner";

export default function NewYieldContent() {
  const { isConnected, address } = useAccount();
  const { isVerified, isLoading: kycLoading } = useKYCStatus(address as `0x${string}` | undefined);
  const portfolio = useWalletPortfolio();

  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [strategies, setStrategies] = useState<ExecutableStrategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [isImplementing, setIsImplementing] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<StrategyExecution | null>(null);

  // Generate strategies based on real portfolio
  const generateStrategies = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isVerified) {
      toast.error("Please complete KYC verification first");
      return;
    }

    const rwaBalance = Number(portfolio.rwaBalance) / 1e18;
    if (rwaBalance === 0) {
      toast.error("No RWA tokens found. Please mint tokens in the Compliance Hub.");
      return;
    }

    setIsLoadingStrategies(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskTolerance,
          investmentAmount: rwaBalance,
          walletAddress: address,
        }),
      });

      const data = await response.json();
      if (data.success && data.data.portfolio) {
        // Convert API response to executable strategies
        const strategy: ExecutableStrategy = {
          id: `strategy-${Date.now()}`,
          name: `${riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1)} Yield Strategy`,
          description: `Optimized for ${riskTolerance} risk tolerance with ${data.data.portfolio.allocations.length} positions`,
          allocations: data.data.portfolio.allocations.map((alloc: any) => ({
            ...alloc,
            contractAddress: "0xD7044e9D798B5d2F6d18464bd3b8cb21f489E4EA", // YieldVault
          })),
          metrics: data.data.portfolio.metrics,
          recommendations: data.data.portfolio.recommendations,
          rebalancingFrequency: data.data.portfolio.rebalancingFrequency,
          gasEstimate: data.data.portfolio.gasEstimate,
          totalInvestment: rwaBalance,
        };

        setStrategies([strategy]);
        toast.success("Strategy generated based on your portfolio!");
      } else {
        toast.error("Failed to generate strategy");
      }
    } catch (error) {
      console.error("Strategy generation error:", error);
      toast.error("Error generating strategy");
    } finally {
      setIsLoadingStrategies(false);
    }
  };

  // Implement strategy with real transactions
  const handleImplementStrategy = async (strategy: ExecutableStrategy) => {
    if (!address) return;

    setIsImplementing(true);
    try {
      // Build execution steps
      const steps = buildExecutionSteps(strategy.allocations, address);

      toast.info(`Preparing ${steps.length} transactions...`);

      // Execute strategy with progress tracking
      const result = await executeStrategy(steps, (progress) => {
        setExecutionProgress(progress);
        if (progress.currentStep > 0) {
          toast.info(
            `Step ${progress.currentStep}/${progress.totalSteps}: ${steps[progress.currentStep - 1].description}`
          );
        }
      });

      if (result.status === "completed") {
        toast.success("Strategy implemented successfully! 🎉");
        setExecutionProgress(null);
      } else {
        toast.error("Strategy implementation failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Implementation error:", error);
      toast.error(error.message || "Failed to implement strategy");
    } finally {
      setIsImplementing(false);
    }
  };

  // Auto-generate on mount if wallet connected and verified
  useEffect(() => {
    if (isConnected && isVerified && !portfolio.isLoading && strategies.length === 0) {
      generateStrategies();
    }
  }, [isConnected, isVerified, portfolio.isLoading]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-border-dark bg-card-dark max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Wallet className="size-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to access personalized yield strategies
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-border-dark bg-card-dark max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              KYC Required
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Complete KYC verification to access institutional yield strategies
            </p>
            <Button onClick={() => (window.location.href = "/compliance")} className="bg-mantle-teal">
              Go to Compliance Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Yield Discovery</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered strategies tailored to your portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-border-dark bg-card-dark">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">RWA Balance</div>
            <div className="text-2xl font-bold text-foreground">
              {(Number(portfolio.rwaBalance) / 1e18).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              RWA
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-dark bg-card-dark">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">MNT Balance</div>
            <div className="text-2xl font-bold text-foreground">
              {(Number(portfolio.nativeBalance) / 1e18).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              MNT
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-dark bg-card-dark">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Tokens</div>
            <div className="text-2xl font-bold text-foreground">{portfolio.tokens.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border-dark bg-card-dark">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Risk Tolerance</div>
            <Select value={riskTolerance} onValueChange={(v: any) => setRiskTolerance(v)}>
              <SelectTrigger className="bg-background-dark border-border-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Generation */}
      <Card className="border-border-dark bg-card-dark">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-mantle-teal" />
              AI-Generated Strategies
            </CardTitle>
            <Button
              onClick={generateStrategies}
              disabled={isLoadingStrategies || portfolio.isLoading}
              variant="outline"
              size="sm"
            >
              {isLoadingStrategies ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStrategies ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="size-8 animate-spin text-mantle-teal mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Analyzing your portfolio and market conditions...
                </p>
              </div>
            </div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="size-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">
                Click "Regenerate" to generate strategies based on your portfolio
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onImplement={handleImplementStrategy}
                  isImplementing={isImplementing}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Progress */}
      {executionProgress && (
        <Card className="border-mantle-teal bg-card-dark">
          <CardHeader>
            <CardTitle className="text-sm">Executing Strategy...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Step {executionProgress.currentStep} of {executionProgress.totalSteps}
                </span>
                <Badge variant="outline" className="text-xs">
                  {executionProgress.status}
                </Badge>
              </div>
              <div className="w-full bg-background-dark rounded-full h-2">
                <div
                  className="bg-mantle-teal h-2 rounded-full transition-all"
                  style={{
                    width: `${(executionProgress.currentStep / executionProgress.totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
