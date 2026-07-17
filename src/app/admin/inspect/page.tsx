"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ClipboardCheck,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Award,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

// Criteria details with exact max scores matching the official framework
const criteriaConfig = [
  {
    id: "cleanliness",
    label: "General Cleanliness of Environment",
    description: "Cleanliness of offices, classrooms, corridors, staircases, surroundings, and common areas.",
    max: 20,
  },
  {
    id: "landscape",
    label: "Landscape and Aesthetic Appeal",
    description: "Maintenance of lawns, flower beds, ornamental plants, landscaping, and beautifying.",
    max: 10,
  },
  {
    id: "wasteDisposal",
    label: "Waste Management Practices",
    description: "Availability/use of waste bins, segregation, regular disposal, absence of litter.",
    max: 10,
  },
  {
    id: "restrooms",
    label: "Sanitation of Toilets & Restrooms",
    description: "Cleanliness, water supply, soap, and sanitary items in restrooms.",
    max: 10,
  },
  {
    id: "infrastructure",
    label: "Maintenance of Infrastructure",
    description: "Condition of walls, ceilings, windows, doors, furniture; no cobwebs or peeling paint.",
    max: 10,
  },
  {
    id: "sustainability",
    label: "Environmental Sustainability",
    description: "Tree planting, recycling schemes, energy conservation, environmental campaigns.",
    max: 10,
  },
  {
    id: "drainage",
    label: "Drainage and Surrounding Areas",
    description: "Clean, unobstructed drains; absence of stagnant water, weeds, or refuse around blocks.",
    max: 10,
  },
  {
    id: "behavior",
    label: "Staff & Student Environmental Behaviour",
    description: "Environmental consciousness among occupants, rule compliance, proper disposal.",
    max: 5,
  },
  {
    id: "innovation",
    label: "Innovation in Environmental Management",
    description: "Adoption of eco-friendly fixtures, recycling designs, creative upgrades.",
    max: 5,
  },
  {
    id: "safety",
    label: "Safety and Health Compliance",
    description: "Clear emergency exits, fire safety tools, absence of health hazards.",
    max: 5,
  },
  {
    id: "sanitationExercises",
    label: "Regular Sanitation Exercises",
    description: "Evidence of coordinated clean-up exercises and campus participation.",
    max: 5,
  },
] as const;

// Create validation schema dynamically based on criteria config
const inspectFormSchema = z.object({
  facultyId: z.string().uuid("Please select a faculty."),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  cleanliness: z.coerce.number().min(0).max(20, "Cleanliness must be between 0 and 20"),
  landscape: z.coerce.number().min(0).max(10, "Landscape must be between 0 and 10"),
  wasteDisposal: z.coerce.number().min(0).max(10, "Waste Management must be between 0 and 10"),
  restrooms: z.coerce.number().min(0).max(10, "Toilet Sanitation must be between 0 and 10"),
  infrastructure: z.coerce.number().min(0).max(10, "Infrastructure must be between 0 and 10"),
  sustainability: z.coerce.number().min(0).max(10, "Sustainability must be between 0 and 10"),
  drainage: z.coerce.number().min(0).max(10, "Drainage must be between 0 and 10"),
  behavior: z.coerce.number().min(0).max(5, "Behaviour must be between 0 and 5"),
  innovation: z.coerce.number().min(0).max(5, "Innovation must be between 0 and 5"),
  safety: z.coerce.number().min(0).max(5, "Safety must be between 0 and 5"),
  sanitationExercises: z.coerce.number().min(0).max(5, "Sanitation exercises must be between 0 and 5"),
});

type InspectFormValues = z.infer<typeof inspectFormSchema>;

interface Faculty {
  id: string;
  name: string;
  buildingName: string | null;
  description: string | null;
}

export default function AdminInspectPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [facultiesLoading, setFacultiesLoading] = useState(true);
  const [facultiesError, setFacultiesError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search filter for Faculty selector
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<InspectFormValues>({
    resolver: zodResolver(inspectFormSchema) as any,
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      cleanliness: 0,
      landscape: 0,
      wasteDisposal: 0,
      restrooms: 0,
      infrastructure: 0,
      sustainability: 0,
      drainage: 0,
      behavior: 0,
      innovation: 0,
      safety: 0,
      sanitationExercises: 0,
    },
    mode: "onTouched",
  });

  const selectedFacultyId = watch("facultyId");
  const selectedFaculty = faculties.find((f) => f.id === selectedFacultyId);

  // Fetch faculties list on mount
  useEffect(() => {
    async function loadFaculties() {
      try {
        setFacultiesLoading(true);
        const res = await fetch("/api/faculties");
        if (!res.ok) throw new Error("Failed to load faculties");
        const data = await res.json();
        setFaculties(data);
      } catch (err: any) {
        setFacultiesError(err.message || "An error occurred");
      } finally {
        setFacultiesLoading(false);
      }
    }
    loadFaculties();
  }, []);

  // Filter faculties list
  const filteredFaculties = faculties.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate live total score
  const watchedScores = watch([
    "cleanliness",
    "landscape",
    "wasteDisposal",
    "restrooms",
    "infrastructure",
    "sustainability",
    "drainage",
    "behavior",
    "innovation",
    "safety",
    "sanitationExercises",
  ]);

  const runningTotal = watchedScores.reduce((acc, score) => acc + (Number(score) || 0), 0);

  // Submit scorecard
  const onSubmit = async (values: InspectFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const payload = {
        facultyId: values.facultyId,
        month: values.month,
        year: values.year,
        criteriaScores: {
          cleanliness: values.cleanliness,
          landscape: values.landscape,
          wasteDisposal: values.wasteDisposal,
          restrooms: values.restrooms,
          infrastructure: values.infrastructure,
          sustainability: values.sustainability,
          drainage: values.drainage,
          behavior: values.behavior,
          innovation: values.innovation,
          safety: values.safety,
          sanitationExercises: values.sanitationExercises,
        },
      };

      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to submit scorecard");
      }

      setSuccessData(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for ranking color classes
  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800";
      case "Very Good":
        return "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800";
      case "Good":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800";
      case "Fair":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800";
      default:
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800";
    }
  };

  if (successData) {
    const { scoreBreakdown, faculty } = successData;
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold mb-6">
            <CheckCircle className="h-10 w-10 text-brand-gold" />
          </div>

          <h2 className="text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
            Inspection Logged!
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
            Official scorecard for <strong>{faculty.name}</strong> has been saved, and cumulative weighted rankings have been recalculated.
          </p>

          <div className="mt-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-150 dark:border-slate-800 text-left">
            <h3 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-2">
              <Award className="h-5 w-5 text-brand-gold" />
              Updated Score Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faculty</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-250 truncate mt-0.5">{faculty.name}</p>

                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">Performance Rating</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRatingBadgeClass(scoreBreakdown.rating)}`}>
                    {scoreBreakdown.rating}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end justify-center bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recalculated Score</span>
                <span className="text-5xl font-black text-brand-navy dark:text-brand-gold mt-1">
                  {scoreBreakdown.finalScore}%
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Weighted Input Components</h4>
              <div className="space-y-3">
                {/* Official Inspection */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Official Committee Audit (70% weight)</span>
                    <span className="text-brand-navy dark:text-slate-200">{scoreBreakdown.officialNormalized}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-navy h-full rounded-full" style={{ width: `${scoreBreakdown.officialNormalized}%` }} />
                  </div>
                </div>

                {/* Staff opinion */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Staff Opinion Poll (20% weight - {scoreBreakdown.totalStaffVotes} votes)</span>
                    <span className="text-brand-navy dark:text-slate-200">{scoreBreakdown.staffNormalized}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-gold h-full rounded-full" style={{ width: `${scoreBreakdown.staffNormalized}%` }} />
                  </div>
                </div>

                {/* Student feedback */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Student Feedback (10% weight - {scoreBreakdown.totalStudentVotes} votes)</span>
                    <span className="text-brand-navy dark:text-slate-200">{scoreBreakdown.studentNormalized}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full" style={{ width: `${scoreBreakdown.studentNormalized}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setSuccessData(null);
                setValue("facultyId", "");
              }}
              className="flex-1 max-w-xs h-12 inline-flex items-center justify-center rounded-xl bg-brand-navy hover:bg-[#0c2a52] text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold shadow-md shadow-slate-200 dark:shadow-none"
            >
              Log New Scorecard
            </button>
            <a
              href="/admin/faculties"
              className="flex-1 max-w-xs h-12 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-all duration-200"
            >
              Manage Faculties
            </a>
            <a
              href="/admin/reports"
              className="flex-1 max-w-xs h-12 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-all duration-200"
            >
              Go to Reports
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Navigation / Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#10386b] dark:text-white tracking-tight">
            Official Inspection Scorecard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Submit environmental audit scores evaluated by the Inspection Committee.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {apiError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-rose-800 dark:text-rose-450">API Submission Error</h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{apiError}</p>
              </div>
            </div>
          )}

          {/* Setup Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Faculty Selector Box */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
              <label className="text-xs font-bold text-brand-navy dark:text-slate-250 uppercase tracking-widest block mb-2">
                Target Faculty
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="w-full flex justify-between items-center px-4 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold transition-colors"
                >
                  <span className="truncate">
                    {selectedFaculty ? selectedFaculty.name : "Select audit target faculty..."}
                  </span>
                  <Building2 className="h-4 w-4 text-slate-450 shrink-0 ml-2" />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-25 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[220px]">
                    <div className="flex items-center px-3 border-b border-slate-150 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20">
                      <input
                        type="text"
                        placeholder="Search faculties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2.5 bg-transparent text-xs border-none focus:outline-none text-slate-800 dark:text-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="overflow-y-auto flex-1 py-1 max-h-[160px]">
                      {facultiesLoading ? (
                        <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                          Loading...
                        </div>
                      ) : facultiesError ? (
                        <div className="p-3 text-center text-xs text-rose-500">
                          Error loading faculties.
                        </div>
                      ) : filteredFaculties.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No faculties match your search.
                        </div>
                      ) : (
                        filteredFaculties.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setValue("facultyId", f.id);
                              setSearchQuery("");
                              setDropdownOpen(false);
                              trigger("facultyId");
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${selectedFacultyId === f.id
                                ? "bg-brand-navy text-white"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                          >
                            <p className="font-bold">{f.name}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.facultyId && (
                <span className="text-rose-500 text-xs font-semibold mt-1 block">
                  {errors.facultyId.message}
                </span>
              )}
            </div>

            {/* Assessment Period Box */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <label className="text-xs font-bold text-brand-navy dark:text-slate-250 uppercase tracking-widest block mb-2">
                Assessment Period
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Controller
                    name="month"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div className="w-24">
                  <Controller
                    name="year"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min="2000"
                        max="2100"
                        className="w-full px-3 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 text-center focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scorecard Inputs Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header / Scoring summary */}
            <div className="p-6 bg-slate-50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-brand-navy dark:text-white">
                  Inspection Scoresheet
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter scores based on inspection results. Values are restricted to their maximum points.
                </p>
              </div>

              {/* Running total status */}
              <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-4 shadow-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block leading-none">Running Total</span>
                  <span className="text-2xl font-black text-brand-navy dark:text-brand-gold mt-1 inline-block">
                    {runningTotal} <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                  <TrendingUp className="h-5 w-5 text-brand-gold" />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-150 dark:divide-slate-800/80 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {criteriaConfig.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-850 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {item.label}
                        </label>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-brand-navy/10 text-brand-navy dark:bg-brand-gold/10 dark:text-brand-gold shrink-0">
                          Max {item.max}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
                      <div className="flex-1">
                        <Controller
                          name={item.id}
                          control={control}
                          render={({ field }) => (
                            <div className="relative">
                              <input
                                {...field}
                                type="number"
                                min="0"
                                max={item.max}
                                placeholder="0"
                                onChange={(e) => {
                                  let val = e.target.value === "" ? "" : Number(e.target.value);
                                  // Restrict to bounds
                                  if (typeof val === "number") {
                                    if (val < 0) val = 0;
                                    if (val > item.max) val = item.max;
                                  }
                                  field.onChange(val);
                                }}
                                className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold text-right"
                              />
                            </div>
                          )}
                        />
                      </div>
                      <div className="text-xs font-semibold text-slate-400 w-12 text-left">
                        / {item.max} pts
                      </div>
                    </div>
                    {errors[item.id] && (
                      <span className="text-rose-500 text-xs font-bold mt-1 block">
                        {errors[item.id]?.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
              <a
                href="/"
                className="h-12 px-6 inline-flex items-center justify-center rounded-xl border border-slate-250 dark:border-slate-850 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all duration-150"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-navy hover:bg-[#0c2a52] text-white font-bold transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-gold shadow-md shadow-slate-200 dark:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting Scorecard...
                  </>
                ) : (
                  <>
                    Log Inspection Scorecard
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
