import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { CONTRACTS } from "@/lib/contracts/config";

const mantleSepolia = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { decimals: 18, name: "Mantle", symbol: "MNT" },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz",
      ],
    },
  },
};

const client = createPublicClient({
  chain: mantleSepolia,
  transport: http(mantleSepolia.rpcUrls.default.http[0]),
});

const CONTRACT_LIST = [
  { type: "YieldAgent", address: CONTRACTS.mantleSepolia.yieldAgent },
  { type: "StrategyRouter", address: CONTRACTS.mantleSepolia.strategyRouter },
  { type: "YieldVault", address: CONTRACTS.mantleSepolia.yieldVault },
  { type: "RWAToken", address: CONTRACTS.mantleSepolia.rwaToken },
  { type: "IdentityRegistry", address: CONTRACTS.mantleSepolia.identityRegistry },
  { type: "ComplianceModule", address: CONTRACTS.mantleSepolia.complianceModule },
];

export async function GET() {
  try {
    const results = await Promise.all(
      CONTRACT_LIST.map(async (c) => {
        const code = await client.getBytecode({ address: c.address });
        return {
          type: c.type,
          address: c.address,
          deployed: !!code && code !== "0x",
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        chain: "Mantle Sepolia",
        chainId: 5003,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Contract status error:", error);
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch contract status" },
      { status: 500 }
    );
  }
}
