import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateWeightedScore } from "@/lib/score-calculator";
import { checkAuth } from "@/utils/supabase/check-auth";

export const dynamic = "force-dynamic";

async function handleRecalculate(request: NextRequest) {
  // 1. RBAC Guard check
  const auth = await checkAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    // 2. Resolve default target month/year (fallback to previous month)
    const now = new Date();
    let fallbackMonth = now.getMonth(); // 0-indexed (0 is January, so July is 6 which corresponds to June 1-indexed)
    let fallbackYear = now.getFullYear();
    if (fallbackMonth === 0) {
      fallbackMonth = 12;
      fallbackYear -= 1;
    }

    let month = fallbackMonth;
    let year = fallbackYear;

    // 3. Resolve parameters from query string
    const { searchParams } = new URL(request.url);
    const qMonth = searchParams.get("month");
    const qYear = searchParams.get("year");
    if (qMonth) month = parseInt(qMonth, 10);
    if (qYear) year = parseInt(qYear, 10);

    // 4. Resolve parameters from JSON POST body
    if (request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        if (body.month !== undefined) month = parseInt(body.month, 10);
        if (body.year !== undefined) year = parseInt(body.year, 10);
      } catch (e) {
        // No-op for empty or non-JSON bodies
      }
    }

    // Validation
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid month or year parameters" },
        { status: 400 }
      );
    }

    // 5. Upsert Assessment Period
    const period = await prisma.assessmentPeriod.upsert({
      where: {
        month_year: { month, year },
      },
      update: {},
      create: {
        month,
        year,
        isActive: false, // Default to inactive unless already existing and active
      },
    });

    // 6. Recalculate scores for all faculties
    const faculties = await prisma.faculty.findMany();
    const results = [];

    for (const faculty of faculties) {
      const scoreInfo = await calculateWeightedScore(faculty.id, month, year);

      const scoreBreakdownJson = {
        officialNormalized: scoreInfo.officialNormalized,
        staffNormalized: scoreInfo.staffNormalized,
        studentNormalized: scoreInfo.studentNormalized,
        totalStaffVotes: scoreInfo.totalStaffVotes,
        totalStudentVotes: scoreInfo.totalStudentVotes,
      };

      // Upsert into monthly_faculty_scores table
      await prisma.monthlyFacultyScore.upsert({
        where: {
          facultyId_periodId: {
            facultyId: faculty.id,
            periodId: period.id,
          },
        },
        update: {
          finalScore: scoreInfo.finalScore,
          scoreBreakdown: scoreBreakdownJson,
        },
        create: {
          facultyId: faculty.id,
          periodId: period.id,
          finalScore: scoreInfo.finalScore,
          scoreBreakdown: scoreBreakdownJson,
        },
      });

      // Synchronize back to Faculty currentScore only if recalculating the active period
      if (period.isActive) {
        await prisma.faculty.update({
          where: { id: faculty.id },
          data: {
            currentScore: scoreInfo.finalScore,
          },
        });
      }

      results.push({
        facultyId: faculty.id,
        name: faculty.name,
        finalScore: scoreInfo.finalScore,
        rating: scoreInfo.rating,
        breakdown: scoreInfo,
      });
    }

    return NextResponse.json(
      {
        message: `Monthly compliance scores snapshotted successfully for ${month}/${year}`,
        period: {
          id: period.id,
          month,
          year,
          isActive: period.isActive,
        },
        resultsCount: results.length,
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Monthly snapshot error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRecalculate(request);
}

export async function POST(request: NextRequest) {
  return handleRecalculate(request);
}
