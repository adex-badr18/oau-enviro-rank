import { prisma } from "./db";
import { calculateWeightedScore } from "./score-calculator";

export async function ensureCurrentPeriodActive() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed (1 is January, 7 is July)
  const year = now.getFullYear();

  // 1. Fast check: is this period already active?
  const activePeriod = await prisma.assessmentPeriod.findFirst({
    where: { isActive: true },
  });

  if (activePeriod && activePeriod.month === month && activePeriod.year === year) {
    return activePeriod;
  }

  // 2. If not active or does not exist, activate it and deactivate others
  await prisma.assessmentPeriod.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const period = await prisma.assessmentPeriod.upsert({
    where: {
      month_year: { month, year },
    },
    update: {
      isActive: true,
    },
    create: {
      month,
      year,
      isActive: true,
    },
  });

  // 3. Recalculate scores for all faculties for this new active period
  const faculties = await prisma.faculty.findMany();
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

    // Synchronize to Faculty currentScore
    await prisma.faculty.update({
      where: { id: faculty.id },
      data: {
        currentScore: scoreInfo.finalScore,
      },
    });
  }

  return period;
}
