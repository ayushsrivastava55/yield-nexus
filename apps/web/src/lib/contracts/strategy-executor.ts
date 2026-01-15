/**
 * Strategy Executor - Handles batch execution of yield strategies
 * Uses multicall for efficient one-click deployment
 */

import { Address, encodeFunctionData, parseUnits } from "viem";
import { writeContract, waitForTransactionReceipt, multicall } from "@wagmi/core";
import { config } from "@/lib/wagmi";
import { CONTRACTS } from "./config";

export interface ExecutionStep {
  type: "approve" | "deposit" | "stake" | "swap";
  protocol: string;
  token: Address;
  amount: bigint;
  target: Address;
  data?: `0x${string}`;
  description: string;
}

export interface ExecutionResult {
  success: boolean;
  hash?: `0x${string}`;
  error?: string;
  gasUsed?: bigint;
}

export interface StrategyExecution {
  steps: ExecutionStep[];
  totalSteps: number;
  currentStep: number;
  status: "pending" | "executing" | "completed" | "failed";
  results: ExecutionResult[];
}

/**
 * Build execution steps from strategy allocations
 */
export function buildExecutionSteps(
  allocations: Array<{
    protocol: string;
    pair: string;
    amount: number;
    contractAddress?: string;
    poolId?: string;
  }>,
  userAddress: Address
): ExecutionStep[] {
  const steps: ExecutionStep[] = [];

  for (const alloc of allocations) {
    const amountWei = parseUnits(alloc.amount.toString(), 18);

    // Step 1: Approve RWA token for the vault/protocol
    steps.push({
      type: "approve",
      protocol: alloc.protocol,
      token: CONTRACTS.mantleSepolia.rwaToken as Address,
      amount: amountWei,
      target: (alloc.contractAddress || CONTRACTS.mantleSepolia.yieldVault) as Address,
      description: `Approve ${alloc.amount.toLocaleString()} RWA tokens for ${alloc.protocol}`,
    });

    // Step 2: Deposit to vault/protocol
    steps.push({
      type: "deposit",
      protocol: alloc.protocol,
      token: CONTRACTS.mantleSepolia.rwaToken as Address,
      amount: amountWei,
      target: (alloc.contractAddress || CONTRACTS.mantleSepolia.yieldVault) as Address,
      description: `Deposit to ${alloc.protocol} ${alloc.pair} pool`,
    });
  }

  return steps;
}

/**
 * Execute a single step
 */
export async function executeStep(step: ExecutionStep): Promise<ExecutionResult> {
  try {
    let hash: `0x${string}`;

    if (step.type === "approve") {
      // ERC20 approve
      hash = await writeContract(config, {
        address: step.token,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "approve",
        args: [step.target, step.amount],
      });
    } else if (step.type === "deposit") {
      // Deposit to vault
      hash = await writeContract(config, {
        address: step.target,
        abi: [
          {
            name: "deposit",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [{ name: "amount", type: "uint256" }],
            outputs: [],
          },
        ],
        functionName: "deposit",
        args: [step.amount],
      });
    } else {
      throw new Error(`Unsupported step type: ${step.type}`);
    }

    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(config, { hash });

    return {
      success: receipt.status === "success",
      hash,
      gasUsed: receipt.gasUsed,
    };
  } catch (error: any) {
    console.error("Step execution failed:", error);
    return {
      success: false,
      error: error.message || "Transaction failed",
    };
  }
}

/**
 * Execute entire strategy with progress tracking
 */
export async function executeStrategy(
  steps: ExecutionStep[],
  onProgress?: (execution: StrategyExecution) => void
): Promise<StrategyExecution> {
  const execution: StrategyExecution = {
    steps,
    totalSteps: steps.length,
    currentStep: 0,
    status: "executing",
    results: [],
  };

  onProgress?.(execution);

  for (let i = 0; i < steps.length; i++) {
    execution.currentStep = i + 1;
    onProgress?.(execution);

    const result = await executeStep(steps[i]);
    execution.results.push(result);

    if (!result.success) {
      execution.status = "failed";
      onProgress?.(execution);
      return execution;
    }

    // Small delay between transactions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  execution.status = "completed";
  onProgress?.(execution);
  return execution;
}

/**
 * Estimate total gas cost for strategy execution
 */
export async function estimateStrategyGas(steps: ExecutionStep[]): Promise<bigint> {
  // Rough estimate: 100k gas per approve, 150k per deposit
  let totalGas = BigInt(0);

  for (const step of steps) {
    if (step.type === "approve") {
      totalGas += BigInt(100_000);
    } else if (step.type === "deposit") {
      totalGas += BigInt(150_000);
    }
  }

  return totalGas;
}

/**
 * Check if user has sufficient balance for strategy
 */
export async function validateStrategyBalance(
  totalAmount: number,
  userBalance: bigint
): Promise<{ valid: boolean; error?: string }> {
  const requiredAmount = parseUnits(totalAmount.toString(), 18);

  if (userBalance < requiredAmount) {
    return {
      valid: false,
      error: `Insufficient balance. Required: ${totalAmount} RWA, Available: ${Number(userBalance) / 1e18} RWA`,
    };
  }

  return { valid: true };
}
