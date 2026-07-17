"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Shared form fields — defined OUTSIDE the page component so React always
// sees this as the same component type. If defined inside, every parent
// re-render (e.g. each keystroke) creates a new function reference, causing
// React to unmount + remount the fields and lose input focus.
// ---------------------------------------------------------------------------
interface FacultyFormFieldsProps {
  formError: string | null;
  formName: string;
  setFormName: (v: string) => void;
  formBuildingName: string;
  setFormBuildingName: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
}

function FacultyFormFields({
  formError,
  formName,
  setFormName,
  formBuildingName,
  setFormBuildingName,
  formDescription,
  setFormDescription,
}: FacultyFormFieldsProps) {
  return (
    <div className="p-6 flex flex-col gap-4">
      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div>
        <Label htmlFor="faculty-name">
          Faculty Name <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="faculty-name"
          type="text"
          required
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g. Faculty of Technology"
        />
      </div>

      <div>
        <Label htmlFor="faculty-building">Building / Location Name</Label>
        <Input
          id="faculty-building"
          type="text"
          value={formBuildingName}
          onChange={(e) => setFormBuildingName(e.target.value)}
          placeholder="e.g. Spider Building"
        />
      </div>

      <div>
        <Label htmlFor="faculty-description">Description</Label>
        <Textarea
          id="faculty-description"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Enter details about the departments and core building complexes within this faculty..."
          rows={4}
        />
      </div>
    </div>
  );
}

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

  // Modal open states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active faculty targets
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);

  // Shared form state
  const [formName, setFormName] = useState("");
  const [formBuildingName, setFormBuildingName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setFormName("");
    setFormBuildingName("");
    setFormDescription("");
    setFormError(null);
  };

  // --- Handlers ---

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
    setIsEditOpen(true);
  };

  const handleOpenDelete = (faculty: Faculty) => {
    setDeletingFaculty(faculty);
    setIsDeleteOpen(true);
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
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create faculty");
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
      if (!res.ok) throw new Error(data.message || data.error || "Failed to update faculty");
      showNotification(`Faculty details updated successfully!`);
      setIsEditOpen(false);
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
      if (!res.ok) throw new Error(data.message || data.error || "Failed to delete faculty");
      showNotification(
        `Faculty "${deletingFaculty.name}" and all associated data deleted.`
      );
      setIsDeleteOpen(false);
      setDeletingFaculty(null);
      loadFaculties();
    } catch (err: any) {
      showNotification(err.message || "Failed to delete faculty", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredFaculties = faculties.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.buildingName &&
        f.buildingName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ---- Shared form fields rendered by stable external component ----

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-900"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#10386b] dark:text-white tracking-tight mt-0.5">
              Manage Faculties
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Register new faculties, update building details, or manage existing records.
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="default" className="self-start md:self-auto">
            <Plus className="h-4 w-4" />
            Add Faculty
          </Button>
        </div>

        {/* Faculties Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
          {/* Table Controls */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2">
                Faculty Roster ({filteredFaculties.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                List of all registered academic faculties eligible for audits.
              </p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-brand-gold mb-3" />
              <span className="text-sm font-semibold">Loading faculties database...</span>
            </div>
          ) : error ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-8 w-8 text-rose-500 mb-3" />
              <span className="text-sm font-bold text-rose-500">{error}</span>
              <button
                onClick={loadFaculties}
                className="mt-4 px-4 py-2 text-xs font-semibold text-brand-navy dark:text-brand-gold hover:underline"
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
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="min-w-[220px]">Faculty Details</TableHead>
                  <TableHead className="min-w-[160px]">Building Location</TableHead>
                  <TableHead className="text-right w-28 shrink-0">Last Score</TableHead>
                  <TableHead className="text-center w-32 shrink-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculties.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="min-w-[220px]">
                      <p className="text-sm font-extrabold text-brand-navy dark:text-slate-200 leading-tight">
                        {faculty.name}
                      </p>
                      {faculty.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-1 mt-1 leading-snug">
                          {faculty.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[160px] text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {faculty.buildingName || "Main Complex"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-black text-brand-navy dark:text-white">
                      {faculty.currentScore.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(faculty)}
                          title="Edit Faculty"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(faculty)}
                          title="Delete Faculty"
                          className="hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── CREATE FACULTY MODAL ─────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader>
            <DialogTitle>
              <Building2 className="h-5 w-5 text-brand-gold" />
              Add New Faculty
            </DialogTitle>
            <DialogDescription>
              Register a new faculty building eligible for environmental audits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit}>
            <FacultyFormFields
              formError={formError}
              formName={formName}
              setFormName={setFormName}
              formBuildingName={formBuildingName}
              setFormBuildingName={setFormBuildingName}
              formDescription={formDescription}
              setFormDescription={setFormDescription}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Register Faculty
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT FACULTY MODAL ──────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader>
            <DialogTitle>
              <Edit2 className="h-5 w-5 text-brand-gold" />
              Edit Faculty Details
            </DialogTitle>
            <DialogDescription>
              Update the name, building location, or description for this faculty.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <FacultyFormFields
              formError={formError}
              formName={formName}
              setFormName={setFormName}
              formBuildingName={formBuildingName}
              setFormBuildingName={setFormBuildingName}
              formDescription={formDescription}
              setFormDescription={setFormDescription}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRM MODAL ────────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-rose-50/30 dark:bg-rose-950/10">
            <DialogTitle className="text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Confirm Faculty Deletion
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 flex flex-col gap-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-bold">
                &quot;{deletingFaculty?.name}&quot;
              </strong>
              ?
            </p>

            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex gap-3 text-xs leading-relaxed text-rose-700 dark:text-rose-400 font-medium">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] mb-1">
                  Warning: Cascading Deletion
                </span>
                Deleting this faculty will permanently remove all associated official
                inspections, user response polls, and monthly score history from the
                database. This action is irreversible.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={formSubmitting}
            >
              {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
