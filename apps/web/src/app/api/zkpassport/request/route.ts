import { NextResponse } from "next/server";
import { ZKPassport } from "@zkpassport/sdk";

// EU countries list for nationality verification
const EU_COUNTRIES: string[] = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
  "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
  "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"
];

// Accredited investor countries (major financial jurisdictions)
const ACCREDITED_COUNTRIES: string[] = [
  ...EU_COUNTRIES,
  "United States", "United Kingdom", "Switzerland", "Singapore",
  "Hong Kong", "Japan", "Australia", "Canada", "New Zealand", "United Arab Emirates"
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, verificationType = "standard" } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Initialize zkPassport with your domain
    const domain = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";
    const zkPassport = new ZKPassport(domain);

    // Create verification request
    const queryBuilder = await zkPassport.request({
      name: "Yield Nexus",
      logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://yield-nexus.vercel.app"}/logo.png`,
      purpose: "Verify your identity for ERC-3643 compliant RWA access",
    });

    let query;

    // Different verification levels based on type
    switch (verificationType) {
      case "institutional":
        // Institutional: Full verification with nationality check
        query = queryBuilder
          .disclose("firstname")
          .disclose("lastname")
          .disclose("nationality")
          .gte("age", 18)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .in("nationality", ACCREDITED_COUNTRIES as any)
          .done();
        break;

      case "accredited":
        // Accredited investor: Age 18+ and from approved countries
        query = queryBuilder
          .disclose("nationality")
          .gte("age", 18)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .in("nationality", ACCREDITED_COUNTRIES as any)
          .done();
        break;

      case "standard":
      default:
        // Standard: Just age verification (18+)
        query = queryBuilder
          .gte("age", 18)
          .done();
        break;
    }

    const { url } = query;

    return NextResponse.json({
      success: true,
      data: {
        verificationUrl: url,
        walletAddress,
        verificationType,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
      },
    });
  } catch (error) {
    console.error("zkPassport request error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create verification request" },
      { status: 500 }
    );
  }
}
