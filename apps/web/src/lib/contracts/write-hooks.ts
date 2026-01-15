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
    inputs: [
      { name: "_agentId", type: "uint256" },
      { name: "_protocol", type: "address" },
      { name: "_inputToken", type: "address" },
      { name: "_outputToken", type: "address" },
      { name: "_targetAllocation", type: "uint256" },
    ],
    name: "addStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_agentId", type: "uint256" },
      { name: "_protocol", type: "address" },
      { name: "_inputToken", type: "address" },
      { name: "_outputToken", type: "address" },
      { name: "_targetAllocation", type: "uint256" },
      { name: "_routerStrategyId", type: "bytes32" },
    ],
    name: "addStrategy",
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
  {
    inputs: [
      { name: "_agentId", type: "uint256" },
      { name: "_token", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_agentId", type: "uint256" },
      { name: "_token", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    name: "withdraw",
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
  const { writeContract, writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createAgent = async (name: string, minRebalanceInterval: number = 3600, maxSlippage: number = 100) => {
    reset(); // Clear any previous errors

    console.log("=== writeContract Debug ===");
    console.log("Contract address:", CONTRACTS.mantleSepolia.yieldAgent);
    console.log("Chain ID:", chainId);
    console.log("Args:", [name, minRebalanceInterval, maxSlippage]);

    try {
      // Use writeContractAsync for better error handling
      const txHash = await writeContractAsync({
        address: CONTRACTS.mantleSepolia.yieldAgent,
        abi: YIELD_AGENT_WRITE_ABI,
        functionName: "createAgent",
        args: [name, BigInt(minRebalanceInterval), BigInt(maxSlippage)] as const,
        chainId,
      });
      console.log("Transaction submitted! Hash:", txHash);
      return txHash;
    } catch (err: unknown) {
      console.error("=== writeContract Error ===");
      console.error("Error:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
      }
      // Re-throw so the UI can handle it
      throw err;
    }
  };

  return {
    createAgent,
    hash,
    isPending: isPending || isConfirming,
    isConfirming,
    isSuccess,
    error,
    reset,
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

// Hook to add strategy to agent
export function useAddStrategy() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addStrategy = (input: {
    agentId: bigint;
    protocol: `0x${string}`;
    inputToken: `0x${string}`;
    outputToken: `0x${string}`;
    targetAllocationBps: bigint;
    routerStrategyId?: `0x${string}`; // Optional: for real execution via StrategyRouter
  }) => {
    reset();
    if (input.routerStrategyId) {
      // Use the version with router strategy ID for real execution
      writeContract({
        address: CONTRACTS.mantleSepolia.yieldAgent,
        abi: YIELD_AGENT_WRITE_ABI,
        functionName: "addStrategy",
        args: [
          input.agentId,
          input.protocol,
          input.inputToken,
          input.outputToken,
          input.targetAllocationBps,
          input.routerStrategyId,
        ],
        chainId,
      });
    } else {
      writeContract({
        address: CONTRACTS.mantleSepolia.yieldAgent,
        abi: YIELD_AGENT_WRITE_ABI,
        functionName: "addStrategy",
        args: [
          input.agentId,
          input.protocol,
          input.inputToken,
          input.outputToken,
          input.targetAllocationBps,
        ],
        chainId,
      });
    }
  };

  return {
    addStrategy,
    hash,
    isPending: isPending || isConfirming,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook to deposit tokens into an agent
export function useAgentDeposit() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (agentId: bigint, token: `0x${string}`, amount: bigint) => {
    reset();
    writeContract({
      address: CONTRACTS.mantleSepolia.yieldAgent,
      abi: YIELD_AGENT_WRITE_ABI,
      functionName: "deposit",
      args: [agentId, token, amount],
      chainId,
    });
  };

  return {
    deposit,
    hash,
    isPending: isPending || isConfirming,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Hook to withdraw tokens from an agent
export function useAgentWithdraw() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = (agentId: bigint, token: `0x${string}`, amount: bigint) => {
    reset();
    writeContract({
      address: CONTRACTS.mantleSepolia.yieldAgent,
      abi: YIELD_AGENT_WRITE_ABI,
      functionName: "withdraw",
      args: [agentId, token, amount],
      chainId,
    });
  };

  return {
    withdraw,
    hash,
    isPending: isPending || isConfirming,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// Vault deposit/withdraw ABIs
const YIELD_VAULT_WRITE_ABI = [
  {
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const RWA_TOKEN_APPROVE_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Hook to approve RWA token spending
export function useApproveRWA() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (spender: `0x${string}`, amount: string) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.rwaToken,
      abi: RWA_TOKEN_APPROVE_ABI,
      functionName: "approve",
      args: [spender, parseEther(amount)],
      chainId,
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to deposit to Yield Vault
export function useDepositToVault() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (assets: string, receiver: `0x${string}`) => {
    writeContract({
      address: CONTRACTS.mantleSepolia.yieldVault,
      abi: YIELD_VAULT_WRITE_ABI,
      functionName: "deposit",
      args: [parseEther(assets), receiver],
      chainId,
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
