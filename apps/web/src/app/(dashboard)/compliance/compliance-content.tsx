"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Globe,
  Building,
  User,
  ArrowRight,
} from "lucide-react";

// KYC Status data
const kycSteps = [
  {
    id: 1,
    title: "Personal Information",
    description: "Basic identity verification",
    status: "completed",
    icon: User,
  },
  {
    id: 2,
    title: "Document Verification",
    description: "ID and proof of address",
    status: "completed",
    icon: FileText,
  },
  {
    id: 3,
    title: "Accreditation",
    description: "Investor qualification",
    status: "in_progress",
    icon: Building,
  },
  {
    id: 4,
    title: "Compliance Review",
    description: "Final approval",
    status: "pending",
    icon: Shield,
  },
];

const statusIcons = {
  completed: CheckCircle,
  in_progress: Clock,
  pending: AlertCircle,
};

const statusColors = {
  completed: "text-green-500",
  in_progress: "text-yellow-500",
  pending: "text-muted-foreground",
};

export default function ComplianceContent() {
  const { isConnected, address } = useAccount();
  const [currentTier] = useState<"retail" | "accredited" | "institutional">("retail");

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
              Connect your wallet to manage compliance and KYC verification.
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const completedSteps = kycSteps.filter((s) => s.status === "completed").length;
  const progressPercent = (completedSteps / kycSteps.length) * 100;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Compliance Hub</h1>
        <p className="mt-1 text-muted-foreground">
          Manage KYC verification and compliance requirements for RWA investments
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>KYC Status</CardTitle>
                <CardDescription>
                  Complete verification to unlock higher investment limits
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              >
                In Progress
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Verification Progress
                </span>
                <span className="text-sm font-medium">
                  {completedSteps}/{kycSteps.length} steps
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="space-y-4">
              {kycSteps.map((step, index) => {
                const StatusIcon = statusIcons[step.status as keyof typeof statusIcons];
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      step.status === "in_progress"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        step.status === "completed"
                          ? "bg-green-500/10"
                          : step.status === "in_progress"
                          ? "bg-primary/10"
                          : "bg-muted"
                      }`}
                    >
                      <StepIcon
                        className={`h-5 w-5 ${
                          step.status === "completed"
                            ? "text-green-500"
                            : step.status === "in_progress"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{step.title}</h4>
                        <StatusIcon
                          className={`h-4 w-4 ${statusColors[step.status as keyof typeof statusColors]}`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {step.status === "in_progress" && (
                      <Button size="sm">
                        Continue
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                    {step.status === "completed" && (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Verified
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Tier</CardTitle>
            <CardDescription>Your current verification level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold capitalize">{currentTier}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Current tier
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Investment</span>
                <span className="font-medium">$10,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Protocols</span>
                <span className="font-medium">Limited</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agent Limit</span>
                <span className="font-medium">3 agents</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-3">
                Upgrade to Accredited for higher limits
              </p>
              <Button className="w-full" variant="outline">
                Upgrade Tier
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Comparison */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tier Benefits</CardTitle>
          <CardDescription>
            Compare investment tiers and their benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                tier: "Retail",
                maxInvestment: "$10,000",
                protocols: "Limited",
                agents: "3",
                features: ["Basic yields", "Standard support"],
                current: currentTier === "retail",
              },
              {
                tier: "Accredited",
                maxInvestment: "$1,000,000",
                protocols: "All",
                agents: "10",
                features: ["All yields", "Priority support", "Advanced strategies"],
                current: currentTier === "accredited",
              },
              {
                tier: "Institutional",
                maxInvestment: "Unlimited",
                protocols: "All + Private",
                agents: "Unlimited",
                features: [
                  "Custom strategies",
                  "Dedicated manager",
                  "API access",
                  "Audit reports",
                ],
                current: currentTier === "institutional",
              },
            ].map((tier) => (
              <div
                key={tier.tier}
                className={`p-6 rounded-lg border ${
                  tier.current
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{tier.tier}</h3>
                  {tier.current && (
                    <Badge className="bg-primary text-primary-foreground">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Investment</span>
                    <span className="font-medium">{tier.maxInvestment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Protocols</span>
                    <span className="font-medium">{tier.protocols}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Agents</span>
                    <span className="font-medium">{tier.agents}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Features</p>
                  <ul className="space-y-1">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-sm flex items-center gap-2"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Wallet</CardTitle>
          <CardDescription>
            Wallet linked to your compliance profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-mono text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <p className="text-xs text-muted-foreground">
                Mantle Network
              </p>
            </div>
            <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
