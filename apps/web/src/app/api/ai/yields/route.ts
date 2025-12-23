import { NextResponse } from "next/server";
import { getYieldOpportunitiesAsync, getTopYieldsAsync, getRealYields } from "@/lib/ai/yield-data";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const minApy = searchParams.get("minApy");
    const maxRisk = searchParams.get("maxRisk") as "low" | "medium" | "high" | null;
    const protocol = searchParams.get("protocol");
    const type = searchParams.get("type");
    const top = searchParams.get("top");

    // If requesting top yields
    if (top) {
      const count = parseInt(top) || 5;
      const topYields = await getTopYieldsAsync(count);
      return NextResponse.json({
        success: true,
        data: topYields,
        meta: {
          count: topYields.length,
          avgApy: topYields.reduce((sum, o) => sum + o.apy, 0) / topYields.length,
          source: "defillama", // Indicate real data source
        },
      });
    }

    // Filter yields based on params - using real DeFiLlama data
    const opportunities = await getYieldOpportunitiesAsync({
      minApy: minApy ? parseFloat(minApy) : undefined,
      maxRisk: maxRisk || undefined,
      protocol: protocol || undefined,
      type: type || undefined,
    });

    return NextResponse.json({
      success: true,
      data: opportunities,
      meta: {
        count: opportunities.length,
        totalTvl: opportunities.reduce((sum, o) => sum + o.tvl, 0),
        avgApy: opportunities.length > 0
          ? opportunities.reduce((sum, o) => sum + o.apy, 0) / opportunities.length
          : 0,
        source: "defillama", // Real data from DeFiLlama API
      },
    });
  } catch (error) {
    console.error("Yields API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch yields" },
      { status: 500 }
    );
  }
}
