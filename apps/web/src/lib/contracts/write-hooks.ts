"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, encodeAbiParameters } from "viem";
import { CONTRACTS } from "./config";

const chainId = 5003; // Mantle Sepolia

// Extended ABIs for write functions
const IDENTITY_REGISTRY_WRITE_ABI = [
  {
    inputs: [
      { name: "_investor", type: "address" },
      { name: "_identity", type: "address" },
      { name: "_country", type: "uint16" },
      { name: "_tier", type: "uint8" },
    ],
    name: "registerIdentityWithTier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_investor", type: "address" },
      { name: "_tier", type: "uint8" },
    ],
    name: "updateKYCTier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const RWA_TOKEN_WRITE_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const YIELD_AGENT_WRITE_ABI = [
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_minRebalanceInterval", type: "uint256" },
      { name: "_maxSlippage", type: "uint256" },
    ],
    name: "createAgent",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_agentId", type: "uint256" }],
    name: "deactivateAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_agentId", type: "uint256" }],
    name: "manualRebalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "performData", type: "bytes" }],
    name: "performUpkeep",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Hook to register identity (KYC)
export function useRegisterIdentity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const register = (
    investor: `0x${string}`,
    identity: `0x${string}`,
    country: number,
    kycTier: number
  ) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.identityRegistry,
      abi: IDENTITY_REGISTRY_WRITE_ABI,
      functionName: "registerIdentityWithTier",
      args: [investor, identity, country, kycTier],
      chainId,
    });
  };

  return {
    register,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to update KYC tier
export function useUpdateKYCTier() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateTier = (investor: `0x${string}`, newTier: number) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.identityRegistry,
      abi: IDENTITY_REGISTRY_WRITE_ABI,
      functionName: "updateKYCTier",
      args: [investor, newTier],
      chainId,
    });
  };

  return {
    updateTier,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to mint RWA tokens
export function useMintRWAToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = (to: `0x${string}`, amount: string) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.rwaToken,
      abi: RWA_TOKEN_WRITE_ABI,
      functionName: "mint",
      args: [to, parseEther(amount)],
      chainId,
    });
  };

  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to create yield agent
export function useCreateAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createAgent = (name: string, minRebalanceInterval: number = 3600, maxSlippage: number = 100) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.yieldAgent,
      abi: YIELD_AGENT_WRITE_ABI,
      functionName: "createAgent",
      args: [name, BigInt(minRebalanceInterval), BigInt(maxSlippage)],
      chainId,
    });
  };

  return {
    createAgent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to pause/resume agent
export function useAgentControl() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deactivateAgent = (agentId: bigint) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.yieldAgent,
      abi: YIELD_AGENT_WRITE_ABI,
      functionName: "deactivateAgent",
      args: [agentId],
      chainId,
    });
  };

  const manualRebalance = (agentId: bigint) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.yieldAgent,
      abi: YIELD_AGENT_WRITE_ABI,
      functionName: "manualRebalance",
      args: [agentId],
      chainId,
    });
  };

  const triggerRebalance = (agentId: bigint) => {
    const performData = encodeAbiParameters([{ type: "uint256" }], [agentId]);
    writeContract({
      address: CONTRACTS.mantleSepolia.yieldAgent,
      abi: YIELD_AGENT_WRITE_ABI,
      functionName: "performUpkeep",
      args: [performData],
      chainId,
    });
  };

  return {
    deactivateAgent,
    manualRebalance,
    triggerRebalance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
