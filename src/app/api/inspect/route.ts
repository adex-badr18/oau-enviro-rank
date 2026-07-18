import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  OfficialInspectionScoresSchema,
  normalizeOfficialScore,
  normalizeUserResponse,
  UserResponseRatingsSchema,
  getPerformanceRating,
} from "@/lib/score-calculator";
import { z } from "zod";
import { checkAuth } from "@/utils/supabase/check-auth";

const InspectRequestSchema = z.object({
  facultyId: z.string().uuid("Invalid faculty ID format"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  criteriaScores: OfficialInspectionScoresSchema,
});

export async function POST(request: NextRequest) {
  const auth = await checkAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const result = InspectRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.format() },
        { status: 400 }
      );
    }

    const { facultyId, month, year, criteriaScores } = result.data;

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Not Found", message: `Faculty with ID "${facultyId}" not found` },
        { status: 404 }
      );
    }

    // Find or create the assessment period
    const period = await prisma.assessmentPeriod.upsert({
      where: {
        month_year: { month, year },
      },
      update: {},
      create: {
        month,
        year,
        isActive: true,
      },
    });

    // Run the inspection log and score recalculation in a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Record or update official inspection
      await tx.officialInspection.upsert({
        where: {
          facultyId_periodId: {
            facultyId,
            periodId: period.id,
          },
        },
        update: {
          criteriaScores,
        },
        create: {
          facultyId,
          periodId: period.id,
          criteriaScores,
        },
      });

      // 2. Fetch all user responses for calculation
      const userResponses = await tx.userResponse.findMany({
        where: {
          facultyId,
          periodId: period.id,
        },
      });

      const staffScores: number[] = [];
      const studentScores: number[] = [];

      for (const resp of userResponses) {
        const parsed = UserResponseRatingsSchema.safeParse(resp.responses);
        if (parsed.success) {
          const score = normalizeUserResponse(parsed.data);
          if (resp.role === "STAFF") {
            staffScores.push(score);
          } else if (resp.role === "STUDENT") {
            studentScores.push(score);
          }
        }
      }

      // Calculate normalized component averages
      const officialNormalized = normalizeOfficialScore(criteriaScores);
      const staffNormalized =
        staffScores.length > 0
          ? staffScores.reduce((a, b) => a + b, 0) / staffScores.length
          : 0;
      const studentNormalized =
        studentScores.length > 0
          ? studentScores.reduce((a, b) => a + b, 0) / studentScores.length
          : 0;

      // Calculate cumulative weighted score
      const finalScore =
        officialNormalized * 0.7 + staffNormalized * 0.2 + studentNormalized * 0.1;
      const roundedFinalScore = Math.round(finalScore * 100) / 100;

      // 3. Upsert historical monthly score for time-series tracking
      const scoreBreakdownJson = {
        officialNormalized: Math.round(officialNormalized * 100) / 100,
        staffNormalized: Math.round(staffNormalized * 100) / 100,
        studentNormalized: Math.round(studentNormalized * 100) / 100,
        totalStaffVotes: staffScores.length,
        totalStudentVotes: studentScores.length,
      };

      await tx.monthlyFacultyScore.upsert({
        where: {
          facultyId_periodId: {
            facultyId,
            periodId: period.id,
          },
        },
        update: {
          finalScore: roundedFinalScore,
          scoreBreakdown: scoreBreakdownJson,
        },
        create: {
          facultyId,
          periodId: period.id,
          finalScore: roundedFinalScore,
          scoreBreakdown: scoreBreakdownJson,
        },
      });

      // 4. Update the faculty score
      const updatedFaculty = await tx.faculty.update({
        where: { id: facultyId },
        data: {
          currentScore: roundedFinalScore,
        },
      });

      return {
        faculty: updatedFaculty,
        scoreBreakdown: {
          officialNormalized: Math.round(officialNormalized * 100) / 100,
          staffNormalized: Math.round(staffNormalized * 100) / 100,
          studentNormalized: Math.round(studentNormalized * 100) / 100,
          finalScore: roundedFinalScore,
          rating: getPerformanceRating(roundedFinalScore),
          totalStaffVotes: staffScores.length,
          totalStudentVotes: studentScores.length,
        },
      };
    });

    return NextResponse.json(
      {
        message: "Official inspection submitted and score recalculated successfully",
        ...transactionResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST inspect error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
