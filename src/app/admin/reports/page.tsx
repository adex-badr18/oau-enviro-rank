"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  Award,
  Users,
  Search,
  ClipboardList,
  Building2,
  History,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface FacultyReport {
  id: string;
  name: string;
  staffVotes: number;
  studentVotes: number;
  avgInspection: number;
  avgWeighted: number;
  rating: string;
}

interface HistoricalReport {
  id: string;
  facultyId: string;
  name: string;
  finalScore: number;
  rating: string;
  officialNormalized: number;
  staffNormalized: number;
  studentNormalized: number;
  totalStaffVotes: number;
  totalStudentVotes: number;
}

export default function AdminReportsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // State variables for Date Range selection (Live Preview)
  const [startMonth, setStartMonth] = useState(6); // Default matching seeded data month
  const [startYear, setStartYear] = useState(2026); // Default matching seeded data year
  const [endMonth, setEndMonth] = useState(6);
  const [endYear, setEndYear] = useState(2026);

  // Preview Data State
  const [previewData, setPreviewData] = useState<FacultyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Historical Snapshot State
  const [histMonth, setHistMonth] = useState(6); // Default matching seeded month
  const [histYear, setHistYear] = useState(2026); // Default matching seeded year
  const [histData, setHistData] = useState<HistoricalReport[]>([]);
  const [isHistLoading, setIsHistLoading] = useState(false);
  const [histError, setHistError] = useState<string | null>(null);
  const [histSearchQuery, setHistSearchQuery] = useState("");

  // Action status state
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch preview data function
  async function loadPreview() {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        startMonth: startMonth.toString(),
        startYear: startYear.toString(),
        endMonth: endMonth.toString(),
        endYear: endYear.toString(),
        preview: "true",
      });

      const res = await fetch(`/api/admin/reports?${queryParams.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch preview report data.");
      }

      setPreviewData(result.data || []);
    } catch (err: any) {
      setPreviewData([]);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch historical snapshot data function
  async function loadHistoricalData() {
    setIsHistLoading(true);
    setHistError(null);
    try {
      const queryParams = new URLSearchParams({
        month: histMonth.toString(),
        year: histYear.toString(),
      });
      const res = await fetch(`/api/admin/reports/history?${queryParams.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch historical snapshots.");
      }

      setHistData(result.data || []);
    } catch (err: any) {
      setHistData([]);
      setHistError(err.message || "Something went wrong.");
    } finally {
      setIsHistLoading(false);
    }
  }

  // Effects for data loading
  useEffect(() => {
    loadPreview();
  }, [startMonth, startYear, endMonth, endYear]);

  useEffect(() => {
    loadHistoricalData();
  }, [histMonth, histYear]);

  // Filters
  const filteredData = previewData.filter((row) =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistData = histData.filter((row) =>
    row.name.toLowerCase().includes(histSearchQuery.toLowerCase())
  );

  // Trigger Excel Sheet Download
  const handleDownloadExcel = () => {
    const queryParams = new URLSearchParams({
      startMonth: startMonth.toString(),
      startYear: startYear.toString(),
      endMonth: endMonth.toString(),
      endYear: endYear.toString(),
    });
    window.location.href = `/api/admin/reports?${queryParams.toString()}`;
  };

  // Trigger snapshot generation
  async function handleGenerateSnapshot() {
    setIsGenerating(true);
    setNotification(null);
    try {
      const res = await fetch("/api/calculate-monthly-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: histMonth,
          year: histYear,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to generate monthly snapshot.");
      }

      const monthName = new Date(0, histMonth - 1).toLocaleString("default", { month: "long" });
      setNotification({
        type: "success",
        message: `Environmental compliance scores for ${monthName} ${histYear} snapshotted and locked in successfully!`,
      });

      // Reload both dashboards to ensure data consistency
      loadHistoricalData();
      loadPreview();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to generate monthly snapshot.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Helper for ranking color classes
  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-450 dark:border-emerald-900";
      case "Very Good":
        return "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-450 dark:border-teal-900";
      case "Good":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-450 dark:border-blue-900";
      case "Fair":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-450 dark:border-amber-900";
      default:
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-450 dark:border-rose-900";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#10386b] dark:text-white tracking-tight">
            Compliance Reports Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate monthly snapshots, view historical ranks, and download professional Excel reports.
          </p>
        </div>

        {/* Configurations Box (Live Preview Filter) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              {/* Start Date Range */}
              <div>
                <span className="text-xs font-bold text-[#10386b] dark:text-slate-250 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Start Month
                </span>
                <div className="flex gap-2">
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(parseInt(e.target.value))}
                    className="flex-1 px-3 h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value) || startYear)}
                    className="w-24 px-3 h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 text-center focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900]"
                  />
                </div>
              </div>

              {/* End Date Range */}
              <div>
                <span className="text-xs font-bold text-[#10386b] dark:text-slate-250 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  End Month
                </span>
                <div className="flex gap-2">
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(parseInt(e.target.value))}
                    className="flex-1 px-3 h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value) || endYear)}
                    className="w-24 px-3 h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 text-center focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900]"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={previewData.length === 0}
                className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#fcb900] hover:bg-[#e2a600] text-slate-900 font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-200/50 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#10386b]"
              >
                <Download className="h-4 w-4" />
                Download Report (.xlsx)
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#10386b] dark:text-white flex items-center gap-2">
                Live Data Preview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated averages for active months in the selected period.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search faculties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#fcb900] mb-3" />
                <span className="text-sm font-semibold">Aggregating compliance scores...</span>
              </div>
            ) : error ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full mb-3">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Records Found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
                  {error}
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <ClipboardList className="h-8 w-8 text-slate-350 mb-2" />
                <span className="text-sm font-semibold">No data matches your criteria</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Name</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Staff Votes</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Student Votes</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Avg Inspection</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Final Score</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-extrabold text-[#10386b] dark:text-slate-200">
                        {row.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 text-right font-medium">
                        {row.staffVotes.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 text-right font-medium">
                        {row.studentVotes.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-800 dark:text-slate-200 text-right font-semibold">
                        {row.avgInspection.toFixed(2)}%
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-950 dark:text-white text-right font-bold">
                        {row.avgWeighted.toFixed(2)}%
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getRatingBadgeClass(row.rating)}`}>
                          {row.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Monthly Snapshots Archive Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-12">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#10386b] dark:text-white flex items-center gap-2">
                <History className="h-5 w-5 text-[#fcb900]" />
                Monthly Snapshots Archive
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Query, view, and regenerate locked-in historical compliance records from the database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Month Selector */}
              <select
                value={histMonth}
                onChange={(e) => setHistMonth(parseInt(e.target.value))}
                className="px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900]"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <input
                type="number"
                min="2000"
                max="2100"
                value={histYear}
                onChange={(e) => setHistYear(parseInt(e.target.value) || histYear)}
                className="w-20 px-3 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-700 dark:text-slate-300 text-center focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900]"
              />

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateSnapshot}
                disabled={isGenerating}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#10386b] hover:bg-[#0c2a52] text-white dark:bg-[#fcb900] dark:hover:bg-[#e2a600] dark:text-slate-900 text-xs font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Generate Snapshot
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div className={`p-4 border-b text-xs font-semibold flex items-center justify-between gap-3 ${
              notification.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" 
                : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
            }`}>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {notification.message}
              </span>
              <button 
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Filter search */}
          <div className="p-4 bg-slate-50/30 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-800 flex justify-end">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter snapshot faculties..."
                value={histSearchQuery}
                onChange={(e) => setHistSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {isHistLoading ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#fcb900] mb-3" />
                <span className="text-xs font-semibold">Fetching historical snapshots...</span>
              </div>
            ) : histError ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full mb-3">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Failed to Load</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
                  {histError}
                </p>
              </div>
            ) : filteredHistData.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <ClipboardList className="h-8 w-8 text-slate-350 mb-3" />
                <span className="text-xs font-semibold mb-1">No Snapshot Found</span>
                <p className="text-[10px] text-slate-400 max-w-xs">
                  No snapshot has been locked in for this period yet. Click "Generate Snapshot" above to calculate and save.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
                    <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-16">Rank</th>
                    <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Name</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Official (70%)</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Staff (20%)</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Student (10%)</th>
                    <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Final Score</th>
                    <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                  {filteredHistData.map((row, i) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      <td className="py-3 px-6 text-xs text-center font-extrabold text-slate-500">
                        {i + 1}
                      </td>
                      <td className="py-3 px-6 text-xs font-extrabold text-[#10386b] dark:text-slate-200">
                        {row.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 text-right font-medium">
                        {row.officialNormalized.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 text-right font-medium">
                        {row.staffNormalized.toFixed(1)}% <span className="text-slate-350 text-[10px]">({row.totalStaffVotes} votes)</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 text-right font-medium">
                        {row.studentNormalized.toFixed(1)}% <span className="text-slate-350 text-[10px]">({row.totalStudentVotes} votes)</span>
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-950 dark:text-white text-right font-bold">
                        {row.finalScore.toFixed(2)}%
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getRatingBadgeClass(row.rating)}`}>
                          {row.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
