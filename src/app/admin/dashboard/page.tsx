"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  ClipboardList,
  Vote,
  TrendingUp,
  Award,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trophy,
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface LeaderboardItem {
  rank: number;
  id: string;
  name: string;
  buildingName: string | null;
  description: string | null;
  currentScore: number;
  rating: string;
}

interface DashboardData {
  activePeriod: {
    month: number;
    year: number;
    label: string;
  } | null;
  leaderboard: LeaderboardItem[];
  stats: {
    totalInspections: number;
    totalVotes: number;
    totalStaffVotes: number;
    totalStudentVotes: number;
    campusAverage: number;
    totalFaculties: number;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>((now.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString());

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?month=${selectedMonth}&year=${selectedYear}`);
      if (!res.ok) {
        throw new Error("Failed to load dashboard data.");
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "An error occurred fetching dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    // Prevent going back to login by pushing a history state
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Re-push state to keep the user on this page
      window.history.pushState(null, "", window.location.href);
      // Reload the Admin Dashboard
      window.location.reload();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-emerald-100 text-emerald-855 border-emerald-355 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
      case "Very Good":
        return "bg-teal-100 text-teal-855 border-teal-355 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900";
      case "Good":
        return "bg-blue-105 text-blue-855 border-blue-355 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900";
      case "Fair":
        return "bg-amber-105 text-amber-855 border-amber-355 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-905";
      default:
        return "bg-rose-105 text-rose-855 border-rose-355 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-905";
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-500 text-white dark:bg-amber-500";
      case 2:
        return "bg-slate-400 text-white dark:bg-slate-400";
      case 3:
        return "bg-amber-700 text-white dark:bg-amber-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/oau-logo.png" alt="OAU Logo" className="h-14 w-14 object-contain shrink-0" />
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Obafemi Awolowo University, Ile-Ife
              </span>
              <h1 className="text-3xl font-extrabold text-[#10386b] dark:text-white tracking-tight mt-0.5 flex items-center gap-2">
                <LayoutDashboard className="h-7 w-7 text-[#fcb900]" /> Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Live environment performance aggregates and monthly leaderboard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold text-slate-700 dark:text-slate-350 font-bold"
            >
              {[
                { val: "1", label: "January" },
                { val: "2", label: "February" },
                { val: "3", label: "March" },
                { val: "4", label: "April" },
                { val: "5", label: "May" },
                { val: "6", label: "June" },
                { val: "7", label: "July" },
                { val: "8", label: "August" },
                { val: "9", label: "September" },
                { val: "10", label: "October" },
                { val: "11", label: "November" },
                { val: "12", label: "December" },
              ].map((m) => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold text-slate-700 dark:text-slate-350 font-bold"
            >
              {["2025", "2026", "2027", "2028"].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 h-10 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-350 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin text-[#fcb900] mb-3" />
            <span className="text-sm font-semibold">Loading dashboard indicators...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="inline-flex p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full mb-3">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Failed to load dashboard</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-6 px-5 py-2.5 bg-[#10386b] text-white rounded-xl text-xs font-bold hover:bg-[#0c2a52] transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Faculties */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-[#10386b] dark:text-blue-400 rounded-2xl">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Faculties</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white mt-0.5 block">
                    {data?.stats.totalFaculties || 0}
                  </span>
                </div>
              </div>

              {/* Assessment Period */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-[#fcb900] dark:text-[#fcb900] rounded-2xl">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active Period</span>
                  <span className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 block truncate">
                    {data?.activePeriod?.label || "None Active"}
                  </span>
                </div>
              </div>

              {/* Monthly Inspections */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Audit Reports</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white mt-0.5 block">
                    {data?.stats.totalInspections || 0}
                  </span>
                </div>
              </div>

              {/* Survey Responses */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <Vote className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">User Opinions</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white mt-0.5 block">
                    {data?.stats.totalVotes || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Campus Average Banner */}
            <div className="bg-gradient-to-r from-[#10386b] to-[#1b4d8f] text-white p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#fcb900]" /> Campus-Wide Performance
                </h3>
                <p className="text-xs text-slate-250 mt-1 max-w-xl">
                  Recalculated monthly weighted performance indexes including Committee Inspections (70%), Staff Opinions (20%), and Student Opinion Polls (10%).
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end justify-center bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-350 tracking-wider">Campus Average Score</span>
                <span className="text-3xl font-black text-[#fcb900] mt-0.5">
                  {data?.stats.campusAverage.toFixed(1) || "0.0"}%
                </span>
              </div>
            </div>

            {/* Leaderboard Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <Trophy className="h-6 w-6 text-[#fcb900] shrink-0" />
                <div>
                  <h2 className="text-lg font-bold text-[#10386b] dark:text-white">
                    Faculty Environmental Leaderboard
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Faculty ranks ordered by environmental audit score descending.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                      {["Rank", "Faculty Details", "Location", "Overall Score", "Rating"].map((h) => (
                        <th
                          key={h}
                          className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data?.leaderboard.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                        <td className="py-4 px-6 shrink-0">
                          <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-black shrink-0 ${getRankBadgeClass(item.rank)}`}>
                            {item.rank}
                          </span>
                        </td>
                        <td className="py-4 px-6 min-w-[240px]">
                          <p className="text-sm font-extrabold text-[#10386b] dark:text-slate-200 leading-tight">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-450 dark:text-slate-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.buildingName || "Main Complex"}
                        </td>
                        <td className="py-4 px-6 text-sm font-black text-[#10386b] dark:text-white">
                          {item.currentScore.toFixed(1)}%
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRatingBadgeClass(item.rating)}`}>
                            {item.rating}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
