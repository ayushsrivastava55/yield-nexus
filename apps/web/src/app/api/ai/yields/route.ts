import { NextResponse } from "next/server";
import { getYieldOpportunitiesAsyncWithSource, getTopYieldsAsyncWithSource } from "@/lib/ai/yield-data";

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
      const topYields = await getTopYieldsAsyncWithSource(count);
      return NextResponse.json({
        success: true,
        data: topYields.data,
        meta: {
          count: topYields.data.length,
          avgApy: topYields.data.length > 0
            ? topYields.data.reduce((sum, o) => sum + o.apy, 0) / topYields.data.length
            : 0,
          source: topYields.source,
        },
      });
    }

    // Filter yields based on params - using real DeFiLlama data
    const opportunities = await getYieldOpportunitiesAsyncWithSource({
      minApy: minApy ? parseFloat(minApy) : undefined,
      maxRisk: maxRisk || undefined,
      protocol: protocol || undefined,
      type: type || undefined,
    });

    return NextResponse.json({
      success: true,
      data: opportunities.data,
      meta: {
        count: opportunities.data.length,
        totalTvl: opportunities.data.reduce((sum, o) => sum + o.tvl, 0),
        avgApy: opportunities.data.length > 0
          ? opportunities.data.reduce((sum, o) => sum + o.apy, 0) / opportunities.data.length
          : 0,
        source: opportunities.source,
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
