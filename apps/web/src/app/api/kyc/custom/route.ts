import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantleSepoliaTestnet } from "viem/chains";
import { CONTRACTS, IDENTITY_REGISTRY_ABI } from "@/lib/contracts/config";

const publicClient = createPublicClient({
  chain: mantleSepoliaTestnet,
  transport: http(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, kycData } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!kycData) {
      return NextResponse.json(
        { success: false, error: "KYC data is required" },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      country,
      tier = "standard", // standard | accredited | institutional
      documentType,
      agreeToTerms
    } = kycData;

    // Validate required fields
    if (!fullName || !email || !country || !agreeToTerms) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine KYC tier number
    const tierMap: Record<string, number> = {
      standard: 1,
      accredited: 2,
      institutional: 3,
    };
    const kycTier = tierMap[tier] || 1;

    // Register on-chain if registrar key is configured
    let onChainRegistered = false;
    let txHash: `0x${string}` | null = null;

    const registrarKey = process.env.KYC_REGISTRAR_PRIVATE_KEY;

    if (registrarKey && CONTRACTS.mantleSepolia.identityRegistry !== "0x0000000000000000000000000000000000000") {
      try {
        // Add 0x prefix if missing
        const privateKey = registrarKey.startsWith("0x") ? registrarKey : `0x${registrarKey}`;
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        const walletClient = createWalletClient({
          account,
          chain: mantleSepoliaTestnet,
          transport: http(),
        });

        // Check if already registered
        const isVerified = await publicClient.readContract({
          address: CONTRACTS.mantleSepolia.identityRegistry as `0x${string}`,
          abi: IDENTITY_REGISTRY_ABI,
          functionName: "isVerified",
          args: [walletAddress as `0x${string}`],
        });

        if (!isVerified) {
          console.log(`Registering ${walletAddress} on-chain with tier ${kycTier}...`);

          // Register the identity on-chain
          txHash = await walletClient.writeContract({
            address: CONTRACTS.mantleSepolia.identityRegistry as `0x${string}`,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: "registerIdentity",
            args: [
              walletAddress as `0x${string}`,
              kycTier,
              country,
            ],
          });

          console.log(`Transaction submitted: ${txHash}, waiting for confirmation...`);

          // Wait for transaction confirmation
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });

          console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

          if (receipt.status !== "success") {
            throw new Error("Transaction failed on-chain");
          }

          onChainRegistered = true;
        } else {
          console.log(`${walletAddress} already verified on-chain`);
          onChainRegistered = true; // Already registered
        }
      } catch (onChainError) {
        console.error("On-chain registration failed:", onChainError);
        // Return error if on-chain registration fails
        return NextResponse.json(
          {
            success: false,
            error: `On-chain registration failed: ${onChainError instanceof Error ? onChainError.message : "Unknown error"}`,
          },
          { status: 500 }
        );
      }
    } else {
      console.warn("Skipping on-chain registration: registrar key not configured or contract address is zero");
    }

    return NextResponse.json({
      success: true,
      data: {
        walletAddress,
        verified: true,
        kycTier,
        kycTierName: tier === "institutional" ? "Institutional" : tier === "accredited" ? "Accredited" : "Retail",
        fullName,
        email,
        country,
        documentType,
        onChainRegistered,
        txHash,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Custom KYC verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process KYC verification" },
      { status: 500 }
    );
  }
}
