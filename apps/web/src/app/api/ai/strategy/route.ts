import { NextResponse } from "next/server";
import { generateStrategy } from "@/lib/ai/agent";

export async function POST(req: Request) {
  try {
    const { portfolioValue, riskTolerance, targetYield } = await req.json();

    if (!portfolioValue || !riskTolerance) {
      return NextResponse.json(
        { error: "portfolioValue and riskTolerance are required" },
        { status: 400 }
      );
    }

    if (!["conservative", "moderate", "aggressive"].includes(riskTolerance)) {
      return NextResponse.json(
        { error: "riskTolerance must be conservative, moderate, or aggressive" },
        { status: 400 }
      );
    }

    const result = await generateStrategy(portfolioValue, riskTolerance, targetYield);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Strategy API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate strategy" },
      { status: 500 }
    );
  }
}
