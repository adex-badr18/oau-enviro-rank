import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  UserResponseRatingsSchema,
  OfficialInspectionScoresSchema,
  normalizeOfficialScore,
  normalizeUserResponse,
  getPerformanceRating,
} from "@/lib/score-calculator";
import { z } from "zod";

const VoteRequestSchema = z.object({
  facultyId: z.string().uuid("Invalid faculty ID format"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  role: z.enum(["STAFF", "STUDENT"]),
  respondentId: z.string().optional(),
  responses: UserResponseRatingsSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = VoteRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.format() },
        { status: 400 }
      );
    }

    const { facultyId, month, year, role, respondentId, responses } = result.data;

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

    // Record response and recalculate score inside a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Create new user response
      await tx.userResponse.create({
        data: {
          facultyId,
          periodId: period.id,
          role,
          respondentId: respondentId || null,
          responses,
        },
      });

      // 2. Fetch official inspection if exists for official score component
      const officialInspection = await tx.officialInspection.findUnique({
        where: {
          facultyId_periodId: {
            facultyId,
            periodId: period.id,
          },
        },
      });

      let officialNormalized = 0;
      if (officialInspection) {
        const parsed = OfficialInspectionScoresSchema.safeParse(
          officialInspection.criteriaScores
        );
        if (parsed.success) {
          officialNormalized = normalizeOfficialScore(parsed.data);
        }
      }

      // 3. Fetch all user responses (including the newly added one) for calculation
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

      // Calculate component averages
      const staffNormalized =
        staffScores.length > 0
          ? staffScores.reduce((a, b) => a + b, 0) / staffScores.length
          : 0;
      const studentNormalized =
        studentScores.length > 0
          ? studentScores.reduce((a, b) => a + b, 0) / studentScores.length
          : 0;

      // Apply weights: 70% official, 20% staff, 10% student
      const finalScore =
        officialNormalized * 0.7 + staffNormalized * 0.2 + studentNormalized * 0.1;
      const roundedFinalScore = Math.round(finalScore * 100) / 100;

      // 4. Upsert historical monthly score for time-series tracking
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

      // 5. Update the faculty score in the DB
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
        message: "Vote registered and faculty score recalculated successfully",
        ...transactionResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST vote error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
