import { prisma, UserRole } from "./db";
import { z } from "zod";

// Zod schemas for validation and type-safe parsing of JSON fields
export const OfficialInspectionScoresSchema = z.object({
  cleanliness: z.number().min(0).max(20),
  wasteManagement: z.number().min(0).max(20),
  safety: z.number().min(0).max(20),
  hygiene: z.number().min(0).max(20),
  sustainability: z.number().min(0).max(20),
});

export type OfficialInspectionScores = z.infer<typeof OfficialInspectionScoresSchema>;

export const UserResponseRatingsSchema = z.object({
  cleanliness: z.number().min(1).max(5),
  wasteDisposal: z.number().min(1).max(5),
  restrooms: z.number().min(1).max(5),
  odor: z.number().min(1).max(5),
});

export type UserResponseRatings = z.infer<typeof UserResponseRatingsSchema>;

// Ratings mapping
export function getPerformanceRating(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}

/**
 * Normalizes an official inspection score out of 100.
 * Max points for each category is 20, total max is 100.
 */
export function normalizeOfficialScore(scores: OfficialInspectionScores): number {
  const sum =
    scores.cleanliness +
    scores.wasteManagement +
    scores.safety +
    scores.hygiene +
    scores.sustainability;
  // Since each is max 20, sum is out of 100. So it is already normalized!
  return Math.min(100, Math.max(0, sum));
}

/**
 * Normalizes a 1-5 scale response to a 0-100 scale.
 * Formula: ((average - 1) / 4) * 100
 */
export function normalizeUserResponse(ratings: UserResponseRatings): number {
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  return ((average - 1) / 4) * 100;
}

interface ScoreCalculationResult {
  officialNormalized: number;
  staffNormalized: number;
  studentNormalized: number;
  finalScore: number;
  rating: string;
  totalStaffVotes: number;
  totalStudentVotes: number;
}

/**
 * Aggregates all official entries, staff votes, and student votes for a specific month/year period,
 * normalizes them to a 100-point scale, and computes the final weighted score:
 * - Official Inspection Score: 70%
 * - Staff Opinion Poll Score: 20%
 * - Student Feedback Score: 10%
 */
export async function calculateWeightedScore(
  facultyId: string,
  month: number,
  year: number
): Promise<ScoreCalculationResult> {
  // Find period
  const period = await prisma.assessmentPeriod.findUnique({
    where: {
      month_year: {
        month,
        year,
      },
    },
  });

  if (!period) {
    return {
      officialNormalized: 0,
      staffNormalized: 0,
      studentNormalized: 0,
      finalScore: 0,
      rating: "Poor",
      totalStaffVotes: 0,
      totalStudentVotes: 0,
    };
  }

  // Fetch official inspection
  const officialInspection = await prisma.officialInspection.findUnique({
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

  // Fetch student and staff responses
  const userResponses = await prisma.userResponse.findMany({
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
      if (resp.role === UserRole.STAFF) {
        staffScores.push(score);
      } else if (resp.role === UserRole.STUDENT) {
        studentScores.push(score);
      }
    }
  }

  const staffNormalized =
    staffScores.length > 0
      ? staffScores.reduce((acc, val) => acc + val, 0) / staffScores.length
      : 0;

  const studentNormalized =
    studentScores.length > 0
      ? studentScores.reduce((acc, val) => acc + val, 0) / studentScores.length
      : 0;

  // Apply weights: 70% official, 20% staff, 10% student
  const finalScore =
    officialNormalized * 0.7 + staffNormalized * 0.2 + studentNormalized * 0.1;

  // Round final score to 2 decimal places
  const roundedFinalScore = Math.round(finalScore * 100) / 100;

  return {
    officialNormalized: Math.round(officialNormalized * 100) / 100,
    staffNormalized: Math.round(staffNormalized * 100) / 100,
    studentNormalized: Math.round(studentNormalized * 100) / 100,
    finalScore: roundedFinalScore,
    rating: getPerformanceRating(roundedFinalScore),
    totalStaffVotes: staffScores.length,
    totalStudentVotes: studentScores.length,
  };
}
