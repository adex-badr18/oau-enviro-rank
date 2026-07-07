process.env.BYPASS_AUTH_FOR_TEST = "true";
import { GET as getFaculties, POST as createFaculty } from "@/app/api/faculties/route";
import { PATCH as updateFaculty, DELETE as deleteFaculty } from "@/app/api/faculties/[id]/route";
import { POST as inspectPOST } from "@/app/api/inspect/route";
import { POST as votePOST } from "@/app/api/vote/route";
import { GET as recalculateScores } from "@/app/api/calculate-monthly-scores/route";
import { GET as getHistory } from "@/app/api/admin/reports/history/route";
import { GET as getLeaderboard } from "@/app/api/leaderboard/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

async function runTests() {
  console.log("=== STARTING ARCHITECTURE INTEGRATION TESTS ===");

  // Cleanup leftovers from any previous failed runs to guarantee idempotency
  await prisma.faculty.deleteMany({
    where: { name: "Faculty of Trial Sciences" },
  });

  // 1. Test GET /api/faculties
  console.log("\n1. Testing GET /api/faculties (list)...");
  const getRes = await getFaculties() as any;
  const initialFaculties = await getRes.json();
  console.log(`Successfully fetched ${initialFaculties.length} faculties.`);
  if (initialFaculties.length < 16) {
    throw new Error(`Expected at least 16 seeded faculties, found ${initialFaculties.length}`);
  }

  // 2. Test POST /api/faculties (create)
  console.log("\n2. Testing POST /api/faculties (create)...");
  const createPayload = {
    name: "Faculty of Trial Sciences",
    buildingName: "Testing Laboratory Block A",
    description: "A temporary faculty created for integration testing.",
  };
  const createReq = new NextRequest("http://localhost/api/faculties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload),
  });
  const createRes = await createFaculty(createReq) as any;
  const createdFaculty = await createRes.json();
  console.log("Created Faculty:", createdFaculty);
  if (!createdFaculty.id || createdFaculty.name !== createPayload.name) {
    throw new Error("Created faculty data mismatch or missing ID");
  }
  const facultyId = createdFaculty.id;

  // 3. Test PATCH /api/faculties/[id] (update)
  console.log(`\n3. Testing PATCH /api/faculties/${facultyId} (update)...`);
  const patchPayload = {
    buildingName: "Testing Laboratory Block B - Updated",
  };
  const patchReq = new NextRequest(`http://localhost/api/faculties/${facultyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchPayload),
  });
  const patchRes = await updateFaculty(patchReq, {
    params: Promise.resolve({ id: facultyId }),
  }) as any;
  const patchedFaculty = await patchRes.json();
  console.log("Updated Faculty:", patchedFaculty);
  if (patchedFaculty.buildingName !== patchPayload.buildingName) {
    throw new Error("Failed to update faculty building name");
  }

  // 4. Test POST /api/inspect (official inspection submission)
  console.log("\n4. Testing POST /api/inspect (Official Inspection)...");
  const inspectPayload = {
    facultyId,
    month: 6,
    year: 2026,
    criteriaScores: {
      cleanliness: 16,        // 16/20
      landscape: 8,           // 8/10
      wasteDisposal: 8,       // 8/10
      restrooms: 8,           // 8/10
      infrastructure: 7,      // 7/10
      sustainability: 7,      // 7/10
      drainage: 7,            // 7/10
      behavior: 4,            // 4/5
      innovation: 3,          // 3/5
      safety: 4,              // 4/5
      sanitationExercises: 3, // 3/5
    },
  };
  // Expected sum = 16 + 8 + 8 + 8 + 7 + 7 + 7 + 4 + 3 + 4 + 3 = 75 out of 100 (normalized = 75%)
  const inspectReq = new NextRequest("http://localhost/api/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inspectPayload),
  });
  const inspectRes = await inspectPOST(inspectReq) as any;
  const inspectResult = await inspectRes.json();
  console.log("Inspection Result:", inspectResult);
  if (inspectResult.scoreBreakdown.officialNormalized !== 75) {
    throw new Error(`Expected official score 75, got ${inspectResult.scoreBreakdown.officialNormalized}`);
  }
  // At this point, no votes exist yet. Weighted score:
  // Official: 75 * 0.7 = 52.5
  // Staff: 0 * 0.2 = 0
  // Student: 0 * 0.1 = 0
  // Total = 52.5
  if (inspectResult.faculty.currentScore !== 52.5) {
    throw new Error(`Expected initial weighted score 52.5, got ${inspectResult.faculty.currentScore}`);
  }

  // 5. Test POST /api/vote (Staff vote 1)
  console.log("\n5. Testing POST /api/vote (Staff vote 1)...");
  const staffVote1Payload = {
    facultyId,
    month: 6,
    year: 2026,
    role: "STAFF",
    responses: {
      cleanliness: 4,
      wasteDisposal: 3,
      restrooms: 5,
      odor: 4,
    },
  };
  // Avg = (4+3+5+4)/4 = 4. Normalized = ((4-1)/4)*100 = 75%
  const voteReq1 = new NextRequest("http://localhost/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffVote1Payload),
  });
  const voteRes1 = await votePOST(voteReq1) as any;
  const voteResult1 = await voteRes1.json();
  console.log("Vote 1 Result:", voteResult1);
  if (voteResult1.scoreBreakdown.staffNormalized !== 75) {
    throw new Error(`Expected staff normalized score 75, got ${voteResult1.scoreBreakdown.staffNormalized}`);
  }

  // 6. Test POST /api/vote (Staff vote 2)
  console.log("\n6. Testing POST /api/vote (Staff vote 2)...");
  const staffVote2Payload = {
    facultyId,
    month: 6,
    year: 2026,
    role: "STAFF",
    responses: {
      cleanliness: 5,
      wasteDisposal: 4,
      restrooms: 4,
      odor: 3,
    },
  };
  // Avg = (5+4+4+3)/4 = 4. Normalized = ((4-1)/4)*100 = 75%
  // Overall Staff average is (75+75)/2 = 75%
  const voteReq2 = new NextRequest("http://localhost/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffVote2Payload),
  });
  const voteRes2 = await votePOST(voteReq2) as any;
  const voteResult2 = await voteRes2.json();
  console.log("Vote 2 Result:", voteResult2);
  if (voteResult2.scoreBreakdown.staffNormalized !== 75) {
    throw new Error(`Expected staff average 75, got ${voteResult2.scoreBreakdown.staffNormalized}`);
  }

  // 7. Test POST /api/vote (Student vote)
  console.log("\n7. Testing POST /api/vote (Student vote)...");
  const studentVotePayload = {
    facultyId,
    month: 6,
    year: 2026,
    role: "STUDENT",
    responses: {
      cleanliness: 5,
      wasteDisposal: 5,
      restrooms: 5,
      odor: 5,
    },
  };
  // Avg = 5. Normalized = ((5-1)/4)*100 = 100%
  const voteReq3 = new NextRequest("http://localhost/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentVotePayload),
  });
  const voteRes3 = await votePOST(voteReq3) as any;
  const voteResult3 = await voteRes3.json();
  console.log("Vote 3 Result:", voteResult3);
  if (voteResult3.scoreBreakdown.studentNormalized !== 100) {
    throw new Error(`Expected student normalized score 100, got ${voteResult3.scoreBreakdown.studentNormalized}`);
  }

  // 8. Verify cumulative calculations and MonthlyFacultyScore persistence
  // Cumulative weighted score:
  // Official (70%): 75 * 0.7 = 52.5
  // Staff (20%): 75 * 0.2 = 15.0
  // Student (10%): 100 * 0.1 = 10.0
  // Total = 52.5 + 15 + 10 = 77.5
  // Rating: 77.5 is Good (70-79)
  console.log("\n8. Verifying Final Cumulative Score & Historical Records...");
  const finalScore = voteResult3.faculty.currentScore;
  const rating = voteResult3.scoreBreakdown.rating;
  console.log(`Final Cumulative Score in DB: ${finalScore} (${rating})`);
  if (finalScore !== 77.5) {
    throw new Error(`Expected final score 77.5, got ${finalScore}`);
  }
  if (rating !== "Good") {
    throw new Error(`Expected rating "Good", got "${rating}"`);
  }

  // Retrieve monthly score record from DB
  const monthlyScore = await prisma.monthlyFacultyScore.findFirst({
    where: { facultyId },
  });
  if (!monthlyScore) {
    throw new Error("Expected a MonthlyFacultyScore record to be persisted in DB, but found none");
  }
  console.log(`Found MonthlyFacultyScore: score = ${monthlyScore.finalScore}`);
  if (monthlyScore.finalScore !== 77.5) {
    throw new Error(`Expected persisted finalScore to be 77.5, got ${monthlyScore.finalScore}`);
  }
  console.log("✓ Cumulative score, rating, and MonthlyFacultyScore verified successfully!");

  // 8a. Test GET /api/calculate-monthly-scores (Snapshot generation)
  console.log("\n8a. Testing Auth Security on calculate-monthly-scores...");
  delete process.env.BYPASS_AUTH_FOR_TEST;
  const unauthorizedReq = new NextRequest("http://localhost/api/calculate-monthly-scores");
  const unauthRes = await recalculateScores(unauthorizedReq) as any;
  console.log(`Response status (unauthorized): ${unauthRes.status}`);
  if (unauthRes.status === 200) {
    throw new Error("Expected request to calculate-monthly-scores to be blocked, but got status 200");
  }
  process.env.BYPASS_AUTH_FOR_TEST = "true";

  console.log("\n8b. Testing GET /api/calculate-monthly-scores (with bypass)...");
  const recalculateReq = new NextRequest("http://localhost/api/calculate-monthly-scores?month=6&year=2026");
  const recalculateRes = await recalculateScores(recalculateReq) as any;
  const recalculateResult = await recalculateRes.json();
  console.log("Recalculate Result:", recalculateResult);
  if (recalculateRes.status !== 200 || !recalculateResult.results || recalculateResult.results.length === 0) {
    throw new Error("Failed to recalculate and snapshot scores");
  }
  console.log("✓ Snapshot calculations successfully run!");

  // 8c. Test GET /api/admin/reports/history (Historical Snapshot Listing)
  console.log("\n8c. Testing GET /api/admin/reports/history...");
  const historyReq = new NextRequest("http://localhost/api/admin/reports/history?month=6&year=2026");
  const historyRes = await getHistory(historyReq) as any;
  const historyResult = await historyRes.json();
  console.log("History Result count:", historyResult.data?.length);
  if (historyRes.status !== 200 || !historyResult.data || historyResult.data.length === 0) {
    throw new Error("Failed to fetch historical snapshots data");
  }
  const verifiedScore = historyResult.data.find((item: any) => item.facultyId === facultyId);
  if (!verifiedScore) {
    throw new Error(`Expected historical record for faculty ID ${facultyId} in the snapshots`);
  }
  console.log(`✓ Historical snapshot successfully retrieved: finalScore = ${verifiedScore.finalScore}`);

  // 8d. Test GET /api/leaderboard (Historical vs Current parameters)
  console.log("\n8d. Testing GET /api/leaderboard...");
  const currentLeaderboardReq = new NextRequest("http://localhost/api/leaderboard?type=current");
  const currentLeaderboardRes = await getLeaderboard(currentLeaderboardReq) as any;
  const currentLeaderboardResult = await currentLeaderboardRes.json();
  console.log(`Current leaderboard count: ${currentLeaderboardResult.leaderboard?.length}`);
  if (currentLeaderboardRes.status !== 200 || !currentLeaderboardResult.leaderboard || currentLeaderboardResult.leaderboard.length === 0) {
    throw new Error("Failed to fetch current leaderboard data");
  }

  const historicalLeaderboardReq = new NextRequest("http://localhost/api/leaderboard?type=historical");
  const historicalLeaderboardRes = await getLeaderboard(historicalLeaderboardReq) as any;
  const historicalLeaderboardResult = await historicalLeaderboardRes.json();
  console.log(`Historical leaderboard count: ${historicalLeaderboardResult.leaderboard?.length}`);
  if (historicalLeaderboardRes.status !== 200 || !historicalLeaderboardResult.leaderboard || historicalLeaderboardResult.leaderboard.length === 0) {
    throw new Error("Failed to fetch historical leaderboard data");
  }

  // Find our verified score in the historical averages response
  const verifyHistoricalItem = historicalLeaderboardResult.leaderboard.find((item: any) => item.id === facultyId);
  if (!verifyHistoricalItem) {
    throw new Error(`Expected faculty ${facultyId} to exist in historical leaderboard averages`);
  }
  console.log(`✓ Historical averages leaderboard returned score = ${verifyHistoricalItem.currentScore}`);
  if (verifyHistoricalItem.currentScore !== 77.5) {
    throw new Error(`Expected historical average score to be 77.5, got ${verifyHistoricalItem.currentScore}`);
  }
  console.log("✓ Leaderboard type toggling endpoints verified successfully!");

  // 9. Test DELETE /api/faculties/[id] (cascade checking)
  console.log(`\n9. Testing DELETE /api/faculties/${facultyId} (cascade delete)...`);
  const deleteReq = new NextRequest(`http://localhost/api/faculties/${facultyId}`, {
    method: "DELETE",
  });
  const deleteRes = await deleteFaculty(deleteReq, {
    params: Promise.resolve({ id: facultyId }),
  }) as any;
  const deleteResult = await deleteRes.json();
  console.log("Delete result:", deleteResult);

  // Check database that related records were deleted
  const checkInspections = await prisma.officialInspection.findMany({
    where: { facultyId },
  });
  const checkResponses = await prisma.userResponse.findMany({
    where: { facultyId },
  });
  const checkMonthlyScores = await prisma.monthlyFacultyScore.findMany({
    where: { facultyId },
  });
  if (checkInspections.length !== 0 || checkResponses.length !== 0 || checkMonthlyScores.length !== 0) {
    throw new Error("Cascade delete failed: related inspections, votes, or monthly scores still exist in DB!");
  }
  console.log("✓ Cascade delete works! Faculty and all child relations (inspections, votes, historical scores) removed.");

  console.log("\n=== ALL ARCHITECTURE INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ TEST FAILED:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
