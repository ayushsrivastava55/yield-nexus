"use client";

import { useState, useCallback } from "react";

export type VerificationType = "standard" | "accredited" | "institutional";

export type VerificationStatus =
  | "idle"
  | "requesting"
  | "pending"
  | "scanning"
  | "generating"
  | "verifying"
  | "success"
  | "error";

export interface ZkPassportResult {
  verified: boolean;
  kycTier: number;
  kycTierName: string;
  uniqueIdentifier?: string;
  onChainRegistered?: boolean;
  txHash?: string | null;
  queryResults?: Record<string, unknown>;
  verifiedAt?: string;
}

export interface UseZkPassportReturn {
  status: VerificationStatus;
  verificationUrl: string | null;
  result: ZkPassportResult | null;
  error: string | null;
  startVerification: (walletAddress: string, type?: VerificationType) => Promise<void>;
  checkStatus: (walletAddress: string) => Promise<ZkPassportResult | null>;
  confirmVerification: (
    walletAddress: string,
    verified: boolean,
    uniqueIdentifier: string,
    queryResults: Record<string, unknown>,
    type?: VerificationType
  ) => Promise<void>;
  reset: () => void;
}

export function useZkPassport(): UseZkPassportReturn {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ZkPassportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setVerificationUrl(null);
    setResult(null);
    setError(null);
  }, []);

  const startVerification = useCallback(
    async (walletAddress: string, type: VerificationType = "standard") => {
      try {
        setStatus("requesting");
        setError(null);

        const response = await fetch("/api/zkpassport/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress, verificationType: type }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to create verification request");
        }

        setVerificationUrl(data.data.verificationUrl);
        setStatus("pending");
      } catch (err) {
        console.error("Start verification error:", err);
        setError(err instanceof Error ? err.message : "Failed to start verification");
        setStatus("error");
      }
    },
    []
  );

  const checkStatus = useCallback(async (walletAddress: string): Promise<ZkPassportResult | null> => {
    try {
      const response = await fetch(`/api/zkpassport/verify?walletAddress=${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data.verified) {
        const verificationResult: ZkPassportResult = {
          verified: data.data.verified,
          kycTier: data.data.kycTier,
          kycTierName: data.data.kycTierName,
        };
        setResult(verificationResult);
        setStatus("success");
        return verificationResult;
      }

      return null;
    } catch (err) {
      console.error("Check status error:", err);
      return null;
    }
  }, []);

  const confirmVerification = useCallback(
    async (
      walletAddress: string,
      verified: boolean,
      uniqueIdentifier: string,
      queryResults: Record<string, unknown>,
      type: VerificationType = "standard"
    ) => {
      try {
        setStatus("verifying");

        const response = await fetch("/api/zkpassport/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            verified,
            uniqueIdentifier,
            queryResults,
            verificationType: type,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Verification failed");
        }

        setResult(data.data);
        setStatus("success");
      } catch (err) {
        console.error("Confirm verification error:", err);
        setError(err instanceof Error ? err.message : "Verification failed");
        setStatus("error");
      }
    },
    []
  );

  return {
    status,
    verificationUrl,
    result,
    error,
    startVerification,
    checkStatus,
    confirmVerification,
    reset,
  };
}
