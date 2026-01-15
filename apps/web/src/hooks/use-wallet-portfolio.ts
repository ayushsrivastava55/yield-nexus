/**
 * Real wallet portfolio analysis hook
 * Fetches actual token balances and positions from user's wallet
 */

import { useEffect, useState } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { Address, erc20Abi } from "viem";
import { CONTRACTS } from "@/lib/contracts/config";

export interface TokenBalance {
  symbol: string;
  balance: bigint;
  decimals: number;
  valueUSD?: number;
}

export interface WalletPortfolio {
  totalValueUSD: number;
  tokens: TokenBalance[];
  rwaBalance: string;
  nativeBalance: string;
  isLoading: boolean;
  error?: string;
}

const COMMON_TOKENS: { address: Address; symbol: string }[] = [
  { address: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" as Address, symbol: "WMNT" }, // Wrapped Mantle
  { address: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE" as Address, symbol: "USDT" },
  { address: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9" as Address, symbol: "USDC" },
  { address: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111" as Address, symbol: "WETH" },
];

export function useWalletPortfolio(): WalletPortfolio {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState<WalletPortfolio>({
    totalValueUSD: 0,
    tokens: [],
    rwaBalance: "0",
    nativeBalance: "0",
    isLoading: true,
  });

  // Get native MNT balance
  const { data: nativeBalance } = useBalance({
    address: address,
  });

  // Get RWA token balance
  const { data: rwaBalance } = useBalance({
    address: address,
    token: CONTRACTS.mantleSepolia.rwaToken as Address,
  });

  // Get common token balances
  const { data: tokenBalances, isLoading } = useReadContracts({
    contracts: COMMON_TOKENS.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as Address],
    })),
    query: {
      enabled: !!address && isConnected,
    },
  });

  useEffect(() => {
    if (!isConnected || !address) {
      setPortfolio({
        totalValueUSD: 0,
        tokens: [],
        rwaBalance: "0",
        nativeBalance: "0",
        isLoading: false,
      });
      return;
    }

    const tokens: TokenBalance[] = [];
    let totalValue = 0;

    // Add RWA token
    if (rwaBalance) {
      tokens.push({
        symbol: "RWA",
        balance: rwaBalance.value,
        decimals: rwaBalance.decimals,
        valueUSD: 0, // TODO: Get price from oracle
      });
    }

    // Add native token
    if (nativeBalance) {
      tokens.push({
        symbol: "MNT",
        balance: nativeBalance.value,
        decimals: nativeBalance.decimals,
        valueUSD: 0, // TODO: Get MNT price
      });
    }

    // Add common tokens
    if (tokenBalances) {
      tokenBalances.forEach((result, idx) => {
        if (result.status === "success" && result.result) {
          const balance = result.result as bigint;
          if (balance > BigInt(0)) {
            tokens.push({
              symbol: COMMON_TOKENS[idx].symbol,
              balance,
              decimals: 18, // Most tokens use 18
              valueUSD: 0, // TODO: Get prices
            });
          }
        }
      });
    }

    setPortfolio({
      totalValueUSD: totalValue,
      tokens,
      rwaBalance: rwaBalance?.value?.toString() || "0",
      nativeBalance: nativeBalance?.value?.toString() || "0",
      isLoading: isLoading,
    });
  }, [address, isConnected, rwaBalance, nativeBalance, tokenBalances, isLoading]);

  return portfolio;
}

/**
 * Analyze portfolio and generate personalized recommendations
 */
export async function analyzePortfolioWithAI(
  portfolio: WalletPortfolio,
  riskTolerance: "conservative" | "moderate" | "aggressive"
): Promise<any> {
  const totalRWA = Number(portfolio.rwaBalance) / 1e18;

  if (totalRWA === 0) {
    return {
      error: "No RWA tokens found in wallet. Please mint RWA tokens first in the Compliance Hub.",
      suggestions: [
        "Complete KYC verification",
        "Mint RWA tokens based on your investment tier",
        "Return to get personalized yield strategies",
      ],
    };
  }

  // Call AI analysis with real portfolio data
  const response = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      riskTolerance,
      investmentAmount: totalRWA,
      walletAddress: portfolio.tokens[0] ? "connected" : undefined,
      currentHoldings: portfolio.tokens.map((t) => ({
        symbol: t.symbol,
        balance: Number(t.balance) / 1e18,
      })),
    }),
  });

  const data = await response.json();
  return data;
}
