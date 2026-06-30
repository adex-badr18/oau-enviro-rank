"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Building2,
  Sparkles,
  TrendingUp,
  Users,
  Search,
  FileSpreadsheet,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Crown,
  ThumbsUp,
  UserCheck,
} from "lucide-react";

interface FacultyLeaderboardItem {
  rank: number;
  id: string;
  name: string;
  buildingName: string | null;
  description: string | null;
  currentScore: number;
  rating: string;
}

interface DashboardStats {
  totalInspections: number;
  totalVotes: number;
  totalStaffVotes: number;
  totalStudentVotes: number;
  campusAverage: number;
  totalFaculties: number;
}

interface ActivePeriod {
  month: number;
  year: number;
  label: string;
}

interface LeaderboardClientProps {
  initialData: {
    activePeriod: ActivePeriod | null;
    leaderboard: FacultyLeaderboardItem[];
    stats: DashboardStats;
  };
}

export default function LeaderboardClient({ initialData }: LeaderboardClientProps) {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Poll for leaderboard updates in the background every 15 seconds
  useEffect(() => {
    setLastUpdated(new Date());
    const fetchLatestData = async (silent = true) => {
      if (!silent) setIsSyncing(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch fresh scores.");
        const updated = await res.json();
        setData(updated);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error("Polling error:", err);
        setFetchError("Ranking sync interrupted. Displaying cached scores.");
      } finally {
        if (!silent) setIsSyncing(false);
      }
    };

    const interval = setInterval(() => {
      fetchLatestData(true);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch fresh scores.");
      const updated = await res.json();
      setData(updated);
      setLastUpdated(new Date());
    } catch (err: any) {
      setFetchError("Manual sync failed. Try again in a few moments.");
    } finally {
      setIsSyncing(false);
    }
  };

  const leaderboard = data.leaderboard;
  const stats = data.stats;
  const activePeriod = data.activePeriod;

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split podium (top 3) and table list (4+)
  const topThree = leaderboard.slice(0, 3);
  const remainingRows = filteredLeaderboard.filter(
    (f) => !topThree.find((top) => top.id === f.id)
  );

  // Helper for performance rating classes
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
    <div className="w-full flex-1 flex flex-col font-sans bg-slate-50 dark:bg-slate-950">
      {/* VC's Banner Hero Section */}
      <header className="relative bg-brand-navy text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-brand-navy-light overflow-hidden">
        {/* Decorative branding elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-brand-gold/10 to-transparent rounded-full blur-3xl -mr-60 -mt-60 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-navy-light/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-white/5 border border-white/10 rounded-2xl p-3.5 inline-flex align-middle backdrop-blur-sm">
              <img src="/oau-logo.png" alt="OAU Logo" className="h-12 w-12 object-contain" />
              <div className="text-left">
                <p className="text-xs font-black tracking-wide text-brand-gold uppercase">Obafemi Awolowo University</p>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest leading-none mt-0.5">Ile-Ife, Nigeria</p>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white">
              Environmental Compliance <br className="hidden sm:inline" />
              <span className="text-brand-gold">& Cleanliness Rankings</span>
            </h1>
            <p className="mt-4 text-base text-slate-350 max-w-xl font-medium leading-relaxed">
              Driving hygiene excellence, structural preservation, and sustainable sanitation
              across all faculties. Evaluated monthly by official audits (70%) and user opinion polls (30%).
            </p>

            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
              <a
                href="/survey"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-bold transition-all duration-200 shadow-md shadow-brand-gold/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ThumbsUp className="h-4 w-4" />
                Submit Survey Poll
              </a>
              <a
                href="/admin/inspect"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold transition-all duration-200"
              >
                <UserCheck className="h-4 w-4 text-brand-gold" />
                Inspector Portal
              </a>
            </div>
          </div>

          {/* VC Quote Card */}
          <div className="w-full md:max-w-md bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-2xl relative">
            <div className="absolute top-0 right-10 -translate-y-1/2 h-8 w-8 bg-brand-gold text-brand-navy rounded-full flex items-center justify-center font-black text-xl shadow-lg select-none">
              “
            </div>
            <p className="text-sm italic text-slate-200 leading-relaxed font-medium">
              &ldquo;Cleanliness is not just a personal virtue; it is the cornerstone of our academic
              excellence and community wellbeing. By instituting this environmental compliance system,
              we empower our students and staff to co-create a healthy, pristine, and sustainable learning
              environment.&rdquo;
            </p>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-4">
              <div className="h-10 w-10 bg-brand-gold/25 rounded-full flex items-center justify-center font-black text-brand-gold shrink-0 border border-brand-gold/30">
                VC
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-white">Prof. Adebayo Simeon Bamire</p>
                <p className="text-xs text-slate-400 font-semibold">Vice Chancellor, OAU</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sync Status Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between text-xs font-semibold">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time rankings active</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Active Assessment Period: <strong className="text-brand-navy dark:text-brand-gold">{activePeriod?.label || "June 2026"}</strong></span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-slate-400">
              Synced {lastUpdated ? lastUpdated.toLocaleTimeString() : "--:--:--"}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-navy dark:text-[#fcb900] transition-colors focus:outline-none"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Now
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-10">
        {fetchError && (
          <div className="p-4 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-400 font-medium">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            <p className="text-sm">{fetchError}</p>
          </div>
        )}

        {/* Global Dashboard Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Campus average */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-705">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Campus Average</span>
              <span className="text-3xl font-black text-brand-navy dark:text-[#fcb900] block mt-1.5">
                {stats.campusAverage}%
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-1.5">
                Weighted compliance rate
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-brand-navy/5 dark:bg-brand-gold/10 text-brand-navy dark:text-[#fcb900] flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Total participating faculties */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-705">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Monitored Faculties</span>
              <span className="text-3xl font-black text-brand-navy dark:text-[#fcb900] block mt-1.5">
                {stats.totalFaculties}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-1.5">
                Active campus environments
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-brand-navy/5 dark:bg-brand-gold/10 text-brand-navy dark:text-[#fcb900] flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Total inspections */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-705">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Official Inspections</span>
              <span className="text-3xl font-black text-brand-navy dark:text-[#fcb900] block mt-1.5">
                {stats.totalInspections} <span className="text-xs font-semibold text-slate-400">/ {stats.totalFaculties}</span>
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-1.5">
                Committee audits logged
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-brand-navy/5 dark:bg-brand-gold/10 text-brand-navy dark:text-[#fcb900] flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Total votes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-705">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Voter Feedback</span>
              <span className="text-3xl font-black text-brand-navy dark:text-[#fcb900] block mt-1.5">
                {stats.totalVotes.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-1.5">
                {stats.totalStudentVotes} students | {stats.totalStaffVotes} staff
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-brand-navy/5 dark:bg-brand-gold/10 text-brand-navy dark:text-[#fcb900] flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* TOP 3 PODIUM */}
        <section className="flex flex-col items-center">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-brand-navy dark:text-white flex items-center justify-center gap-2">
              <Award className="h-6 w-6 text-brand-gold" />
              Monthly Compliance Podium
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Honoring the highest-scoring environments for {activePeriod?.label || "June 2026"}.
            </p>
          </div>

          {topThree.length === 0 ? (
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-12 px-6 rounded-3xl text-center text-slate-400 font-medium">
              No faculty scores logged yet. Be the first to audit!
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-0 mt-8">
              {/* 2ND PLACE (SILVER) - Left */}
              {topThree[1] && (
                <div className="w-full sm:w-1/3 flex flex-col items-center order-2 sm:order-1 animate-in slide-in-from-bottom duration-500">
                  {/* Faculty Card Info */}
                  <div className="text-center px-4 mb-4">
                    <p className="text-sm font-extrabold text-[#10386b] dark:text-white line-clamp-1">{topThree[1].name}</p>
                    <p className="text-2xl font-black text-slate-650 mt-1">{topThree[1].currentScore}%</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border mt-1.5 ${getRatingBadgeClass(topThree[1].rating)}`}>
                      {topThree[1].rating}
                    </span>
                  </div>
                  {/* Podium Pillar */}
                  <div className="w-full bg-gradient-to-b from-slate-200 to-slate-350 dark:from-slate-800 dark:to-slate-900 border-t-2 border-slate-300 dark:border-slate-700 h-[130px] rounded-t-3xl shadow-lg flex flex-col items-center justify-between py-6">
                    <span className="text-slate-500 dark:text-slate-400 font-extrabold text-sm uppercase tracking-widest">2nd Place</span>
                    <div className="h-10 w-10 bg-white/20 dark:bg-black/25 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center font-black text-xl border border-white/25">
                      2
                    </div>
                  </div>
                </div>
              )}

              {/* 1ST PLACE (GOLD) - Center */}
              {topThree[0] && (
                <div className="w-full sm:w-[36%] flex flex-col items-center order-1 sm:order-2 z-10 animate-in slide-in-from-bottom duration-700">
                  {/* Crown Icon */}
                  <div className="h-10 w-10 text-brand-gold flex items-center justify-center animate-bounce mb-1">
                    <Crown className="h-8 w-8 fill-brand-gold" />
                  </div>
                  {/* Faculty Card Info */}
                  <div className="text-center px-4 mb-4">
                    <p className="text-base font-black text-brand-navy dark:text-white line-clamp-1">{topThree[0].name}</p>
                    <p className="text-3xl font-black text-brand-gold mt-1">{topThree[0].currentScore}%</p>
                    <span className={`inline-flex px-3.5 py-1 rounded-full text-xs font-black border mt-1.5 ${getRatingBadgeClass(topThree[0].rating)}`}>
                      {topThree[0].rating}
                    </span>
                  </div>
                  {/* Podium Pillar */}
                  <div className="w-full bg-gradient-to-b from-amber-400 to-[#fcb900] border-t-4 border-[#fff3d1] h-[170px] rounded-t-[32px] shadow-2xl flex flex-col items-center justify-between py-8">
                    <span className="text-brand-navy font-black text-sm uppercase tracking-widest">Champion</span>
                    <div className="h-12 w-12 bg-brand-navy text-brand-gold rounded-full flex items-center justify-center font-black text-2xl border-2 border-brand-gold shadow-lg">
                      1
                    </div>
                  </div>
                </div>
              )}

              {/* 3RD PLACE (BRONZE) - Right */}
              {topThree[2] && (
                <div className="w-full sm:w-1/3 flex flex-col items-center order-3 sm:order-3 animate-in slide-in-from-bottom duration-300">
                  {/* Faculty Card Info */}
                  <div className="text-center px-4 mb-4">
                    <p className="text-sm font-extrabold text-[#10386b] dark:text-white line-clamp-1">{topThree[2].name}</p>
                    <p className="text-2xl font-black text-amber-700 dark:text-amber-500 mt-1">{topThree[2].currentScore}%</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border mt-1.5 ${getRatingBadgeClass(topThree[2].rating)}`}>
                      {topThree[2].rating}
                    </span>
                  </div>
                  {/* Podium Pillar */}
                  <div className="w-full bg-gradient-to-b from-amber-600 to-amber-800 dark:from-amber-900/60 dark:to-amber-950 border-t-2 border-amber-550 h-[100px] rounded-t-3xl shadow-lg flex flex-col items-center justify-between py-5">
                    <span className="text-amber-200 dark:text-amber-450 font-extrabold text-xs uppercase tracking-widest">3rd Place</span>
                    <div className="h-8 w-8 bg-white/10 dark:bg-black/25 text-amber-100 rounded-full flex items-center justify-center font-black text-base border border-white/20">
                      3
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* DETAILED RANKINGS TABLE */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          {/* Controls Panel */}
          <div className="p-6 bg-slate-50/50 dark:bg-slate-850/30 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-brand-navy dark:text-white">All Faculty Rankings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete dynamic directory of Obafemi Awolowo University faculties.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search faculties by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-11 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredLeaderboard.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <Building2 className="h-10 w-10 text-slate-300 mb-2" />
                <span className="text-sm font-semibold">No faculties match your search</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-250/80 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-20 text-center">Rank</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Details</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Building Location</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-44">Weighted score bar</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-24">Score</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-28">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                  {filteredLeaderboard.map((row) => {
                    const isPodium = row.rank <= 3;
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors ${
                          isPodium ? "bg-slate-50/15 dark:bg-slate-900/5" : ""
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-black ${
                              row.rank === 1
                                ? "bg-brand-gold text-brand-navy"
                                : row.rank === 2
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : row.rank === 3
                                ? "bg-amber-600/15 text-amber-700 dark:text-amber-500"
                                : "text-slate-500"
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>

                        {/* Faculty Details */}
                        <td className="py-4 px-6">
                          <p className="text-sm font-extrabold text-[#10386b] dark:text-slate-200 leading-tight">
                            {row.name}
                          </p>
                          {row.description && (
                            <p className="text-xs text-slate-450 dark:text-slate-500 line-clamp-1 mt-1 leading-snug">
                              {row.description}
                            </p>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-4 px-6 hidden md:table-cell text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {row.buildingName || "Main Complex"}
                        </td>

                        {/* Score progress bar */}
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                row.currentScore >= 85
                                  ? "bg-emerald-500"
                                  : row.currentScore >= 70
                                  ? "bg-[#10386b]"
                                  : row.currentScore >= 55
                                  ? "bg-brand-gold"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${row.currentScore}%` }}
                            />
                          </div>
                        </td>

                        {/* Numeric score */}
                        <td className="py-4 px-6 text-right text-sm font-black text-[#10386b] dark:text-white">
                          {row.currentScore.toFixed(2)}%
                        </td>

                        {/* Rating Badge */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getRatingBadgeClass(
                              row.rating
                            )}`}
                          >
                            {row.rating}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer Actions */}
          <div className="p-6 bg-slate-50/30 dark:bg-slate-850/10 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
            <span className="text-slate-400">
              Showing {filteredLeaderboard.length} of {leaderboard.length} faculties
            </span>
            <div className="flex gap-2">
              <a
                href="/admin/reports"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-brand-navy dark:text-[#fcb900]" />
                Reports Board
              </a>
            </div>
          </div>
        </section>

        {/* INITIATIVE DETAILS */}
        <section className="bg-gradient-to-r from-brand-navy to-brand-navy-light rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl border border-brand-navy-light">
          {/* Decors */}
          <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-brand-gold/5 blur-2xl pointer-events-none" />

          <div className="w-full relative z-10 flex flex-col gap-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold text-xs font-bold uppercase tracking-wider self-start">
              Compliance Framework
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Understanding the Cleanliness & Compliance Framework
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Our campus monitoring operations are built on a rigorous weighted framework that captures both administrative oversight and constituent experiences. The ranking index compiles monthly:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-2xl font-black text-brand-gold block">70%</span>
                <span className="text-xs font-extrabold uppercase block mt-1">Official Committee Audit</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                  Direct physical inspections conducted by the Senate-appointed Inspection Committee, analyzing structural maintenance, conveniencies, and litter control.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-2xl font-black text-brand-gold block">20%</span>
                <span className="text-xs font-extrabold uppercase block mt-1">Staff Opinion Poll</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                  Direct hygiene ratings submitted by academic and non-academic staff members, evaluating their work environments.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-2xl font-black text-brand-gold block">10%</span>
                <span className="text-xs font-extrabold uppercase block mt-1">Student Feedback</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                  Survey feedback logged by enrolled students sharing experiences regarding restroom sanitation, campus landscaping, and waste disposal.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 px-4 border-t border-slate-950/40 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/oau-logo.png" alt="OAU Logo" className="h-9 w-9 object-contain" />
            <div className="text-left">
              <span className="font-extrabold uppercase tracking-wider text-slate-300 block">
                Obafemi Awolowo University, Ile-Ife
              </span>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider leading-none mt-1">
                Environmental Compliance & Cleanliness Index
              </span>
            </div>
          </div>

          <p className="font-medium text-center md:text-right">
            &copy; {new Date().getFullYear()} Obafemi Awolowo University, Ile-Ife. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
