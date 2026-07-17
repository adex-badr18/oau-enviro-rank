"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileSpreadsheet,
  Building2,
  Users,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";

interface AdminSideNavProps {
  role: string | null;
}

export default function AdminSideNav({ role: initialRole }: AdminSideNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(initialRole);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!role) {
      fetch("/api/auth/role")
        .then((r) => r.json())
        .then((data) => setRole(data.role))
        .catch(() => {});
    }
  }, [role]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Inspections",
      href: "/admin/inspect",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: <FileSpreadsheet className="h-5 w-5" />,
    },
    {
      name: "Faculties",
      href: "/admin/faculties",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      superadminOnly: true,
    },
  ];

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  const toggleMobileNav = () => setIsOpen((prev) => !prev);
  const closeMobileNav = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="flex md:hidden items-center justify-between bg-[#10386b] px-4 py-3 text-white border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/oau-logo.png" alt="OAU Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">OAU EnviroRank</h1>
            <span className="text-[10px] font-semibold text-slate-350 tracking-wider uppercase">Admin Panel</span>
          </div>
        </div>
        <button
          onClick={toggleMobileNav}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav Overlay/Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeMobileNav} />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-full max-w-[280px] bg-[#10386b] text-white p-6 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img src="/oau-logo.png" alt="OAU Logo" className="h-10 w-10 object-contain" />
                <div>
                  <h1 className="text-sm font-black tracking-tight leading-none">OAU EnviroRank</h1>
                  <span className="text-[10px] font-semibold text-slate-350 tracking-wider uppercase">Admin Panel</span>
                </div>
              </div>
              <button onClick={closeMobileNav} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isUsersLocked = item.superadminOnly && role !== "superadmin";

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNav}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white/15 text-white border-l-4 border-[#fcb900] pl-3"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.name}
                    </span>
                    {isUsersLocked && (
                      <span title="Superadmin only">
                        <ShieldAlert className="h-4 w-4 text-[#fcb900]/80 shrink-0" />
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Footer with logout */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-white/60 hover:bg-rose-600/10 hover:text-rose-400 transition-all disabled:opacity-50"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidenav */}
      <div className="hidden md:flex flex-col w-[260px] bg-[#10386b] text-white shrink-0 h-screen sticky top-0 overflow-y-auto">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-white/10 flex items-center gap-4">
          <img src="/oau-logo.png" alt="OAU Logo" className="h-12 w-12 object-contain shrink-0" />
          <div>
            <h1 className="text-base font-black tracking-tight leading-none">OAU EnviroRank</h1>
            <span className="text-[10px] font-black text-slate-350 tracking-wider uppercase block mt-1">Admin Panel</span>
          </div>
        </div>

        {/* User context badge */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-900/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active Role</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
            role === "superadmin"
              ? "bg-[#fcb900]/10 text-[#fcb900] border-[#fcb900]/30"
              : "bg-slate-200/10 text-slate-300 border-slate-300/30"
          }`}>
            {role || "loading..."}
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isUsersLocked = item.superadminOnly && role !== "superadmin";

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                  isActive
                    ? "bg-white/10 text-white border-l-4 border-[#fcb900] pl-3"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.name}
                </span>
                {isUsersLocked && (
                  <span title="Superadmin only">
                    <ShieldAlert className="h-4 w-4 text-[#fcb900]/80 shrink-0" />
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white/50 hover:bg-rose-600/10 hover:text-rose-400 transition-all disabled:opacity-50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isLoggingOut ? "Logging out..." : "Log Out"}
          </button>
        </div>
      </div>
    </>
  );
}
