import { NextResponse } from "next/server";
import {
  fetchAllProtocolYields,
  fetchDeFiLlamaYields,
  getRecommendedStrategies,
  getProtocolStats,
  type ProtocolYield,
} from "@/lib/api/protocols";

export const runtime = "edge";
export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const protocol = searchParams.get("protocol");
    const riskProfile = searchParams.get("risk") as "conservative" | "balanced" | "aggressive" | null;
    const category = searchParams.get("category");

    // Fetch ALL REAL yields from DeFiLlama API
    let yields = await fetchAllProtocolYields();

    // Filter by specific protocol if requested
    if (protocol) {
      const normalizedProtocol = protocol.toLowerCase().replace(/\s+/g, "-");
      yields = yields.filter(y => 
        y.protocol.toLowerCase().replace(/\s+/g, "-").includes(normalizedProtocol)
      );
    }

    // Filter by category if requested
    if (category) {
      yields = yields.filter(y => y.category === category);
    }

    // Get recommended strategies if risk profile specified
    let recommended: ProtocolYield[] = [];
    if (riskProfile) {
      recommended = getRecommendedStrategies(yields, riskProfile);
    }

    // Calculate aggregate stats from REAL data
    const stats = getProtocolStats(yields);

    return NextResponse.json({
      success: true,
      data: yields,
      recommended: recommended.length > 0 ? recommended : undefined,
      stats,
      meta: {
        timestamp: new Date().toISOString(),
        chain: "Mantle",
        chainId: 5000,
        dataSource: "DeFiLlama API (Real Data)",
        protocols: stats.protocols,
        protocolCount: stats.protocolCount,
      },
    });
  } catch (error) {
    console.error("Error fetching protocol yields:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch protocol yields from DeFiLlama",
        data: [],
        stats: {
          totalPools: 0,
          totalTVL: 0,
          avgAPY: 0,
          maxAPY: 0,
        },
        meta: {
          timestamp: new Date().toISOString(),
          chain: "Mantle",
          dataSource: "DeFiLlama API (Real Data)",
          error: true,
        },
      },
      { status: 500 }
    );
  }
}
