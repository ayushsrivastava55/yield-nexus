import { NextResponse } from "next/server";
import { analyzeYields } from "@/lib/ai/agent";

export async function POST(req: Request) {
  try {
    const { riskTolerance, investmentAmount } = await req.json();

    if (!riskTolerance || !investmentAmount) {
      return NextResponse.json(
        { error: "riskTolerance and investmentAmount are required" },
        { status: 400 }
      );
    }

    if (!["conservative", "moderate", "aggressive"].includes(riskTolerance)) {
      return NextResponse.json(
        { error: "riskTolerance must be conservative, moderate, or aggressive" },
        { status: 400 }
      );
    }

    const result = await analyzeYields(riskTolerance, investmentAmount);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Analyze API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze yields" },
      { status: 500 }
    );
  }
}
