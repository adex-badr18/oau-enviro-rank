"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";

interface Faculty {
  id: string;
  name: string;
  buildingName: string | null;
  description: string | null;
  currentScore: number;
}

export default function AdminFacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formBuildingName, setFormBuildingName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast/Notification state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/faculties");
      if (!res.ok) throw new Error("Failed to load faculties list");
      const data = await res.json();
      setFaculties(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Reset forms helper
  const resetForm = () => {
    setFormName("");
    setFormBuildingName("");
    setFormDescription("");
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (faculty: Faculty) => {
    setFormName(faculty.name);
    setFormBuildingName(faculty.buildingName || "");
    setFormDescription(faculty.description || "");
    setFormError(null);
    setEditingFaculty(faculty);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formName.trim().length < 2) {
      setFormError("Faculty name must be at least 2 characters");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          buildingName: formBuildingName.trim() || null,
          description: formDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create faculty");
      }

      showNotification(`Faculty "${formName}" created successfully!`);
      setIsCreateOpen(false);
      resetForm();
      loadFaculties();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    if (formName.trim().length < 2) {
      setFormError("Faculty name must be at least 2 characters");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/faculties/${editingFaculty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          buildingName: formBuildingName.trim() || null,
          description: formDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to update faculty");
      }

      showNotification(`Faculty details updated successfully!`);
      setEditingFaculty(null);
      resetForm();
      loadFaculties();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingFaculty) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/faculties/${deletingFaculty.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to delete faculty");
      }

      showNotification(`Faculty "${deletingFaculty.name}" and all associated audits/responses deleted.`);
      setDeletingFaculty(null);
      loadFaculties();
    } catch (err: any) {
      showNotification(err.message || "Failed to delete faculty", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredFaculties = faculties.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.buildingName && f.buildingName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900"
            : "bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-900"
        }`}>
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <img src="/oau-logo.png" alt="OAU Logo" className="h-14 w-14 object-contain shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-455 uppercase tracking-widest block">Obafemi Awolowo University, Ile-Ife</span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 text-[#fcb900] text-xs font-black uppercase tracking-wider">Admin Dashboard</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#10386b] dark:text-white tracking-tight mt-0.5">
                Manage Faculties
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Register new faculties, update building details, or manage existing records.
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2.5">
            <a
              href="/admin/inspect"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-350 transition-all duration-200"
            >
              <ClipboardList className="h-4 w-4 text-[#10386b] dark:text-[#fcb900]" />
              New Inspection
            </a>
            <a
              href="/admin/reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-350 transition-all duration-200"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#10386b] dark:text-[#fcb900]" />
              Excel Reports
            </a>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#fcb900] hover:bg-[#e2a600] text-slate-900 shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Faculty
            </button>
          </div>
        </div>

        {/* Faculties Table Area */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#10386b] dark:text-white flex items-center gap-2">
                Faculty Roster ({filteredFaculties.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                List of all registered academic faculties eligible for audits.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#fcb900] mb-3" />
                <span className="text-sm font-semibold">Loading faculties database...</span>
              </div>
            ) : error ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-8 w-8 text-rose-500 mb-3" />
                <span className="text-sm font-bold text-rose-500">{error}</span>
                <button
                  onClick={loadFaculties}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-brand-navy dark:text-[#fcb900] hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : filteredFaculties.length === 0 ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <Building2 className="h-10 w-10 text-slate-300 mb-2" />
                <span className="text-sm font-semibold">No faculties registered yet.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-250/80 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Details</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Building Location</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-24">Last Score</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                  {filteredFaculties.map((faculty) => (
                    <tr key={faculty.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="text-sm font-extrabold text-[#10386b] dark:text-slate-200 leading-tight">
                          {faculty.name}
                        </p>
                        {faculty.description && (
                          <p className="text-xs text-slate-450 dark:text-slate-500 line-clamp-1 mt-1 leading-snug">
                            {faculty.description}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-slate-550 dark:text-slate-400">
                        {faculty.buildingName || "Main Complex"}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-black text-[#10386b] dark:text-white">
                        {faculty.currentScore.toFixed(1)}%
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(faculty)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#10386b] dark:hover:text-[#fcb900] transition-colors"
                            title="Edit Faculty"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingFaculty(faculty)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors"
                            title="Delete Faculty"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* CREATE FACULTY MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-lg font-black text-brand-navy dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#fcb900]" />
                Add New Faculty
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-650 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Faculty Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Faculty of Technology"
                  className="w-full px-4 h-11 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Building / Location Name
                </label>
                <input
                  type="text"
                  value={formBuildingName}
                  onChange={(e) => setFormBuildingName(e.target.value)}
                  placeholder="e.g. Spider Building"
                  className="w-full px-4 h-11 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter details about the departments and core building complexes within this faculty..."
                  rows={4}
                  className="w-full p-4 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-bold bg-[#fcb900] hover:bg-[#e2a600] text-slate-900 rounded-xl transition-all flex items-center gap-2 shadow-md"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Register Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FACULTY MODAL */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-lg font-black text-brand-navy dark:text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#fcb900]" />
                Edit Faculty Details
              </h3>
              <button
                onClick={() => setEditingFaculty(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-440 hover:text-slate-700 dark:hover:text-slate-200 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-650 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Faculty Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Faculty of Technology"
                  className="w-full px-4 h-11 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Building / Location Name
                </label>
                <input
                  type="text"
                  value={formBuildingName}
                  onChange={(e) => setFormBuildingName(e.target.value)}
                  placeholder="e.g. Spider Building"
                  className="w-full px-4 h-11 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter details about this faculty..."
                  rows={4}
                  className="w-full p-4 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10386b] dark:focus:ring-[#fcb900] text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-5 py-2.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-bold bg-[#fcb900] hover:bg-[#e2a600] text-slate-900 rounded-xl transition-all flex items-center gap-2 shadow-md"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-250 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-155 dark:border-slate-800 flex items-center justify-between bg-rose-50/30 dark:bg-rose-950/10">
              <h3 className="text-lg font-black text-rose-600 dark:text-rose-450 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                Confirm Faculty Deletion
              </h3>
              <button
                onClick={() => setDeletingFaculty(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200 font-bold">"{deletingFaculty.name}"</strong>?
              </p>

              <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex gap-3 text-xs leading-relaxed text-rose-700 dark:text-rose-400 font-medium">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider block text-[10px] mb-1">Warning: Cascading Deletion</span>
                  Deleting this faculty will permanently remove all associated official inspections, user response polls, and monthly score history from the database. This action is irreversible.
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingFaculty(null)}
                  className="px-5 py-2.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-md"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
