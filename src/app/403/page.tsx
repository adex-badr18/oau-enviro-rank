"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut, Home } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function ForbiddenPage() {
  const router = useRouter();

  const handleLogoutAndRedirect = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative gradient glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-900/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#10386b]/10 blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-[#fcb900] to-rose-600" />

        <div className="flex justify-start">
          <BackButton />
        </div>

        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-950/20 flex items-center justify-center text-rose-500 mb-6 border border-rose-900/45">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">403: Access Denied</h2>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          Your account does not possess the required Superadmin privileges to view this administrative board.
        </p>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-[#10386b] hover:bg-[#0c2a52] text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-[#10386b]/60 transition-all cursor-pointer shadow-md"
          >
            <Home className="h-4 w-4 text-[#fcb900]" />
            Return to Leaderboard
          </button>

          <button
            onClick={handleLogoutAndRedirect}
            className="w-full h-11 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            Sign in with Another Account
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Obafemi Awolowo University, Ile-Ife
          </p>
        </div>
      </div>
    </div>
  );
}
