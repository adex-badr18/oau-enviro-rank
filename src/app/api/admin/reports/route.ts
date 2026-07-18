import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calculateWeightedScore,
  getPerformanceRating,
} from "@/lib/score-calculator";
import ExcelJS from "exceljs";
import { checkAuth } from "@/utils/supabase/check-auth";

export async function GET(request: NextRequest) {
  const auth = await checkAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const startMonth = parseInt(searchParams.get("startMonth") || "1", 10);
    const startYear = parseInt(searchParams.get("startYear") || "2000", 10);
    const endMonth = parseInt(searchParams.get("endMonth") || "12", 10);
    const endYear = parseInt(searchParams.get("endYear") || "2100", 10);

    if (
      isNaN(startMonth) ||
      isNaN(startYear) ||
      isNaN(endMonth) ||
      isNaN(endYear)
    ) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid date range parameters" },
        { status: 400 }
      );
    }

    // Fetch all assessment periods
    const allPeriods = await prisma.assessmentPeriod.findMany({
      orderBy: [
        { year: "asc" },
        { month: "asc" },
      ],
    });

    const startVal = startYear * 12 + (startMonth - 1);
    const endVal = endYear * 12 + (endMonth - 1);

    const activePeriods = allPeriods.filter((p: { year: number; month: number }) => {
      const val = p.year * 12 + (p.month - 1);
      return val >= startVal && val <= endVal;
    });

    if (activePeriods.length === 0) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "No assessment periods found within the selected range",
        },
        { status: 404 }
      );
    }

    const faculties = await prisma.faculty.findMany({
      orderBy: { name: "asc" },
    });

    const startLabel = `${getMonthName(startMonth)} ${startYear}`;
    const endLabel = `${getMonthName(endMonth)} ${endYear}`;

    // Aggregated period calculations (run once for both preview and spreadsheet download)
    const aggregatedData = await Promise.all(
      faculties.map(async (faculty) => {
        let staffVotesSum = 0;
        let studentVotesSum = 0;
        let officialSum = 0;
        let finalScoreSum = 0;
        let activeMonthsCount = 0;

        for (const period of activePeriods) {
          const scoreInfo = await calculateWeightedScore(
            faculty.id,
            period.month,
            period.year
          );

          staffVotesSum += scoreInfo.totalStaffVotes;
          studentVotesSum += scoreInfo.totalStudentVotes;
          officialSum += scoreInfo.officialNormalized;
          finalScoreSum += scoreInfo.finalScore;
          activeMonthsCount++;
        }

        const avgInspection =
          activeMonthsCount > 0 ? officialSum / activeMonthsCount : 0;
        const avgWeighted =
          activeMonthsCount > 0 ? finalScoreSum / activeMonthsCount : 0;

        return {
          id: faculty.id,
          name: faculty.name,
          staffVotes: staffVotesSum,
          studentVotes: studentVotesSum,
          avgInspection,
          avgWeighted,
          rating: getPerformanceRating(avgWeighted),
        };
      })
    );

    // If preview query parameter is true, return JSON format instead of xlsx workbook
    const preview = searchParams.get("preview") === "true";
    if (preview) {
      return NextResponse.json(
        {
          periodRange: { startLabel, endLabel },
          activePeriodsCount: activePeriods.length,
          data: aggregatedData,
        },
        { status: 200 }
      );
    }

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "OAU Inspection Committee";
    workbook.lastModifiedBy = "OAU Environmental Rank System";
    workbook.created = new Date();

    // 1. SHEET 1: Monthly Performance Breakdown
    const sheet1 = workbook.addWorksheet("Monthly Performance");
    sheet1.views = [{ showGridLines: true }];

    // Header Styling
    const headerFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10386B" }, // Navy Blue
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: "Arial",
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };

    // Title Row
    sheet1.mergeCells("A1:G1");
    const titleCell1 = sheet1.getCell("A1");
    titleCell1.value = "OAU ENVIRONMENTAL COMPLIANCE - MONTHLY REPORT";
    titleCell1.font = { name: "Arial", bold: true, size: 16, color: { argb: "FF10386B" } };
    titleCell1.alignment = { vertical: "middle", horizontal: "center" };
    sheet1.getRow(1).height = 40;

    // Subtitle Row
    sheet1.mergeCells("A2:G2");
    const subtitleCell1 = sheet1.getCell("A2");
    subtitleCell1.value = `Period Range: ${startLabel} to ${endLabel} | Generated: ${new Date().toLocaleDateString()}`;
    subtitleCell1.font = { name: "Arial", italic: true, size: 10, color: { argb: "FF555555" } };
    subtitleCell1.alignment = { vertical: "middle", horizontal: "center" };
    sheet1.getRow(2).height = 20;

    // Blank row
    sheet1.getRow(3).height = 10;

    // Headers
    const headers1 = [
      "Month-Year",
      "Faculty Name",
      "Staff Votes",
      "Student Votes",
      "Avg Inspection Score",
      "Final Weighted Score",
      "Performance Rating",
    ];

    const headerRow1 = sheet1.addRow(headers1);
    headerRow1.height = 28;
    headerRow1.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = borderStyle;
    });

    const monthlyRowsData: any[] = [];

    // Calculate monthly data for each period and faculty
    for (const period of activePeriods) {
      const periodLabel = `${getMonthName(period.month)} ${period.year}`;
      for (const faculty of faculties) {
        const scoreInfo = await calculateWeightedScore(
          faculty.id,
          period.month,
          period.year
        );

        monthlyRowsData.push({
          periodLabel,
          facultyName: faculty.name,
          staffVotes: scoreInfo.totalStaffVotes,
          studentVotes: scoreInfo.totalStudentVotes,
          avgInspection: scoreInfo.officialNormalized,
          finalScore: scoreInfo.finalScore,
          rating: scoreInfo.rating,
        });
      }
    }

    // Write Sheet 1 Data Rows
    monthlyRowsData.forEach((row, i) => {
      const addedRow = sheet1.addRow([
        row.periodLabel,
        row.facultyName,
        row.staffVotes,
        row.studentVotes,
        row.avgInspection / 100, // format as percentage
        row.finalScore / 100,    // format as percentage
        row.rating,
      ]);
      addedRow.height = 22;

      const isEven = i % 2 === 0;
      const rowFillColor = isEven ? "FFFFFFFF" : "FFF8FAFC"; // Zebra striping

      addedRow.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowFillColor },
        };
        cell.font = { name: "Arial", size: 10 };

        // Alignments and formats
        if (colNumber === 1 || colNumber === 7) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 2) {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        } else if (colNumber === 3 || colNumber === 4) {
          cell.alignment = { vertical: "middle", horizontal: "right" };
          cell.numFmt = "#,##0";
        } else if (colNumber === 5 || colNumber === 6) {
          cell.alignment = { vertical: "middle", horizontal: "right" };
          cell.numFmt = "0.00%";
        }

        // Highlight Rating badges
        if (colNumber === 7) {
          if (row.rating === "Excellent") {
            cell.font = { name: "Arial", bold: true, color: { argb: "FF047857" } }; // Emerald Green
          } else if (row.rating === "Very Good" || row.rating === "Good") {
            cell.font = { name: "Arial", bold: true, color: { argb: "FF1D4ED8" } }; // Blue
          } else if (row.rating === "Fair") {
            cell.font = { name: "Arial", bold: true, color: { argb: "FFB45309" } }; // Amber
          } else {
            cell.font = { name: "Arial", bold: true, color: { argb: "FFB91C1C" } }; // Red
          }
        }
      });
    });

    // Auto-fit Column Widths for Sheet 1
    sheet1.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell!((cell, rowNumber) => {
        if (rowNumber > 3) {
          // ignore title
          const val = cell.value ? cell.value.toString() : "";
          if (val.length > maxLen) maxLen = val.length;
        }
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    // 2. SHEET 2: Aggregated Period Summary
    const sheet2 = workbook.addWorksheet("Aggregated Summary");
    sheet2.views = [{ showGridLines: true }];

    // Title Row Sheet 2
    sheet2.mergeCells("A1:F1");
    const titleCell2 = sheet2.getCell("A1");
    titleCell2.value = "OAU ENVIRONMENTAL COMPLIANCE - PERIOD OVERVIEW";
    titleCell2.font = { name: "Arial", bold: true, size: 16, color: { argb: "FF10386B" } };
    titleCell2.alignment = { vertical: "middle", horizontal: "center" };
    sheet2.getRow(1).height = 40;

    sheet2.mergeCells("A2:F2");
    const subtitleCell2 = sheet2.getCell("A2");
    subtitleCell2.value = `Aggregated Performance Summary from ${startLabel} to ${endLabel}`;
    subtitleCell2.font = { name: "Arial", italic: true, size: 10, color: { argb: "FF555555" } };
    subtitleCell2.alignment = { vertical: "middle", horizontal: "center" };
    sheet2.getRow(2).height = 20;

    sheet2.getRow(3).height = 10;

    // Headers Sheet 2
    const headers2 = [
      "Faculty Name",
      "Total Staff Votes",
      "Total Student Votes",
      "Avg Inspection Score",
      "Avg Weighted Score",
      "Overall Rating",
    ];

    const headerRow2 = sheet2.addRow(headers2);
    headerRow2.height = 28;
    headerRow2.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = borderStyle;
    });

    // Write Sheet 2 Data
    aggregatedData.forEach((row, i) => {
      const addedRow = sheet2.addRow([
        row.name,
        row.staffVotes,
        row.studentVotes,
        row.avgInspection / 100,
        row.avgWeighted / 100,
        row.rating,
      ]);
      addedRow.height = 22;

      const isEven = i % 2 === 0;
      const rowFillColor = isEven ? "FFFFFFFF" : "FFF8FAFC";

      addedRow.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowFillColor },
        };
        cell.font = { name: "Arial", size: 10 };

        if (colNumber === 1) {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        } else if (colNumber === 6) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 2 || colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "right" };
          cell.numFmt = "#,##0";
        } else if (colNumber === 4 || colNumber === 5) {
          cell.alignment = { vertical: "middle", horizontal: "right" };
          cell.numFmt = "0.00%";
        }

        // Highlight Rating badges
        if (colNumber === 6) {
          if (row.rating === "Excellent") {
            cell.font = { name: "Arial", bold: true, color: { argb: "FF047857" } };
          } else if (row.rating === "Very Good" || row.rating === "Good") {
            cell.font = { name: "Arial", bold: true, color: { argb: "FF1D4ED8" } };
          } else if (row.rating === "Fair") {
            cell.font = { name: "Arial", bold: true, color: { argb: "FFB45309" } };
          } else {
            cell.font = { name: "Arial", bold: true, color: { argb: "FFB91C1C" } };
          }
        }
      });
    });

    // Auto-fit Column Widths for Sheet 2
    sheet2.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell!((cell, rowNumber) => {
        if (rowNumber > 3) {
          const val = cell.value ? cell.value.toString() : "";
          if (val.length > maxLen) maxLen = val.length;
        }
      });
      column.width = Math.max(maxLen + 4, 15);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="environmental_compliance_report_${startYear}_${startMonth}_to_${endYear}_${endMonth}.xlsx"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("GET reports error:", error);
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
