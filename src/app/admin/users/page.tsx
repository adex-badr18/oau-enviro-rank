"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Shield, Loader2, AlertCircle, CheckCircle2,
  Eye, EyeOff, RefreshCw, Mail, Key, UserCheck, UserX,
  ClipboardList, Building2, FileSpreadsheet,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  role: "superadmin" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*()-_=+[]{}";
  const all = upper + lower + digits + symbols;
  const arr = new Uint32Array(18);
  crypto.getRandomValues(arr);
  let pwd =
    upper[arr[0] % upper.length] +
    lower[arr[1] % lower.length] +
    digits[arr[2] % digits.length] +
    symbols[arr[3] % symbols.length];
  for (let i = 4; i < 18; i++) pwd += all[arr[i] % all.length];
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function AdminUsersPage() {
  const router = useRouter();

  // Session guard
  useEffect(() => {
    fetch("/api/auth/role")
      .then((r) => r.json())
      .then((d) => { if (d.role !== "superadmin") router.push("/admin/reports"); })
      .catch(() => router.push("/login"));
  }, [router]);

  // Users list state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load users.");
      setUsers(data.users || []);
    } catch (e: any) {
      setUsersError(e.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function openDialog() {
    setFormEmail("");
    setFormPassword("");
    setShowPassword(false);
    setFormError("");
    setFormSuccess("");
    setDialogOpen(true);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmail || !formPassword) { setFormError("All fields are required."); return; }
    if (formPassword.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail, password: formPassword, role: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user.");
      setFormSuccess(`Account created for ${data.user.email}`);
      setFormEmail("");
      setFormPassword("");
      loadUsers();
      setTimeout(() => setDialogOpen(false), 1600);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(user: UserProfile) {
    setTogglingId(user.id);
    setNotification(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed.");
      setNotification({ type: "success", message: data.message });
      loadUsers();
    } catch (e: any) {
      setNotification({ type: "error", message: e.message });
    } finally {
      setTogglingId(null);
    }
  }

  const superadmin = users.find((u) => u.role === "superadmin");
  const adminUsers = users.filter((u) => u.role !== "superadmin");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <img src="/oau-logo.png" alt="OAU Logo" className="h-14 w-14 object-contain shrink-0" />
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Obafemi Awolowo University, Ile-Ife
              </span>
              <h1 className="text-3xl font-extrabold text-[#10386b] dark:text-white tracking-tight mt-0.5 flex items-center gap-2">
                <Users className="h-7 w-7 text-[#fcb900]" /> User Management
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create admin accounts, and manage access to the system.
              </p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {[
              { href: "/admin/reports", icon: <FileSpreadsheet className="h-4 w-4" />, label: "Reports" },
              { href: "/admin/faculties", icon: <Building2 className="h-4 w-4" />, label: "Faculties" },
              { href: "/admin/inspect", icon: <ClipboardList className="h-4 w-4" />, label: "Inspect" },
            ].map((link) => (
              <a key={link.href} href={link.href}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 transition-all">
                <span className="text-[#10386b] dark:text-[#fcb900]">{link.icon}</span>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
          }`}>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {notification.message}
            </span>
            <button onClick={() => setNotification(null)} className="text-current opacity-60 hover:opacity-100 font-bold px-1">×</button>
          </div>
        )}

        {/* Users table card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#10386b] dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#fcb900]" /> All Accounts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {users.length} account{users.length !== 1 ? "s" : ""} in the system
              </p>
            </div>
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fcb900] hover:bg-[#e2a600] text-slate-900 font-bold text-sm transition-all shadow-md shadow-amber-200/40 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#10386b]"
            >
              <Plus className="h-4 w-4" /> Create New User
            </button>
          </div>

          {/* Table body */}
          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#fcb900] mb-3" />
                <span className="text-sm font-semibold">Loading accounts...</span>
              </div>
            ) : usersError ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full mb-3">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{usersError}</p>
                <button onClick={loadUsers} className="mt-4 text-xs font-bold text-[#10386b] dark:text-[#fcb900] flex items-center gap-1 hover:underline">
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No accounts found</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                    {["Email Address", "Role", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className={`py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* Superadmin row first */}
                  {superadmin && (
                    <tr className="bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[#fcb900] shrink-0" />
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{superadmin.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                          <Shield className="h-3 w-3" /> Superadmin
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                          <UserCheck className="h-3 w-3" /> Active
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{formatDate(superadmin.createdAt)}</td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-xs text-slate-400 italic">—</span>
                      </td>
                    </tr>
                  )}

                  {/* Admin rows */}
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          Admin
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                            <UserCheck className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
                            <UserX className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{formatDate(user.createdAt)}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggle(user)}
                          disabled={togglingId === user.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                            user.isActive
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                          }`}
                        >
                          {togglingId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : user.isActive ? (
                            <><UserX className="h-3 w-3" /> Deactivate</>
                          ) : (
                            <><UserCheck className="h-3 w-3" /> Activate</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#10386b] via-[#fcb900] to-[#10386b]" />
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#10386b]/10 dark:bg-[#fcb900]/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-[#10386b] dark:text-[#fcb900]" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-center text-slate-900 dark:text-white">
                Create Admin Account
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-slate-500 dark:text-slate-400">
                The new account will have <strong>Admin</strong> role with access to inspections and reports.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {formSuccess}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#fcb900]" /> Email Address
                </label>
                <input
                  id="create-user-email"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={formLoading}
                  placeholder="admin@oauife.edu.ng"
                  className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-[#fcb900]" /> Password
                </label>
                <div className="relative">
                  <input
                    id="create-user-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    disabled={formLoading}
                    placeholder="Minimum 8 characters"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 pr-11 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { const p = generateStrongPassword(); setFormPassword(p); setShowPassword(true); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#10386b] dark:text-[#fcb900] hover:underline mt-1"
                >
                  <RefreshCw className="h-3 w-3" /> Generate Strong Password
                </button>
              </div>

              {/* Role (display only) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Role</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  Admin
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  disabled={formLoading}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 h-11 rounded-xl bg-[#10386b] hover:bg-[#0c2a52] dark:bg-[#fcb900] dark:hover:bg-[#e2a600] text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Create Account</>}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
