"use client";

import { useMemo, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useKYCStatus } from "@/lib/contracts/hooks";
import { useDemoMode } from "@/contexts/demo-mode-context";

export function useVerificationStatus() {
  const { address } = useAccount();
  const { isVerified: onChainVerified, kycTier, kycTierName, isLoading } = useKYCStatus(
    address as `0x${string}` | undefined
  );
  const { demoMode, demoVerified, demoKycTier, demoKycTierName } = useDemoMode();
  const [, forceUpdate] = useState(0);

  // Force re-render when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      forceUpdate(n => n + 1);
    };

    window.addEventListener("local-storage-updated", handleStorageChange);

    return () => {
      window.removeEventListener("local-storage-updated", handleStorageChange);
    };
  }, []);

  // Combine on-chain and demo verification status
  // Demo mode takes priority for accessibility
  const isVerified = useMemo(() => {
    return onChainVerified || demoVerified;
  }, [onChainVerified, demoVerified]);

  const tier = useMemo(() => {
    if (demoVerified) {
      return demoKycTier;
    }
    return kycTier;
  }, [demoVerified, demoKycTier, kycTier]);

  const tierName = useMemo(() => {
    if (demoVerified) {
      return demoKycTierName;
    }
    return kycTierName;
  }, [demoVerified, demoKycTierName, kycTierName]);

  return {
    isVerified,
    kycTier: tier,
    kycTierName: tierName,
    isLoading,
    isDemoMode: demoMode && demoVerified,
    onChainVerified,
  };
}
