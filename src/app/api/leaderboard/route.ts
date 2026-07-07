import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPerformanceRating } from "@/lib/score-calculator";

// Disable static optimization for this API to ensure real-time data
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "current";

    if (type === "historical") {
      // 1. Fetch all monthly scores and faculties
      const monthlyScores = await prisma.monthlyFacultyScore.findMany();
      const faculties = await prisma.faculty.findMany();

      // Group scores by facultyId
      const scoresByFaculty: Record<string, number[]> = {};
      monthlyScores.forEach((ms) => {
        if (!scoresByFaculty[ms.facultyId]) {
          scoresByFaculty[ms.facultyId] = [];
        }
        scoresByFaculty[ms.facultyId].push(ms.finalScore);
      });

      const leaderboardData = faculties.map((f) => {
        const scores = scoresByFaculty[f.id] || [];
        const avgScore = scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : 0;

        return {
          id: f.id,
          name: f.name,
          buildingName: f.buildingName,
          description: f.description,
          currentScore: avgScore,
          rating: getPerformanceRating(avgScore),
        };
      });

      // Sort by score descending
      leaderboardData.sort((a, b) => b.currentScore - a.currentScore);

      const leaderboard = leaderboardData.map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

      // 2. Fetch all-time aggregates for statistics cards
      const totalInspections = await prisma.officialInspection.count();
      const totalVotes = await prisma.userResponse.count();
      const totalStaffVotes = await prisma.userResponse.count({
        where: { role: "STAFF" },
      });
      const totalStudentVotes = await prisma.userResponse.count({
        where: { role: "STUDENT" },
      });

      const allScores = monthlyScores.map((ms) => ms.finalScore);
      const campusAverage = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
        : 0;

      return NextResponse.json({
        activePeriod: {
          month: 0,
          year: 0,
          label: "All-Time Historical Averages",
        },
        leaderboard,
        stats: {
          totalInspections,
          totalVotes,
          totalStaffVotes,
          totalStudentVotes,
          campusAverage,
          totalFaculties: faculties.length,
        },
      });
    }

    // Default 'current' view
    // 1. Fetch active assessment period
    const activePeriod = await prisma.assessmentPeriod.findFirst({
      where: { isActive: true },
    });

    // 2. Fetch all faculties sorted by currentScore descending
    const faculties = await prisma.faculty.findMany({
      orderBy: { currentScore: "desc" },
    });

    const leaderboard = faculties.map((f, index) => ({
      rank: index + 1,
      id: f.id,
      name: f.name,
      buildingName: f.buildingName,
      description: f.description,
      currentScore: f.currentScore,
      rating: getPerformanceRating(f.currentScore),
    }));

    // 3. Aggregate campus stats for the active period
    let totalInspections = 0;
    let totalVotes = 0;
    let totalStaffVotes = 0;
    let totalStudentVotes = 0;

    if (activePeriod) {
      totalInspections = await prisma.officialInspection.count({
        where: { periodId: activePeriod.id },
      });

      totalVotes = await prisma.userResponse.count({
        where: { periodId: activePeriod.id },
      });

      totalStaffVotes = await prisma.userResponse.count({
        where: {
          periodId: activePeriod.id,
          role: "STAFF",
        },
      });

      totalStudentVotes = await prisma.userResponse.count({
        where: {
          periodId: activePeriod.id,
          role: "STUDENT",
        },
      });
    }

    const avgAgg = await prisma.faculty.aggregate({
      _avg: { currentScore: true },
    });
    const campusAverage = avgAgg._avg.currentScore 
      ? Math.round(avgAgg._avg.currentScore * 100) / 100 
      : 0;

    return NextResponse.json({
      activePeriod: activePeriod
        ? {
            month: activePeriod.month,
            year: activePeriod.year,
            label: `${getMonthName(activePeriod.month)} ${activePeriod.year}`,
          }
        : null,
      leaderboard,
      stats: {
        totalInspections,
        totalVotes,
        totalStaffVotes,
        totalStudentVotes,
        campusAverage,
        totalFaculties: faculties.length,
      },
    });
  } catch (error: any) {
    console.error("GET leaderboard error:", error);
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
