import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAuth } from "@/lib/check-auth";
import { getPerformanceRating } from "@/lib/score-calculator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. RBAC Guard check
  const auth = await checkAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");

    if (!monthStr || !yearStr) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required month or year query parameters" },
        { status: 400 }
      );
    }

    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid month or year values" },
        { status: 400 }
      );
    }

    // 2. Fetch target assessment period
    const period = await prisma.assessmentPeriod.findUnique({
      where: {
        month_year: { month, year },
      },
    });

    if (!period) {
      return NextResponse.json(
        {
          message: "No historical records found for this period",
          period: { month, year },
          data: [],
        },
        { status: 200 }
      );
    }

    // 3. Query all monthly scores for this period
    const scores = await prisma.monthlyFacultyScore.findMany({
      where: {
        periodId: period.id,
      },
      include: {
        faculty: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        finalScore: "desc",
      },
    });

    // 4. Format scores
    const formattedData = scores.map((s) => {
      const breakdown = (s.scoreBreakdown as any) || {};
      return {
        id: s.id,
        facultyId: s.facultyId,
        name: s.faculty.name,
        finalScore: s.finalScore,
        rating: getPerformanceRating(s.finalScore),
        officialNormalized: breakdown.officialNormalized ?? s.finalScore,
        staffNormalized: breakdown.staffNormalized ?? 0,
        studentNormalized: breakdown.studentNormalized ?? 0,
        totalStaffVotes: breakdown.totalStaffVotes ?? 0,
        totalStudentVotes: breakdown.totalStudentVotes ?? 0,
      };
    });

    return NextResponse.json(
      {
        message: "Historical monthly scores fetched successfully",
        period: {
          id: period.id,
          month,
          year,
        },
        data: formattedData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET reports history error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
