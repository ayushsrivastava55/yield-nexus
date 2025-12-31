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
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useKYCStatus, useRWAToken, useRWABalance } from "@/lib/contracts/hooks";
import { useRegisterIdentity, useMintRWAToken } from "@/lib/contracts/write-hooks";
import { CONTRACTS, KYCTier, getKYCTierName } from "@/lib/contracts/config";

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
  
  // Real contract data
  const { isVerified, kycTier, kycTierName, isLoading: kycLoading } = useKYCStatus(
    address as `0x${string}` | undefined
  );
  const { name: tokenName, symbol, totalSupply, supplyCap, isLoading: tokenLoading } = useRWAToken();
  const { balance, isLoading: balanceLoading } = useRWABalance(address as `0x${string}` | undefined);

  // Contract write hooks
  const { register, isPending: isRegistering, isSuccess: registerSuccess, hash: registerHash } = useRegisterIdentity();
  const { mint, isPending: isMinting, isSuccess: mintSuccess, hash: mintHash } = useMintRWAToken();

  // Handle KYC registration (demo - registers as Retail tier)
  const handleRegisterKYC = () => {
    if (address) {
      register(address as `0x${string}`, address as `0x${string}`, 840, KYCTier.Retail); // 840 = USA country code
    }
  };

  // Handle token minting (demo - mints 100 tokens)
  const handleMintTokens = () => {
    if (address) {
      mint(address as `0x${string}`, "100");
    }
  };

  // Determine current tier based on contract data
  const currentTier = kycTier === KYCTier.Institutional 
    ? "institutional" 
    : kycTier === KYCTier.Accredited 
    ? "accredited" 
    : "retail";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Compliance Hub</h1>
        <p className="mt-1 text-muted-foreground">
          On-chain KYC verification and RWA token management
        </p>
      </div>

      {/* Transaction Status */}
      {(registerHash || mintHash) && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            {(isRegistering || isMinting) ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (registerSuccess || mintSuccess) ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-500" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isRegistering ? "Registering identity..." : 
                 isMinting ? "Minting tokens..." :
                 registerSuccess ? "Identity registered!" :
                 mintSuccess ? "Tokens minted!" : "Transaction pending"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {registerHash || mintHash}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://sepolia.mantlescan.xyz/tx/${registerHash || mintHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Overview - Real Contract Data */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>On-Chain KYC Status</CardTitle>
                <CardDescription>
                  Identity verification from IdentityRegistry contract
                </CardDescription>
              </div>
              {kycLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Badge
                  variant="outline"
                  className={isVerified 
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  }
                >
                  {isVerified ? "Verified" : "Not Verified"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KYC Status Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Verification Status</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  {kycLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isVerified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      Pending
                    </>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">KYC Tier</p>
                <p className="text-lg font-semibold">
                  {kycLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    kycTierName
                  )}
                </p>
              </div>
            </div>

            {/* Register KYC Action */}
            {!isVerified && !kycLoading && (
              <div className="p-4 rounded-lg border border-dashed">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Register Your Identity</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete on-chain KYC verification to access RWA investments
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: This action requires the registrar role on the IdentityRegistry.
                    </p>
                  </div>
                  <Button onClick={handleRegisterKYC} disabled={isRegistering}>
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Register KYC
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Contract Info */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">IdentityRegistry Contract</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm">{CONTRACTS.mantleSepolia.identityRegistry}</p>
                <Button variant="ghost" size="sm" asChild>
                  <a 
                    href={`https://sepolia.mantlescan.xyz/address/${CONTRACTS.mantleSepolia.identityRegistry}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
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

      {/* RWA Token Management */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>RWA Token</CardTitle>
          <CardDescription>
            ERC-3643 compliant token on Mantle Sepolia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Token Name</p>
              <p className="text-lg font-semibold">
                {tokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : tokenName || "ynRWA"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
              <p className="text-lg font-semibold">
                {balanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${parseFloat(balance).toFixed(2)} ${symbol || "ynRWA"}`}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
              <p className="text-lg font-semibold">
                {tokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${parseFloat(totalSupply || "0").toFixed(0)}`}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Supply Cap</p>
              <p className="text-lg font-semibold">
                {tokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${parseFloat(supplyCap || "0").toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Mint Tokens Action (only if verified) */}
          {isVerified && (
            <div className="p-4 rounded-lg border border-dashed">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Mint RWA Tokens</h4>
                  <p className="text-sm text-muted-foreground">
                    Mint 100 ynRWA tokens to your wallet (testnet only)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: Minting requires the MINTER role on the token contract.
                  </p>
                </div>
                <Button onClick={handleMintTokens} disabled={isMinting}>
                  {isMinting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Mint Tokens
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Contract Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">RWAToken Contract</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm">{CONTRACTS.mantleSepolia.rwaToken}</p>
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href={`https://sepolia.mantlescan.xyz/address/${CONTRACTS.mantleSepolia.rwaToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
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
                Mantle Sepolia (Chain ID: 5003)
              </p>
            </div>
            <Badge className={`ml-auto ${isVerified ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}>
              {isVerified ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  KYC Verified
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Pending KYC
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
