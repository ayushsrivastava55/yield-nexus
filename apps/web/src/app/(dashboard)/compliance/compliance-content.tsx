"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  Search,
  Filter,
  TrendingUp,
  MoreVertical,
  Scan,
  Fingerprint,
  Globe,
  Lock,
  QrCode,
} from "lucide-react";
import { useKYCStatus, useRWAToken, useRWABalance } from "@/lib/contracts/hooks";
import { useMintRWAToken } from "@/lib/contracts/write-hooks";
import { useZkPassport, VerificationType } from "@/hooks/use-zkpassport";
import { useZkMe, ZkMeVerificationStatus, ZkMeVerificationResult } from "@/hooks/use-zkme";
import { useCustomKYC, CustomKYCTier } from "@/hooks/use-custom-kyc";

type VerificationProvider = "zkpassport" | "zkme" | "custom";

const verificationProviders = [
  {
    id: "custom" as VerificationProvider,
    name: "Custom KYC",
    description: "Simple form-based verification",
    icon: "how_to_reg",
    features: ["No passport required", "Instant verification", "Full control"],
  },
  {
    id: "zkpassport" as VerificationProvider,
    name: "zkPassport",
    description: "Passport NFC scan with ZK proofs",
    icon: "badge",
    features: ["Passport NFC chip", "Zero-knowledge proofs", "Full identity verification"],
  },
  {
    id: "zkme" as VerificationProvider,
    name: "zkMe",
    description: "Facial recognition verification",
    icon: "face",
    features: ["Facial recognition", "Official Mantle partner", "Reusable SBT credential"],
  },
];

const registries = [
  {
    name: "Mantle Treasury v1",
    standard: "ERC-3643 Standard",
    asset: "USDY",
    assetName: "USDY Treasury",
    status: "active",
    lastAudit: "Oct 24, 2023",
    icon: "shield",
    iconColor: "text-mantle-teal",
    iconBg: "bg-mantle-teal/10",
  },
  {
    name: "Global RWA Registry",
    standard: "KYC Attestation Layer",
    asset: "mRWA",
    assetName: "Mixed Real Assets",
    status: "pending",
    lastAudit: "- - -",
    icon: "policy",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
  },
  {
    name: "Euro-Yield Master",
    standard: "Institutional On-chain",
    asset: "EURy",
    assetName: "Euro RWA",
    status: "paused",
    lastAudit: "Aug 12, 2023",
    icon: "pause_circle",
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
  },
];

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  paused: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

const verificationTiers = [
  {
    id: "standard" as VerificationType,
    name: "Standard",
    description: "Basic age verification (18+)",
    features: ["Age verification", "Sybil resistance", "Basic RWA access"],
    tier: 1,
  },
  {
    id: "accredited" as VerificationType,
    name: "Accredited",
    description: "Age + approved jurisdictions",
    features: ["Age verification", "Nationality check", "Premium strategies", "Higher limits"],
    tier: 2,
  },
  {
    id: "institutional" as VerificationType,
    name: "Institutional",
    description: "Full identity disclosure",
    features: ["Full name disclosure", "Nationality verification", "All strategies", "Unlimited access"],
    tier: 3,
  },
];

export default function ComplianceContent() {
  const { isConnected, address } = useAccount();
  const [selectedTier, setSelectedTier] = useState<VerificationType>("standard");
  const [selectedProvider, setSelectedProvider] = useState<VerificationProvider>("custom");
  const [customKYCFormData, setCustomKYCFormData] = useState({
    fullName: "",
    email: "",
    country: "",
    tier: "standard" as CustomKYCTier,
    documentType: "",
    agreeToTerms: false,
  });

  const { isVerified, kycTierName, isLoading: kycOnchainLoading } = useKYCStatus(
    address as `0x${string}` | undefined
  );
  const { name: tokenName, symbol, totalSupply, isLoading: tokenLoading } = useRWAToken();
  const { balance, isLoading: balanceLoading } = useRWABalance(address as `0x${string}` | undefined);
  const { mint, isPending: isMinting, isSuccess: mintSuccess, hash: mintHash } = useMintRWAToken();

  const {
    status: zkPassportStatus,
    verificationUrl,
    result: zkPassportResult,
    error: zkPassportError,
    startVerification: startZkPassportVerification,
    checkStatus,
    reset: resetZkPassport,
  } = useZkPassport();

  const {
    status: zkMeStatus,
    result: zkMeResult,
    error: zkMeError,
    startVerification: startZkMeVerification,
    reset: resetZkMe,
  } = useZkMe();

  const {
    status: customKYCStatus,
    result: customKYCResult,
    error: customKYCError,
    submitKYC: submitCustomKYC,
    reset: resetCustomKYC,
  } = useCustomKYC();

  // Check existing verification status on mount
  useEffect(() => {
    if (address && !isVerified) {
      checkStatus(address);
    }
  }, [address, isVerified, checkStatus]);

  // Refresh page after successful KYC to update wagmi hooks
  useEffect(() => {
    if (customKYCStatus === "success" && customKYCResult?.onChainRegistered) {
      // Wait a bit for the blockchain to sync, then refresh
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [customKYCStatus, customKYCResult]);

  const handleStartVerification = async () => {
    if (!address) return;

    if (selectedProvider === "custom") {
      await submitCustomKYC(address, customKYCFormData);
    } else if (selectedProvider === "zkpassport") {
      await startZkPassportVerification(address, selectedTier);
    } else {
      startZkMeVerification();
    }
  };

  const handleReset = () => {
    if (selectedProvider === "custom") {
      resetCustomKYC();
    } else if (selectedProvider === "zkpassport") {
      resetZkPassport();
    } else {
      resetZkMe();
    }
  };

  // Determine current status based on selected provider
  const currentStatus = selectedProvider === "custom"
    ? customKYCStatus
    : selectedProvider === "zkpassport"
    ? zkPassportStatus
    : zkMeStatus;

  const currentError = selectedProvider === "custom"
    ? customKYCError
    : selectedProvider === "zkpassport"
    ? zkPassportError
    : zkMeError;

  const currentResult = selectedProvider === "custom"
    ? customKYCResult
    : selectedProvider === "zkpassport"
    ? zkPassportResult
    : zkMeResult;

  const handleMintTokens = () => {
    if (address) {
      mint(address as `0x${string}`, "100");
    }
  };

  const kycSteps = [
    {
      name: selectedProvider === "zkme" ? "Identity Verification" : "Passport Scan",
      description: selectedProvider === "zkme" ? "Facial recognition" : "NFC chip reading",
      status: isVerified || currentResult?.verified ? "completed" : currentStatus === "pending" || currentStatus === "verifying" ? "in_progress" : "pending",
      icon: selectedProvider === "zkme" ? "face" : "nfc",
    },
    {
      name: "ZK Proof Generation",
      description: "Privacy-preserving",
      status: isVerified || currentResult?.verified ? "completed" : currentStatus === "verifying" ? "in_progress" : "pending",
      icon: "fingerprint",
    },
    {
      name: "On-chain Attestation",
      description: "ERC-3643 registry",
      status: isVerified || currentResult?.verified ? "completed" : currentStatus === "verifying" ? "in_progress" : "pending",
      icon: "verified",
    },
    {
      name: "Whitelist Inclusion",
      description: "RWA access granted",
      status: isVerified || currentResult?.verified ? "completed" : "locked",
      icon: "lock_open",
    },
  ];

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
              Connect your wallet to verify your identity with zkPassport for ERC-3643 compliant RWA access.
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
          <h2 className="text-foreground text-xl font-bold">ZK Identity Verification</h2>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2 bg-mantle-teal/10 px-2 py-1 rounded">
            <div className="size-2 rounded-full bg-mantle-teal animate-pulse"></div>
            <span className="text-[10px] font-bold text-mantle-teal uppercase">zkPassport</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Zero-Knowledge Proofs</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-foreground text-4xl font-black leading-tight tracking-tight">
            Privacy-Preserving KYC
          </h1>
          <p className="text-muted-foreground mt-1">
            Verify your identity using zero-knowledge proofs. Your data never leaves your device.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="flex flex-wrap gap-4 mb-10">
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
            <p className="text-muted-foreground text-sm font-medium">Total Whitelisted Investors</p>
            <div className="flex items-end justify-between">
              <p className="text-foreground text-3xl font-bold">1,284</p>
              <span className="text-emerald-500 text-sm font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                <TrendingUp className="h-3 w-3" />12%
              </span>
            </div>
          </div>
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
            <p className="text-muted-foreground text-sm font-medium">Countries Supported</p>
            <div className="flex items-end justify-between">
              <p className="text-foreground text-3xl font-bold">120+</p>
              <span className="text-mantle-teal text-sm font-medium bg-mantle-teal/10 px-2 py-0.5 rounded flex items-center gap-1">
                <Globe className="h-3 w-3" />Global
              </span>
            </div>
          </div>
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
            <p className="text-muted-foreground text-sm font-medium">Your Verification Status</p>
            <div className="flex items-end justify-between">
              <p className="text-foreground text-3xl font-bold">
                {kycOnchainLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : isVerified ? kycTierName : "Unverified"}
              </p>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                isVerified ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
              }`}>
                {isVerified ? "Active" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* KYC Progress Stepper */}
        <div className="bg-card/30 rounded-xl border border-border p-6 mb-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-foreground text-xl font-bold tracking-tight">Verification Pipeline</h2>
            <span className="text-xs font-semibold text-mantle-teal px-3 py-1 bg-mantle-teal/10 rounded-full border border-mantle-teal/20 uppercase flex items-center gap-1">
              <Fingerprint className="h-3 w-3" />
              Zero-Knowledge
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {kycSteps.map((step, index) => (
              <div key={index} className={`flex flex-col items-center text-center relative z-10 ${step.status === 'pending' || step.status === 'locked' ? 'opacity-50' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 shadow-lg ${
                  step.status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/20' :
                  step.status === 'in_progress' ? 'gradient-mantle shadow-primary/20 ring-4 ring-primary/20' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <p className="text-foreground text-sm font-bold">{step.name}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">{step.description}</p>
                <p className={`text-xs font-medium mt-1 ${
                  step.status === 'completed' ? 'text-emerald-500' :
                  step.status === 'in_progress' ? 'text-mantle-teal' :
                  'text-muted-foreground'
                }`}>
                  {step.status === 'completed' ? 'Complete' :
                   step.status === 'in_progress' ? 'In Progress' :
                   step.status === 'pending' ? 'Pending' : 'Locked'}
                </p>
              </div>
            ))}
            {/* Progress Line */}
            <div className="absolute top-6 left-0 w-full h-0.5 bg-border -z-0 hidden md:block">
              <div className={`h-full bg-emerald-500 transition-all duration-500 ${
                isVerified || currentResult?.verified ? 'w-full' :
                currentStatus === 'verifying' ? 'w-3/4' :
                currentStatus === 'loading' ? 'w-1/2' :
                currentStatus === 'pending' ? 'w-1/4' : 'w-0'
              }`}></div>
            </div>
          </div>
        </div>

        {/* ZK Verification Section */}
        {!isVerified && !currentResult?.verified && (
          <div className="bg-card rounded-xl border border-border p-6 mb-10">
            {/* Provider Selection */}
            <div className="mb-8">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Choose Verification Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verificationProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedProvider === provider.id
                        ? "border-mantle-teal bg-mantle-teal/5"
                        : "border-border hover:border-mantle-teal/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${selectedProvider === provider.id ? "gradient-mantle" : "bg-muted"}`}>
                        <span className="material-symbols-outlined text-white">{provider.icon}</span>
                      </div>
                      <div>
                        <span className="text-foreground font-bold">{provider.name}</span>
                        <p className="text-muted-foreground text-xs">{provider.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {provider.features.map((feature, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-mantle-teal" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom KYC Form */}
            {selectedProvider === "custom" && (
              <div className="mb-6 p-6 bg-muted/30 border border-border rounded-lg">
                <h3 className="text-foreground text-lg font-bold mb-4">Complete Your Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground uppercase">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full legal name"
                      value={customKYCFormData.fullName}
                      onChange={(e) => setCustomKYCFormData({ ...customKYCFormData, fullName: e.target.value })}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={customKYCFormData.email}
                      onChange={(e) => setCustomKYCFormData({ ...customKYCFormData, email: e.target.value })}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-xs font-semibold text-muted-foreground uppercase">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="e.g., United States"
                      value={customKYCFormData.country}
                      onChange={(e) => setCustomKYCFormData({ ...customKYCFormData, country: e.target.value })}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier" className="text-xs font-semibold text-muted-foreground uppercase">
                      KYC Tier <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="tier"
                      value={customKYCFormData.tier}
                      onChange={(e) => setCustomKYCFormData({ ...customKYCFormData, tier: e.target.value as CustomKYCTier })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mantle-teal"
                    >
                      <option value="standard">Standard (Tier 1)</option>
                      <option value="accredited">Accredited (Tier 2)</option>
                      <option value="institutional">Institutional (Tier 3)</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="documentType" className="text-xs font-semibold text-muted-foreground uppercase">
                      Document Type <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="documentType"
                      type="text"
                      placeholder="e.g., Passport, National ID, Driver's License"
                      value={customKYCFormData.documentType}
                      onChange={(e) => setCustomKYCFormData({ ...customKYCFormData, documentType: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={customKYCFormData.agreeToTerms}
                    onChange={(e) => setCustomKYCFormData({ ...customKYCFormData, agreeToTerms: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border text-mantle-teal focus:ring-mantle-teal"
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to the terms and conditions, and certify that the information provided is accurate and complete.
                    <span className="text-destructive">*</span>
                  </Label>
                </div>

                {customKYCError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {customKYCError}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${selectedProvider === "custom" ? "gradient-mantle" : selectedProvider === "zkme" ? "bg-blue-600" : "gradient-mantle"}`}>
                <Scan className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-foreground text-lg font-bold">
                  {selectedProvider === "custom"
                    ? "Custom KYC Verification"
                    : selectedProvider === "zkme"
                    ? "zkMe Verification"
                    : "zkPassport Verification"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {selectedProvider === "custom"
                    ? "Complete the form below to verify your identity"
                    : selectedProvider === "zkme"
                    ? "Complete facial recognition verification to generate your identity credential"
                    : "Scan your passport NFC chip to generate privacy-preserving proofs"}
                </p>
              </div>
            </div>

            {currentError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {currentError}
              </div>
            )}

            {/* Tier Selection - only for zkPassport */}
            {selectedProvider === "zkpassport" && (
              <div className="mb-6">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Select Verification Tier
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {verificationTiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedTier === tier.id
                          ? "border-mantle-teal bg-mantle-teal/5"
                          : "border-border hover:border-mantle-teal/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground font-bold">{tier.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          selectedTier === tier.id
                            ? "bg-mantle-teal text-white"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          TIER {tier.tier}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mb-3">{tier.description}</p>
                      <ul className="space-y-1">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-mantle-teal" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Actions */}
            {currentStatus === "idle" || currentStatus === "error" ? (
              <Button
                onClick={handleStartVerification}
                variant="gradient"
                className="w-full font-bold py-6"
                disabled={selectedProvider === "custom" && (!customKYCFormData.fullName || !customKYCFormData.email || !customKYCFormData.country || !customKYCFormData.agreeToTerms)}
              >
                {selectedProvider === "custom" ? (
                  <>
                    <Scan className="mr-2 h-5 w-5" />
                    Submit KYC Verification
                  </>
                ) : selectedProvider === "zkme" ? (
                  <>
                    <Scan className="mr-2 h-5 w-5" />
                    Start zkMe Verification
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-5 w-5" />
                    Start zkPassport Verification
                  </>
                )}
              </Button>
            ) : currentStatus === "loading" || currentStatus === "submitting" ? (
              <Button disabled className="w-full py-6">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {selectedProvider === "custom" ? "Submitting..." : "Initializing..."}
              </Button>
            ) : currentStatus === "verifying" && selectedProvider === "zkpassport" && verificationUrl ? (
              <div className="space-y-4">
                <div className="p-6 bg-muted/50 rounded-xl border border-border text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-mantle-teal" />
                  <p className="text-foreground font-bold mb-2">Scan with zkPassport App</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Open the zkPassport app on your phone and scan your passport NFC chip
                  </p>
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-mantle-teal hover:underline text-sm font-medium"
                  >
                    Open in zkPassport App
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for verification...
                </div>
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Cancel Verification
                </Button>
              </div>
            ) : currentStatus === "verifying" && selectedProvider === "custom" ? (
              <div className="space-y-4">
                <div className="p-6 bg-muted/50 rounded-xl border border-border text-center">
                  <Scan className="h-12 w-12 mx-auto mb-4 text-mantle-teal animate-pulse" />
                  <p className="text-foreground font-bold mb-2">Processing Your Verification</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Submitting your KYC information and registering on-chain...
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing verification...
                </div>
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Cancel Verification
                </Button>
              </div>
            ) : currentStatus === "verifying" && selectedProvider === "zkme" ? (
              <div className="space-y-4">
                <div className="p-6 bg-muted/50 rounded-xl border border-border text-center">
                  <Scan className="h-12 w-12 mx-auto mb-4 text-mantle-teal animate-pulse" />
                  <p className="text-foreground font-bold mb-2">zkMe Verification in Progress</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Complete the facial recognition verification in the popup window
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing verification...
                </div>
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Cancel Verification
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing verification...</span>
              </div>
            )}

            {/* How it Works */}
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="text-sm font-bold text-foreground mb-4">
                How {selectedProvider === "custom" ? "Custom KYC" : selectedProvider === "zkme" ? "zkMe" : "zkPassport"} Works
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                {selectedProvider === "custom" ? (
                  <>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">1</span>
                      </div>
                      <p className="text-sm font-medium">Complete Form</p>
                      <p className="text-xs text-muted-foreground">Fill in your details</p>
                    </div>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">2</span>
                      </div>
                      <p className="text-sm font-medium">On-chain Registration</p>
                      <p className="text-xs text-muted-foreground">Identity registry update</p>
                    </div>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">3</span>
                      </div>
                      <p className="text-sm font-medium">Access Granted</p>
                      <p className="text-xs text-muted-foreground">RWA strategies unlocked</p>
                    </div>
                  </>
                ) : selectedProvider === "zkme" ? (
                  <>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">1</span>
                      </div>
                      <p className="text-sm font-medium">Identity Verification</p>
                      <p className="text-xs text-muted-foreground">Facial recognition via app</p>
                    </div>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">2</span>
                      </div>
                      <p className="text-sm font-medium">Generate ZK Proof</p>
                      <p className="text-xs text-muted-foreground">Privacy-preserving credential</p>
                    </div>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">3</span>
                      </div>
                      <p className="text-sm font-medium">Receive SBT</p>
                      <p className="text-xs text-muted-foreground">Reusable Soulbound Token</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">1</span>
                      </div>
                      <p className="text-sm font-medium">Scan Passport</p>
                      <p className="text-xs text-muted-foreground">NFC chip reading via app</p>
                    </div>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">2</span>
                      </div>
                      <p className="text-sm font-medium">Generate ZK Proof</p>
                      <p className="text-xs text-muted-foreground">Proves claims without revealing data</p>
                    </div>
                    <div className="p-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-muted-foreground">3</span>
                      </div>
                      <p className="text-sm font-medium">On-chain Attestation</p>
                      <p className="text-xs text-muted-foreground">Registered in ERC-3643 registry</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Success */}
        {(isVerified || currentResult?.verified) && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground text-lg font-bold">Identity Verified</h3>
                <p className="text-muted-foreground text-sm">
                  {customKYCStatus === "success" && selectedProvider === "custom"
                    ? "KYC completed successfully! Refreshing to update your access..."
                    : "Your identity has been verified and registered on-chain"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-emerald-500 font-bold text-lg">
                  {kycTierName || (selectedProvider === "zkpassport" && (currentResult as any)?.kycTierName) || "Verified"}
                </p>
                <p className="text-muted-foreground text-xs">Verification Status</p>
              </div>
            </div>
            {selectedProvider === "zkpassport" && (currentResult as any)?.txHash && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20">
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${(currentResult as any)?.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-mantle-teal hover:underline flex items-center gap-1"
                >
                  View on-chain attestation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Identity Registries Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-foreground text-lg font-bold">Active Identity Registries</h2>
            <div className="flex gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registry Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Associated Asset</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Audit</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registries.map((registry, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded ${registry.iconBg} flex items-center justify-center ${registry.iconColor}`}>
                          <span className="material-symbols-outlined text-lg">{registry.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground leading-tight">{registry.name}</p>
                          <p className="text-[11px] text-muted-foreground">{registry.standard}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {registry.asset}
                        </div>
                        <span className="text-sm font-medium">{registry.assetName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${statusColors[registry.status].bg} ${statusColors[registry.status].text} border ${statusColors[registry.status].border}`}>
                        <span className={`size-1.5 rounded-full ${statusColors[registry.status].text.replace('text-', 'bg-')}`}></span>
                        {registry.status === 'active' ? 'Active' : registry.status === 'pending' ? 'Pending Audit' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                      {registry.lastAudit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-muted/30 flex items-center justify-between border-t border-border">
            <p className="text-xs text-muted-foreground">Showing 3 of 12 registries</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-bold border border-border rounded hover:bg-muted transition-colors">Previous</button>
              <button className="px-3 py-1 text-xs font-bold border border-border rounded hover:bg-muted transition-colors">Next</button>
            </div>
          </div>
        </div>

        {/* Token Minting Section (for verified users) */}
        {(isVerified || currentResult?.verified) && (
          <div className="mt-10 bg-card border border-border rounded-xl p-6">
            <h3 className="text-foreground text-lg font-bold mb-4">RWA Token Management</h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Token Name</p>
                <p className="font-bold">{tokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : tokenName}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Symbol</p>
                <p className="font-bold">{tokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : symbol}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
                <p className="font-bold">{balanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : parseFloat(balance).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
                <p className="font-bold">{tokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : parseFloat(totalSupply).toFixed(2)}</p>
              </div>
            </div>
            {mintHash && (
              <div className="mb-4 p-3 bg-mantle-teal/10 border border-mantle-teal/20 rounded-lg flex items-center gap-3">
                {isMinting ? (
                  <Loader2 className="h-5 w-5 animate-spin text-mantle-teal" />
                ) : mintSuccess ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {isMinting ? "Minting tokens..." : mintSuccess ? "Tokens minted!" : "Transaction pending"}
                  </p>
                  <a
                    href={`https://sepolia.mantlescan.xyz/tx/${mintHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-mantle-teal hover:underline"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            )}
            <Button onClick={handleMintTokens} disabled={isMinting} variant="gradient">
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                "Mint 100 Test Tokens"
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
