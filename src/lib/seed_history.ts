import { prisma } from "./db";
import { getPerformanceRating } from "./score-calculator";

async function main() {
  console.log("Seeding historical compliance scores...");

  const faculties = await prisma.faculty.findMany();
  if (faculties.length === 0) {
    console.error("No faculties found in database. Run seed first.");
    process.exit(1);
  }

  // Create historical periods
  const periodsData = [
    { month: 3, year: 2026, isActive: false },
    { month: 4, year: 2026, isActive: false },
    { month: 5, year: 2026, isActive: false },
    { month: 6, year: 2026, isActive: true }
  ];

  const periods = [];
  for (const p of periodsData) {
    const period = await prisma.assessmentPeriod.upsert({
      where: { month_year: { month: p.month, year: p.year } },
      update: { isActive: p.isActive },
      create: { month: p.month, year: p.year, isActive: p.isActive }
    });
    periods.push(period);
    console.log(`Period: ${p.month}/${p.year} (Active: ${p.isActive})`);
  }

  // Seed scores for each faculty across all periods
  for (const faculty of faculties) {
    console.log(`Seeding history for faculty: ${faculty.name}`);
    for (const period of periods) {
      // Deterministic random score based on name and period to avoid completely random changes on rerun
      const seedVal = (faculty.name.length * 7 + period.month * 13) % 100;
      const score = Math.round(40 + (seedVal % 50)); // Score between 40% and 90%
      const official = Math.round(40 + ((seedVal + 10) % 55));
      const staff = Math.round(35 + ((seedVal + 20) % 60));
      const student = Math.round(45 + ((seedVal + 30) % 50));
      const rating = getPerformanceRating(score);

      const breakdown = {
        officialNormalized: official,
        staffNormalized: staff,
        studentNormalized: student,
        finalScore: score,
        rating,
        totalStaffVotes: (seedVal % 15) + 2,
        totalStudentVotes: (seedVal % 45) + 5
      };

      await prisma.monthlyFacultyScore.upsert({
        where: {
          facultyId_periodId: {
            facultyId: faculty.id,
            periodId: period.id
          }
        },
        update: {
          finalScore: score,
          scoreBreakdown: breakdown
        },
        create: {
          facultyId: faculty.id,
          periodId: period.id,
          finalScore: score,
          scoreBreakdown: breakdown
        }
      });
    }
  }

  console.log("✓ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding history:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
