"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Shield, Loader2, AlertCircle, CheckCircle2,
  Eye, EyeOff, RefreshCw, Mail, Key, UserCheck, UserX,
  Lock, ArrowLeft, ShieldAlert, User, Edit2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

interface UserProfile {
  id: string;
  email: string;
  role: "superadmin" | "admin";
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PasswordRules {
  length: boolean;
  upper: boolean;
  number: boolean;
  special: boolean;
}

function checkPasswordRules(pass: string): PasswordRules {
  return {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[!@#$%^&*()\-_\=\+\[\]\{\}]/.test(pass),
  };
}

function calculateStrength(rules: PasswordRules): { score: number; label: string; color: string } {
  const metCount = Object.values(rules).filter(Boolean).length;
  if (metCount === 0) return { score: 0, label: "None", color: "bg-slate-200 dark:bg-slate-800" };
  if (metCount === 1) return { score: 25, label: "Weak", color: "bg-rose-500" };
  if (metCount === 2) return { score: 50, label: "Fair", color: "bg-amber-500" };
  if (metCount === 3) return { score: 75, label: "Good", color: "bg-blue-500" };
  return { score: 100, label: "Strong", color: "bg-emerald-500" };
}

function PasswordFeedback({ value }: { value: string }) {
  if (!value) return null;
  const rules = checkPasswordRules(value);
  const { score, label, color } = calculateStrength(rules);

  const checklist = [
    { label: "Minimum 8 characters", met: rules.length },
    { label: "At least one uppercase letter", met: rules.upper },
    { label: "At least one number", met: rules.number },
    { label: "At least one special character", met: rules.special },
  ];

  return (
    <div className="space-y-3 mt-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
      {/* Strength Indicator */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <span>Password Strength</span>
          <span className="font-extrabold uppercase tracking-wider" style={{ color: score === 100 ? '#10b981' : undefined }}>{label}</span>
        </div>
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${score}%` }} />
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
        {checklist.map((rule, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className={`shrink-0 flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-black ${
              rule.met 
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" 
                : "bg-slate-200 text-slate-400 dark:bg-slate-850 dark:text-slate-500"
            }`}>
              {rule.met ? "✓" : "✗"}
            </span>
            <span className={rule.met ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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

  // Session role state
  const [role, setRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // Users list state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Creation Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [editFormSuccess, setEditFormSuccess] = useState("");

  // Toggle/Activation state
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Session guard
  useEffect(() => {
    fetch("/api/auth/role")
      .then((r) => r.json())
      .then((d) => {
        setRole(d.role);
        setCurrentUserId(d.userId);
        if (!d.role) {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setCheckingRole(false));
  }, [router]);

  const loadUsers = useCallback(async () => {
    if (role !== "superadmin") return;
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
  }, [role]);

  useEffect(() => {
    if (role === "superadmin") {
      loadUsers();
    }
  }, [role, loadUsers]);

  function openDialog() {
    setFormEmail("");
    setFormPassword("");
    setFormFirstName("");
    setFormLastName("");
    setShowPassword(false);
    setFormError("");
    setFormSuccess("");
    setDialogOpen(true);
  }

  function handleEditClick(user: UserProfile) {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditPassword("");
    setEditShowPassword(false);
    setEditFormError("");
    setEditFormSuccess("");
    setEditDialogOpen(true);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmail || !formPassword) { setFormError("Email and Password are required."); return; }
    
    // Validate password rules client side
    const rules = checkPasswordRules(formPassword);
    if (!rules.length || !rules.upper || !rules.number || !rules.special) {
      setFormError("Password must meet all complexity requirements.");
      return;
    }

    setFormLoading(true);
    setFormError("");
    setFormSuccess("");
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formEmail, 
          password: formPassword, 
          role: "admin",
          firstName: formFirstName || null,
          lastName: formLastName || null
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user.");
      setFormSuccess(`Account created successfully for ${data.user.email}`);
      setFormEmail("");
      setFormPassword("");
      setFormFirstName("");
      setFormLastName("");
      loadUsers();
      setTimeout(() => setDialogOpen(false), 1600);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    if (!editEmail) { setEditFormError("Email address is required."); return; }

    // Validate password rules if provided
    if (editPassword) {
      const rules = checkPasswordRules(editPassword);
      if (!rules.length || !rules.upper || !rules.number || !rules.special) {
        setEditFormError("Password must meet all complexity requirements.");
        return;
      }
    }

    setEditFormLoading(true);
    setEditFormError("");
    setEditFormSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail,
          password: editPassword || undefined,
          firstName: editFirstName || null,
          lastName: editLastName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile.");
      
      if (data.requiresReLogin) {
        setEditFormSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          setEditDialogOpen(false);
          router.push("/login");
        }, 1600);
        return;
      }

      setEditFormSuccess("Profile updated successfully!");

      // If updating current logged-in superadmin, sync context
      if (editingUser.id === currentUserId) {
        fetch("/api/auth/role")
          .then((r) => r.json())
          .then((d) => {
            setRole(d.role);
            setCurrentUserId(d.userId);
          });
      }

      loadUsers();
      setTimeout(() => setEditDialogOpen(false), 1600);
    } catch (e: any) {
      setEditFormError(e.message);
    } finally {
      setEditFormLoading(false);
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

  // Loader state when verifying authorization
  if (checkingRole) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-[#fcb900] mb-3" />
        <span className="text-sm font-semibold">Authenticating user access...</span>
      </div>
    );
  }

  // Access Denied View
  if (role !== "superadmin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 mb-6 border border-rose-100 dark:border-rose-900">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Access Denied
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Only the system superadministrator has permissions to access user management features.
          </p>
          <div className="mt-8">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#10386b] hover:bg-[#0c2a52] text-white font-bold text-sm transition-all duration-200 shadow-md shadow-slate-200 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const superadmin = users.find((u) => u.role === "superadmin");
  const adminUsers = users.filter((u) => u.role !== "superadmin");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full">
        <BackButton />

        {/* Title Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#10386b] dark:text-white tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-[#fcb900]" /> User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create admin accounts, edit details, and manage access to the system.
          </p>
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
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
                    {["User details", "Role", "Status", "Created", "Actions"].map((h) => (
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
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-[#fcb900]/10 flex items-center justify-center shrink-0 border border-amber-500/20 dark:border-[#fcb900]/20">
                            <Shield className="h-4.5 w-4.5 text-[#fcb900]" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {superadmin.firstName || superadmin.lastName ? (
                                <span>{[superadmin.firstName, superadmin.lastName].filter(Boolean).join(" ")}</span>
                              ) : (
                                <span className="text-amber-600/70 dark:text-[#fcb900]/70 italic font-normal">Superadmin (No Name)</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{superadmin.email}</span>
                          </div>
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
                        <button
                          onClick={() => handleEditClick(superadmin)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350 dark:border-slate-700"
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit Profile
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Admin rows */}
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            <User className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {user.firstName || user.lastName ? (
                                <span>{[user.firstName, user.lastName].filter(Boolean).join(" ")}</span>
                              ) : (
                                <span className="text-slate-400 italic font-normal">No Name Provided</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{user.email}</span>
                          </div>
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
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350 dark:border-slate-700"
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </button>
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
                        </div>
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
            <DialogHeader className="mb-5">
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

            <form onSubmit={handleCreateUser} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
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

              {/* Names row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#fcb900]" /> First Name
                  </label>
                  <input
                    id="create-first-name"
                    type="text"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    disabled={formLoading}
                    placeholder="Optional"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#fcb900]" /> Last Name
                  </label>
                  <input
                    id="create-last-name"
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    disabled={formLoading}
                    placeholder="Optional"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

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
                    placeholder="Enter secure password"
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
                <PasswordFeedback value={formPassword} />
                <button
                  type="button"
                  onClick={() => { const p = generateStrongPassword(); setFormPassword(p); setShowPassword(true); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#10386b] dark:text-[#fcb900] hover:underline mt-1.5"
                >
                  <RefreshCw className="h-3 w-3 animate-pulse" /> Generate Strong Password
                </button>
              </div>

              {/* Role (display only) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Role</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  Admin
                </span>
              </div>

              <div className="flex gap-3 pt-2">
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#10386b] via-[#fcb900] to-[#10386b]" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#10386b]/10 dark:bg-[#fcb900]/10 flex items-center justify-center mb-3">
                <Edit2 className="h-6 w-6 text-[#10386b] dark:text-[#fcb900]" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-center text-slate-900 dark:text-white">
                {editingUser?.id === currentUserId ? "Edit Your Profile" : "Edit Admin Account"}
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-slate-500 dark:text-slate-400">
                {editingUser?.id === currentUserId 
                  ? "Update your personal profile details and security credentials." 
                  : "Modify email address, names, and credentials for this administrator."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditUser} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
              {editFormError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {editFormError}
                </div>
              )}
              {editFormSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {editFormSuccess}
                </div>
              )}

              {/* Names row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#fcb900]" /> First Name
                  </label>
                  <input
                    id="edit-first-name"
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    disabled={editFormLoading}
                    placeholder="Optional"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#fcb900]" /> Last Name
                  </label>
                  <input
                    id="edit-last-name"
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    disabled={editFormLoading}
                    placeholder="Optional"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#fcb900]" /> Email Address
                </label>
                <input
                  id="edit-user-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={editFormLoading}
                  placeholder="admin@oauife.edu.ng"
                  className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-[#fcb900]" /> New Password
                </label>
                <div className="relative">
                  <input
                    id="edit-user-password"
                    type={editShowPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    disabled={editFormLoading}
                    placeholder="Leave blank to keep current password"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 pr-11 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setEditShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                    aria-label={editShowPassword ? "Hide password" : "Show password"}
                  >
                    {editShowPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                <PasswordFeedback value={editPassword} />
                {editPassword && (
                  <button
                    type="button"
                    onClick={() => { const p = generateStrongPassword(); setEditPassword(p); setEditShowPassword(true); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#10386b] dark:text-[#fcb900] hover:underline mt-1.5"
                  >
                    <RefreshCw className="h-3 w-3 animate-pulse" /> Generate Strong Password
                  </button>
                )}
              </div>

              {/* Role Info Box */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Role</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {editingUser?.role}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={editFormLoading}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editFormLoading}
                  className="flex-1 h-11 rounded-xl bg-[#10386b] hover:bg-[#0c2a52] dark:bg-[#fcb900] dark:hover:bg-[#e2a600] text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
                >
                  {editFormLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
