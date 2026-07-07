import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPerformanceRating } from "@/lib/score-calculator";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Not Found", message: `Faculty with ID "${id}" not found` },
        { status: 404 }
      );
    }

    // Retrieve all monthly scores for this faculty
    const monthlyScores = await prisma.monthlyFacultyScore.findMany({
      where: { facultyId: id },
      include: {
        period: true,
      },
      orderBy: [
        { period: { year: "asc" } },
        { period: { month: "asc" } },
      ],
    });

    // Format historical response
    const history = monthlyScores.map((ms) => {
      const breakdown = typeof ms.scoreBreakdown === "string" 
        ? JSON.parse(ms.scoreBreakdown) 
        : ms.scoreBreakdown;

      return {
        id: ms.id,
        periodId: ms.periodId,
        month: ms.period.month,
        year: ms.period.year,
        periodLabel: `${getMonthName(ms.period.month)} ${ms.period.year}`,
        finalScore: ms.finalScore,
        rating: getPerformanceRating(ms.finalScore),
        breakdown: {
          officialNormalized: breakdown?.officialNormalized ?? 0,
          staffNormalized: breakdown?.staffNormalized ?? 0,
          studentNormalized: breakdown?.studentNormalized ?? 0,
          totalStaffVotes: breakdown?.totalStaffVotes ?? 0,
          totalStudentVotes: breakdown?.totalStudentVotes ?? 0,
        },
        createdAt: ms.createdAt,
      };
    });

    return NextResponse.json({
      faculty: {
        id: faculty.id,
        name: faculty.name,
        buildingName: faculty.buildingName,
        description: faculty.description,
        currentScore: faculty.currentScore,
        rating: getPerformanceRating(faculty.currentScore),
      },
      history,
    });
  } catch (error: any) {
    console.error("GET faculty history error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

function getMonthName(monthNum: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNum - 1] || "Unknown";
}
