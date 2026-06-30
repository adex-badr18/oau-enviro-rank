import { prisma } from "@/lib/db";
import { getPerformanceRating } from "@/lib/score-calculator";
import LeaderboardClient from "./LeaderboardClient";
import type { Metadata } from "next";

// Auto-revalidate the cached rankings page every 60 seconds (as requested)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "OAU Environmental Compliance Dashboard | Real-time Faculty Leaderboard",
  description: "Real-time leaderboard rankings, stats, and reports for the Vice Chancellor's Environmental Compliance & Cleanliness Initiative at Obafemi Awolowo University.",
};

export default async function Home() {
  // 1. Fetch the active assessment period
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

  const initialData = {
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
  };

  return <LeaderboardClient initialData={initialData} />;
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
