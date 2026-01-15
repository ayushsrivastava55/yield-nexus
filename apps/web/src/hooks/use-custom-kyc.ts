"use client";

import { useCallback, useState } from "react";

export type CustomKYCStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

export type CustomKYCTier = "standard" | "accredited" | "institutional";

export interface CustomKYCData {
  fullName: string;
  email: string;
  country: string;
  tier: CustomKYCTier;
  documentType: string;
  agreeToTerms: boolean;
}

export interface CustomKYCResult {
  verified: boolean;
  kycTier: number;
  kycTierName: string;
  fullName: string;
  email: string;
  country: string;
  documentType: string;
  onChainRegistered?: boolean;
  txHash?: string;
  verifiedAt: string;
}

export interface UseCustomKYCReturn {
  status: CustomKYCStatus;
  result: CustomKYCResult | null;
  error: string | null;
  submitKYC: (walletAddress: string, kycData: CustomKYCData) => Promise<void>;
  reset: () => void;
}

export function useCustomKYC(): UseCustomKYCReturn {
  const [status, setStatus] = useState<CustomKYCStatus>("idle");
  const [result, setResult] = useState<CustomKYCResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitKYC = useCallback(async (walletAddress: string, kycData: CustomKYCData) => {
    try {
      setStatus("submitting");
      setError(null);

      const response = await fetch("/api/kyc/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          kycData,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit KYC");
      }

      setResult(data.data);
      setStatus("success");
    } catch (err) {
      console.error("Custom KYC submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit KYC");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    submitKYC,
    reset,
  };
}
