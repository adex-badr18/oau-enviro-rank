"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Shield, Lock, Mail, Key, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const redirectTo = searchParams.get("redirectTo") || "/admin/reports";

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await (supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single() as any);

        if (profile?.role === "superadmin") {
          router.push(redirectTo);
        }
      }
    };
    checkSession();
  }, [router, supabase, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify if user is superadmin
      const { data: profile, error: profileError } = await (supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single() as any);

      if (profileError || !profile || profile.role !== "superadmin") {
        // Sign out user since they are not a superadmin
        await supabase.auth.signOut();
        throw new Error("Forbidden: Superadmin access required.");
      }

      setSuccessMsg("Authenticated successfully! Redirecting...");

      // Delay slightly for visual feedback, then redirect
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials or unauthorized access.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 animate-in fade-in slide-in-from-top-2 duration-200">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-200">
          {successMsg}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-brand-gold" /> Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full h-12 bg-slate-900/60 border border-slate-800 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold text-slate-100 placeholder-slate-650 transition-all disabled:opacity-50"
            placeholder="superadmin@oau.edu.ng"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Key className="h-3.5 w-3.5 text-brand-gold" /> Password
        </label>
        <div className="relative">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full h-12 bg-slate-900/60 border border-slate-800 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold text-slate-100 placeholder-slate-650 transition-all disabled:opacity-50"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-gold/10 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-offset-slate-950"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Verify Credentials
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative gradient glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-navy/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-brand-gold/5 blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-brand-navy via-brand-gold to-brand-navy" />

        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-navy/20 flex items-center justify-center text-brand-gold mb-4 border border-brand-navy/40">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Superadmin Sign In</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            Authorized OAU Environmental Compliance credentials required to access administration dashboard.
          </p>
        </div>

        <Suspense fallback={
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-350 transition-colors font-medium"
          >
            ← Back to Public Leaderboard
          </a>
        </div>
      </div>
    </div>
  );
}
