import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantleSepoliaTestnet } from "viem/chains";
import { CONTRACTS, IDENTITY_REGISTRY_ABI } from "@/lib/contracts/config";

// Get contract addresses
const IDENTITY_REGISTRY_ADDRESS = CONTRACTS.mantleSepolia.identityRegistry;

// Create clients for on-chain interaction
const publicClient = createPublicClient({
  chain: mantleSepoliaTestnet,
  transport: http(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      verified,
      uniqueIdentifier,
      queryResults,
      verificationType = "standard"
    } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, error: "Verification failed" },
        { status: 400 }
      );
    }

    // Determine KYC tier based on verification type
    let kycTier: number;
    switch (verificationType) {
      case "institutional":
        kycTier = 3; // Institutional
        break;
      case "accredited":
        kycTier = 2; // Accredited
        break;
      case "standard":
      default:
        kycTier = 1; // Retail
        break;
    }

    // Register on-chain if registrar key is configured
    let onChainRegistered = false;
    let txHash: `0x${string}` | null = null;

    const registrarKey = process.env.KYC_REGISTRAR_PRIVATE_KEY;

    if (registrarKey && IDENTITY_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      try {
        const account = privateKeyToAccount(registrarKey as `0x${string}`);

        const walletClient = createWalletClient({
          account,
          chain: mantleSepoliaTestnet,
          transport: http(),
        });

        // Check if already registered
        const isVerified = await publicClient.readContract({
          address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
          abi: IDENTITY_REGISTRY_ABI,
          functionName: "isVerified",
          args: [walletAddress as `0x${string}`],
        });

        if (!isVerified) {
          // Register the identity on-chain
          txHash = await walletClient.writeContract({
            address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: "registerIdentity",
            args: [
              walletAddress as `0x${string}`,
              kycTier,
              "US", // Default country - could be extracted from queryResults
            ],
          });

          // Wait for transaction confirmation
          await publicClient.waitForTransactionReceipt({ hash: txHash });
          onChainRegistered = true;
        } else {
          onChainRegistered = true; // Already registered
        }
      } catch (onChainError) {
        console.error("On-chain registration failed:", onChainError);
        // Continue even if on-chain fails - verification is still valid
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        walletAddress,
        verified: true,
        kycTier,
        kycTierName: kycTier === 3 ? "Institutional" : kycTier === 2 ? "Accredited" : "Retail",
        uniqueIdentifier,
        onChainRegistered,
        txHash,
        queryResults,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("zkPassport verify error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process verification" },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Check on-chain status
    if (IDENTITY_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      try {
        const [isVerified, kycTier] = await Promise.all([
          publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: "isVerified",
            args: [walletAddress as `0x${string}`],
          }),
          publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: "getKYCTier",
            args: [walletAddress as `0x${string}`],
          }).catch(() => 0),
        ]);

        const tierNumber = Number(kycTier);

        return NextResponse.json({
          success: true,
          data: {
            walletAddress,
            verified: isVerified as boolean,
            kycTier: tierNumber,
            kycTierName: tierNumber === 3 ? "Institutional" : tierNumber === 2 ? "Accredited" : tierNumber === 1 ? "Retail" : "None",
            source: "on-chain",
          },
        });
      } catch (contractError) {
        console.error("Contract read error:", contractError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        walletAddress,
        verified: false,
        kycTier: 0,
        kycTierName: "None",
        source: "none",
      },
    });
  } catch (error) {
    console.error("zkPassport status check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}
