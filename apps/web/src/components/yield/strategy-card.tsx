"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, Shield, Zap, CheckCircle, AlertTriangle } from "lucide-react";

export interface StrategyAllocation {
  protocol: string;
  pair: string;
  allocation: number; // percentage
  amount: number; // dollar amount
  apy: number;
  expectedReturn: number;
  sharpeRatio: number;
  riskScore: number;
  contractAddress?: string;
  poolId?: string;
}

export interface ExecutableStrategy {
  id: string;
  name: string;
  description: string;
  allocations: StrategyAllocation[];
  metrics: {
    totalAPY: number;
    totalReturn: number;
    sharpeRatio: number;
    riskScore: number;
    diversification: number;
  };
  recommendations: string[];
  rebalancingFrequency: string;
  gasEstimate: number;
  totalInvestment: number;
}

interface StrategyCardProps {
  strategy: ExecutableStrategy;
  onImplement: (strategy: ExecutableStrategy) => Promise<void>;
  isImplementing?: boolean;
}

const riskColor = (score: number) => {
  if (score < 35) return "text-green-500";
  if (score < 60) return "text-yellow-500";
  return "text-red-500";
};

const sharpeColor = (ratio: number) => {
  if (ratio > 1) return "text-green-500";
  if (ratio > 0.5) return "text-yellow-500";
  return "text-red-500";
};

export function StrategyCard({ strategy, onImplement, isImplementing = false }: StrategyCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border-dark bg-card-dark hover:border-mantle-teal/30 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              {strategy.name}
              <Badge variant="outline" className="text-xs">
                {strategy.rebalancingFrequency}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-mantle-teal">
              {strategy.metrics.totalAPY.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">Blended APY</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="text-xs text-muted-foreground mb-1">Expected Return</div>
            <div className="text-lg font-bold text-foreground">
              ${strategy.metrics.totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">/year</div>
          </div>

          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="text-xs text-muted-foreground mb-1">Sharpe Ratio</div>
            <div className={`text-lg font-bold ${sharpeColor(strategy.metrics.sharpeRatio)}`}>
              {strategy.metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {strategy.metrics.sharpeRatio > 1 ? "Excellent" : strategy.metrics.sharpeRatio > 0.5 ? "Good" : "Review"}
            </div>
          </div>

          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="text-xs text-muted-foreground mb-1">Risk Score</div>
            <div className={`text-lg font-bold ${riskColor(strategy.metrics.riskScore)}`}>
              {strategy.metrics.riskScore.toFixed(0)}/100
            </div>
            <div className="text-xs text-muted-foreground">
              {strategy.metrics.riskScore < 35 ? "Low" : strategy.metrics.riskScore < 60 ? "Medium" : "High"}
            </div>
          </div>

          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="text-xs text-muted-foreground mb-1">Diversification</div>
            <div className="text-lg font-bold text-foreground">
              {strategy.metrics.diversification.toFixed(0)}/100
            </div>
            <Progress value={strategy.metrics.diversification} className="h-1 mt-1" />
          </div>
        </div>

        {/* Allocations Preview */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">Allocations ({strategy.allocations.length} positions)</div>
          {strategy.allocations.slice(0, expanded ? undefined : 3).map((alloc, idx) => (
            <div key={idx} className="flex items-center justify-between bg-background-dark rounded-lg p-2 border border-border-dark">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-primary/10 rounded-full size-8 flex items-center justify-center text-xs font-bold text-primary">
                  {alloc.allocation.toFixed(0)}%
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {alloc.protocol} - {alloc.pair}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${alloc.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} • {alloc.apy.toFixed(2)}% APY
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-mantle-teal">
                  +${alloc.expectedReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
                </div>
                <div className="text-xs text-muted-foreground">
                  Sharpe: {alloc.sharpeRatio.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
          {strategy.allocations.length > 3 && !expanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Show {strategy.allocations.length - 3} more positions
            </Button>
          )}
          {expanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Show less
            </Button>
          )}
        </div>

        {/* Recommendations */}
        {strategy.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-foreground">Key Recommendations</div>
            {strategy.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                {rec.includes("⚠️") ? (
                  <AlertTriangle className="size-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="size-3 text-mantle-teal mt-0.5 flex-shrink-0" />
                )}
                <span>{rec.replace(/[⚠️💡✅]/g, "").trim()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Implementation Details */}
        <div className="flex items-center justify-between pt-2 border-t border-border-dark">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="size-3" />
              <span>~${strategy.gasEstimate} gas</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="size-3" />
              <span>{strategy.allocations.length} transactions</span>
            </div>
          </div>

          <Button
            onClick={() => onImplement(strategy)}
            disabled={isImplementing}
            className="bg-mantle-teal hover:bg-mantle-teal/90 text-white font-semibold"
          >
            {isImplementing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Implementing...
              </>
            ) : (
              <>
                <TrendingUp className="size-4 mr-2" />
                Implement Strategy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
