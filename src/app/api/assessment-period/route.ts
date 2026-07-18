import { NextResponse } from "next/server";
import { ensureCurrentPeriodActive } from "@/lib/assessment-period";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activePeriod = await ensureCurrentPeriodActive();

    if (!activePeriod) {
      return NextResponse.json(
        { message: "No active assessment period found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ activePeriod }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/assessment-period error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
