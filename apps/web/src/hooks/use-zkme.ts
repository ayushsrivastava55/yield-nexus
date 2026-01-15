
"use client";

import { useCallback, useState } from "react";

// zkMe widget types
export type ZkMeVerificationStatus =
  | "idle"
  | "loading"
  | "verifying"
  | "success"
  | "error";

export interface ZkMeVerificationResult {
  verified: boolean;
  meid?: string;
  verificationLevel?: string;
  nullifier?: string;
  kycTier?: number;
  kycTierName?: string;
}

export interface UseZkMeReturn {
  status: ZkMeVerificationStatus;
  result: ZkMeVerificationResult | null;
  error: string | null;
  startVerification: () => void;
  reset: () => void;
}

export function useZkMe(): UseZkMeReturn {
  const [status, setStatus] = useState<ZkMeVerificationStatus>("idle");
  const [result, setResult] = useState<ZkMeVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const startVerification = useCallback(() => {
    try {
      setStatus("loading");
      setError(null);

      // Get configuration from env
      const apiKey = process.env.NEXT_PUBLIC_ZKME_API_KEY;
      const appId = process.env.NEXT_PUBLIC_ZKME_APP_ID;

      if (!apiKey || !appId) {
        // For demo/hackathon: show message about zkMe setup
        setError(
          "zkMe API credentials not configured. " +
          "To enable zkMe verification, add NEXT_PUBLIC_ZKME_API_KEY and NEXT_PUBLIC_ZKME_APP_ID to your .env file. " +
          "Get credentials from https://dashboard.zk.me"
        );
        setStatus("error");
        return;
      }

      // Import zkMe widget dynamically when credentials are available
      import("@zkmelabs/widget").then(() => {
        setStatus("verifying");

        // Note: The actual zkMe widget integration requires proper API setup
        // This is a placeholder for when credentials are configured
        console.log("zkMe widget initialization with appId:", appId);

        // For demo: Simulate verification after 2 seconds
        setTimeout(() => {
          setResult({
            verified: true,
            meid: "demo_meid_" + Math.random().toString(36).substring(2, 11),
          });
          setStatus("success");
        }, 2000);
      });
    } catch (err) {
      console.error("zkMe initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize zkMe");
      setStatus("error");
    }
  }, []);

  return {
    status,
    result,
    error,
    startVerification,
    reset,
  };
}
