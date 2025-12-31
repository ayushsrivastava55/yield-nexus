"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import {
  CONTRACTS,
  IDENTITY_REGISTRY_ABI,
  RWA_TOKEN_ABI,
  YIELD_AGENT_ABI,
  COMPLIANCE_MODULE_ABI,
  getKYCTierName,
} from "./config";

const chainId = 5003; // Mantle Sepolia

// Hook to check if user is KYC verified
export function useKYCStatus(address: `0x${string}` | undefined) {
  const { data: isVerified, isLoading: isVerifiedLoading } = useReadContract({
    address: CONTRACTS.mantleSepolia.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "isVerified",
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!address,
    },
  });

  const { data: kycTier, isLoading: tierLoading } = useReadContract({
    address: CONTRACTS.mantleSepolia.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "getKYCTier",
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!address,
    },
  });

  return {
    isVerified: isVerified ?? false,
    kycTier: kycTier ?? 0,
    kycTierName: getKYCTierName(Number(kycTier ?? 0)),
    isLoading: isVerifiedLoading || tierLoading,
  };
}

// Hook to get RWA token info
export function useRWAToken() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.mantleSepolia.rwaToken,
        abi: RWA_TOKEN_ABI,
        functionName: "name",
        chainId,
      },
      {
        address: CONTRACTS.mantleSepolia.rwaToken,
        abi: RWA_TOKEN_ABI,
        functionName: "symbol",
        chainId,
      },
      {
        address: CONTRACTS.mantleSepolia.rwaToken,
        abi: RWA_TOKEN_ABI,
        functionName: "totalSupply",
        chainId,
      },
      {
        address: CONTRACTS.mantleSepolia.rwaToken,
        abi: RWA_TOKEN_ABI,
        functionName: "supplyCap",
        chainId,
      },
      {
        address: CONTRACTS.mantleSepolia.rwaToken,
        abi: RWA_TOKEN_ABI,
        functionName: "paused",
        chainId,
      },
    ],
  });

  return {
    name: data?.[0]?.result as string | undefined,
    symbol: data?.[1]?.result as string | undefined,
    totalSupply: data?.[2]?.result ? formatEther(data[2].result as bigint) : "0",
    supplyCap: data?.[3]?.result ? formatEther(data[3].result as bigint) : "0",
    paused: data?.[4]?.result as boolean | undefined,
    isLoading,
    error,
  };
}

// Hook to get user's RWA token balance
export function useRWABalance(address: `0x${string}` | undefined) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.mantleSepolia.rwaToken,
    abi: RWA_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data ? formatEther(data) : "0",
    balanceRaw: data ?? BigInt(0),
    isLoading,
  };
}

// Hook to get yield agent count
export function useYieldAgentStats() {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.mantleSepolia.yieldAgent,
    abi: YIELD_AGENT_ABI,
    functionName: "nextAgentId",
    chainId,
  });

  return {
    agentCount: data ? Number(data) : 0,
    isLoading,
  };
}

// Hook to get user's agents
export function useUserAgents(address: `0x${string}` | undefined) {
  const { data: nextAgentId, isLoading: countLoading } = useReadContract({
    address: CONTRACTS.mantleSepolia.yieldAgent,
    abi: YIELD_AGENT_ABI,
    functionName: "nextAgentId",
    chainId,
    query: { enabled: true },
  });

  const totalAgents = Number(nextAgentId ?? 0);
  const maxAgentsToScan = 25;
  const scanCount = Math.min(totalAgents, maxAgentsToScan);

  const contractCalls = address && scanCount > 0
    ? Array.from({ length: scanCount }, (_, i) => ({
        address: CONTRACTS.mantleSepolia.yieldAgent,
        abi: YIELD_AGENT_ABI,
        functionName: "agents",
        args: [BigInt(i)],
        chainId,
      }))
    : undefined;

  const { data: agentIds, isLoading: idsLoading } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: !!contractCalls,
    },
  });

  const ownedAgentIds = agentIds
    ?.map((result, index) => ({ result: result.result, index }))
    .filter((entry) => {
      const agent = entry.result as
        | [string, string, bigint, bigint, bigint, boolean]
        | undefined;
      if (!agent || !address) return false;
      return agent[0]?.toLowerCase() === address.toLowerCase();
    })
    .map((entry) => BigInt(entry.index));

  return {
    agentIds: ownedAgentIds,
    agentCount: ownedAgentIds?.length ?? 0,
    isLoading: countLoading || idsLoading,
  };
}

// Hook to check if country is restricted
export function useCountryRestriction(countryCode: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.mantleSepolia.complianceModule,
    abi: COMPLIANCE_MODULE_ABI,
    functionName: "restrictedCountries",
    args: [countryCode],
    chainId,
  });

  return {
    isRestricted: data ?? false,
    isLoading,
  };
}

// Combined hook for dashboard stats
export function useDashboardStats(address: `0x${string}` | undefined) {
  const kyc = useKYCStatus(address);
  const token = useRWAToken();
  const balance = useRWABalance(address);
  const agents = useUserAgents(address);
  const agentStats = useYieldAgentStats();

  return {
    kyc,
    token,
    balance,
    agents,
    agentStats,
    isLoading: kyc.isLoading || token.isLoading || balance.isLoading || agents.isLoading,
  };
}
