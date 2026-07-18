"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
  Search,
  Users,
  Award
} from "lucide-react";

// Form Zod Schema for the frontend
const surveyFormSchema = z.object({
  role: z.enum(["STAFF", "STUDENT"], {
    message: "Please select your role (Staff or Student).",
  }),
  facultyId: z.string().uuid("Please select a target faculty from the dropdown."),
  respondentId: z.string().optional(),
  cleanliness: z.number({ message: "Please select a score." }).min(1).max(5),
  landscape: z.number({ message: "Please select a score." }).min(1).max(5),
  wasteDisposal: z.number({ message: "Please select a score." }).min(1).max(5),
  restrooms: z.number({ message: "Please select a score." }).min(1).max(5),
  infrastructure: z.number({ message: "Please select a score." }).min(1).max(5),
  drainage: z.number({ message: "Please select a score." }).min(1).max(5),
  sustainability: z.number({ message: "Please select a score." }).min(1).max(5),
  behavior: z.number({ message: "Please select a score." }).min(1).max(5),
  sanitationExercises: z.number({ message: "Please select a score." }).min(1).max(5),
  safety: z.number({ message: "Please select a score." }).min(1).max(5),
  innovation: z.number({ message: "Please select a score." }).min(1).max(5),
});

type SurveyFormValues = z.infer<typeof surveyFormSchema>;

interface Faculty {
  id: string;
  name: string;
  buildingName: string | null;
  description: string | null;
}

interface Question {
  id: keyof SurveyFormValues;
  title: string;
  description: string;
  options: {
    score: number;
    label: string;
    detail: string;
  }[];
}

// 11 Assessment Criteria mapped to keys
const questions: Question[] = [
  {
    id: "cleanliness",
    title: "Question 1: General Cleanliness of Environment",
    description: "Rate the overall cleanliness of offices, classrooms, corridors, staircases, surroundings, and common areas in this faculty.",
    options: [
      { score: 1, label: "Poor", detail: "Highly neglected, visible dirt/litter" },
      { score: 2, label: "Fair", detail: "Substandard, irregular cleaning" },
      { score: 3, label: "Good", detail: "Acceptable daily neatness" },
      { score: 4, label: "Very Good", detail: "Consistently clean and tidy" },
      { score: 5, label: "Excellent", detail: "Spotless and meticulously maintained" },
    ]
  },
  {
    id: "landscape",
    title: "Question 2: Landscape and Aesthetic Appeal",
    description: "Rate the maintenance of lawns, flower beds, ornamental plants, landscaping, and beautification efforts.",
    options: [
      { score: 1, label: "Poor", detail: "Overgrown weeds, neglected plants" },
      { score: 2, label: "Fair", detail: "Basic maintenance but lacks appeal" },
      { score: 3, label: "Good", detail: "Neat lawns and basic green spaces" },
      { score: 4, label: "Very Good", detail: "Well-manicured lawns and attractive flowers" },
      { score: 5, label: "Excellent", detail: "Exceptional landscaping and pristine beautification" },
    ]
  },
  {
    id: "wasteDisposal",
    title: "Question 3: Waste Management Practices",
    description: "Rate the availability and proper use of waste bins, waste segregation, regular disposal, and the absence of litter.",
    options: [
      { score: 1, label: "Poor", detail: "No bins, overflowing waste, heavy littering" },
      { score: 2, label: "Fair", detail: "Few bins available, delayed waste clearing" },
      { score: 3, label: "Good", detail: "Sufficient bins, general absence of litter" },
      { score: 4, label: "Very Good", detail: "Accessible bins, proactive waste segregation" },
      { score: 5, label: "Excellent", detail: "Flawless waste system, zero litter, active recycling orientation" },
    ]
  },
  {
    id: "restrooms",
    title: "Question 4: Sanitation of Toilets and Convenience Facilities",
    description: "Rate the cleanliness, functionality, and availability of water, soap, and sanitary supplies in the restrooms.",
    options: [
      { score: 1, label: "Poor", detail: "Unusable, unhygienic, no water supply" },
      { score: 2, label: "Fair", detail: "Functional but lacks consistent water/soap and deep cleaning" },
      { score: 3, label: "Good", detail: "Clean and usable with regular water supply" },
      { score: 4, label: "Very Good", detail: "Highly sanitary, well-stocked with soap/supplies" },
      { score: 5, label: "Excellent", detail: "Persistently clean, fully stocked, exemplary hygiene standards" },
    ]
  },
  {
    id: "infrastructure",
    title: "Question 5: Maintenance of Buildings and Infrastructure",
    description: "Rate the condition of walls, ceilings, windows, doors, roofs, and furniture, as well as the absence of cobwebs or peeling paint.",
    options: [
      { score: 1, label: "Poor", detail: "Dilapidated structural damage, extensive cobwebs/peeling paint" },
      { score: 2, label: "Fair", detail: "Aging infrastructure, visible wear, minor cobwebs" },
      { score: 3, label: "Good", detail: "Decent, functional condition with basic maintenance" },
      { score: 4, label: "Very Good", detail: "Well-maintained structures, minimal cosmetic flaws" },
      { score: 5, label: "Excellent", detail: "Impeccable structural condition, freshly painted, pristine upkeep" },
    ]
  },
  {
    id: "drainage",
    title: "Question 6: Drainage and Surrounding Areas",
    description: "Rate the condition of the drains (clean, unobstructed) and the absence of stagnant water, weeds, or refuse around buildings.",
    options: [
      { score: 1, label: "Poor", detail: "Blocked drains, stagnant water pools, heavy weed overgrowth" },
      { score: 2, label: "Fair", detail: "Partially clear drains, minor weed patches" },
      { score: 3, label: "Good", detail: "Flowing drains, clean surroundings" },
      { score: 4, label: "Very Good", detail: "Completely clear drainage network, well-trimmed borders" },
      { score: 5, label: "Excellent", detail: "Engineered, spotless, completely dry and unobstructed drainage systems" },
    ]
  },
  {
    id: "sustainability",
    title: "Question 7: Environmental Sustainability Initiatives",
    description: "Rate the presence of tree planting, recycling initiatives, energy conservation, and environmental awareness campaigns.",
    options: [
      { score: 1, label: "Poor", detail: "No visible green initiatives or awareness" },
      { score: 2, label: "Fair", detail: "Passive presence of trees but no active recycling/conservation efforts" },
      { score: 3, label: "Good", detail: "Visible trees/greenery and basic energy conservation habits" },
      { score: 4, label: "Very Good", detail: "Active recycling corners and regular environmental messaging" },
      { score: 5, label: "Excellent", detail: "Thriving eco-programs, robust tree cover, and high-impact green campaigns" },
    ]
  },
  {
    id: "behavior",
    title: "Question 8: Staff and Student Environmental Behaviour",
    description: "Rate the general environmental consciousness among occupants, including proper disposal of waste and compliance with environmental regulations.",
    options: [
      { score: 1, label: "Poor", detail: "Widespread littering and disregard for rules" },
      { score: 2, label: "Fair", detail: "Occasional littering, low overall compliance" },
      { score: 3, label: "Good", detail: "General compliance with waste rules by the majority" },
      { score: 4, label: "Very Good", detail: "Strong culture of environmental care and active bin usage" },
      { score: 5, label: "Excellent", detail: "Exemplary civic behavior, peer-to-peer accountability, zero-tolerance for litter" },
    ]
  },
  {
    id: "sanitationExercises",
    title: "Question 9: Regular Environmental Sanitation Exercises",
    description: "Rate the evidence of organized sanitation exercises and active participation by both staff and students.",
    options: [
      { score: 1, label: "Poor", detail: "No sanitation exercises ever conducted" },
      { score: 2, label: "Fair", detail: "Rare or poorly attended clean-up exercises" },
      { score: 3, label: "Good", detail: "Regular, routine sanitation exercises with moderate turnout" },
      { score: 4, label: "Very Good", detail: "Enthusiastic and well-coordinated clean-up campaigns" },
      { score: 5, label: "Excellent", detail: "Institutionalized, dynamic sanitation exercises with maximum stakeholder participation" },
    ]
  },
  {
    id: "safety",
    title: "Question 10: Safety and Health Compliance",
    description: "Rate the accessibility of emergency exits, fire safety awareness, and the absolute absence of environmental health hazards.",
    options: [
      { score: 1, label: "Poor", detail: "Blocked exits, zero fire equipment, clear health hazards present" },
      { score: 2, label: "Fair", detail: "Exits clear but lacks fire safety tools or prominent signage" },
      { score: 3, label: "Good", detail: "Basic safety protocols in place, functional extinguishers" },
      { score: 4, label: "Very Good", detail: "Clear emergency pathways, up-to-date safety equipment, and visible safety signs" },
      { score: 5, label: "Excellent", detail: "World-class safety protocols, clear muster points, zero environmental hazards" },
    ]
  },
  {
    id: "innovation",
    title: "Question 11: Innovation and Creativity in Environmental Management",
    description: "Rate the introduction of innovative environmental practices, eco-friendly projects, or creative beautification initiatives.",
    options: [
      { score: 1, label: "Poor", detail: "No creative or unique environmental effort made" },
      { score: 2, label: "Fair", detail: "Very basic, generic aesthetic additions" },
      { score: 3, label: "Good", detail: "Standard adoption of eco-friendly fixtures or simple upcycling projects" },
      { score: 4, label: "Very Good", detail: "Commendable unique initiatives like solar-powered charging stations or creative waste-to-art installations" },
      { score: 5, label: "Excellent", detail: "Highly innovative, ground-breaking sustainable practices and award-worthy eco-friendly designs" },
    ]
  }
];

export default function SurveyPage() {
  const [step, setStep] = useState<number>(1);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [facultiesLoading, setFacultiesLoading] = useState<boolean>(true);
  const [facultiesError, setFacultiesError] = useState<string | null>(null);

  // Combobox Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Submit and Recalculation Results State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  const [activePeriodLabel, setActivePeriodLabel] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    setActivePeriodLabel(`${months[now.getMonth()]} ${now.getFullYear()}`);
  }, []);

  // Initialize form
  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      role: "STUDENT",
      facultyId: "",
      respondentId: "",
      cleanliness: undefined,
      landscape: undefined,
      wasteDisposal: undefined,
      restrooms: undefined,
      infrastructure: undefined,
      drainage: undefined,
      sustainability: undefined,
      behavior: undefined,
      sanitationExercises: undefined,
      safety: undefined,
      innovation: undefined,
    } as any,
    mode: "onTouched",
  });

  const selectedRole = watch("role");
  const selectedFacultyId = watch("facultyId");
  const currentFaculty = faculties.find((f) => f.id === selectedFacultyId);

  // Fetch faculties on mount
  useEffect(() => {
    async function loadFaculties() {
      try {
        setFacultiesLoading(true);
        const res = await fetch("/api/faculties");
        if (!res.ok) throw new Error("Failed to fetch faculties.");
        const data = await res.json();
        setFaculties(data);
      } catch (err: any) {
        setFacultiesError(err.message || "An error occurred.");
      } finally {
        setFacultiesLoading(false);
      }
    }
    loadFaculties();
  }, []);

  // Filter faculties based on search query
  const filteredFaculties = faculties.filter((faculty) =>
    faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Field validation helper for steps
  const validateStep = async (currentStep: number): Promise<boolean> => {
    if (currentStep === 1) {
      return await trigger(["role", "facultyId"]);
    } else if (currentStep === 2) {
      return await trigger(["cleanliness", "landscape", "wasteDisposal"]);
    } else if (currentStep === 3) {
      return await trigger(["restrooms", "infrastructure", "drainage"]);
    } else if (currentStep === 4) {
      return await trigger(["sustainability", "behavior", "sanitationExercises"]);
    } else if (currentStep === 5) {
      return await trigger(["safety", "innovation"]);
    }
    return false;
  };

  const handleNext = async () => {
    const isStepValid = await validateStep(step);
    if (isStepValid) {
      setStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Handler
  const onSubmit = async (data: SurveyFormValues) => {
    setIsSubmitting(true);
    try {
      // Current date info for monthly ranking (OAU assessment schedule)
      const now = new Date();
      const month = now.getMonth() + 1; // 6 (June) matching seeds
      const year = now.getFullYear();   // 2026 matching seeds

      const payload = {
        facultyId: data.facultyId,
        month,
        year,
        role: data.role,
        respondentId: data.respondentId || undefined,
        responses: {
          cleanliness: data.cleanliness,
          landscape: data.landscape,
          wasteDisposal: data.wasteDisposal,
          restrooms: data.restrooms,
          infrastructure: data.infrastructure,
          drainage: data.drainage,
          sustainability: data.sustainability,
          behavior: data.behavior,
          sanitationExercises: data.sanitationExercises,
          safety: data.safety,
          innovation: data.innovation,
        },
      };

      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit survey.");
      }

      const result = await response.json();
      setSubmitResult(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Steps Configuration
  const stepsMeta = [
    { label: "Role & Faculty Select", desc: "Identification" },
    { label: "Cleanliness & Aesthetics", desc: "Core Environment" },
    { label: "Restrooms & Drainage", desc: "Sanitation" },
    { label: "Behavior & Sanitation", desc: "Sustainability" },
    { label: "Safety & Compliance", desc: "Innovation" },
  ];

  // Helper to color-code the final rank ratings
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

  // Rendering Success Splash
  if (submitResult) {
    const { scoreBreakdown, faculty } = submitResult;
    return (
      <div className="flex-1 bg-zinc-50 dark:bg-[#090b10] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-2xl bg-white dark:bg-[#11141e] rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden relative p-8 text-center animate-in fade-in zoom-in-95 duration-500">

          {/* Confetti decoration styling */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 bg-linear-to-r from-brand-navy via-brand-gold to-brand-navy w-full" />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold mb-6 relative">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <h2 className="text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">
            Submission Successful!
          </h2>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400 max-w-md mx-auto text-base">
            Thank you for participating. Your feedback has been registered and the overall scores for <strong>{faculty.name}</strong> have been updated.
          </p>

          <div className="mt-8 bg-zinc-50 dark:bg-[#181d2a] rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 text-left">
            <h3 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-700/50 pb-2">
              <Award className="h-5 w-5 text-brand-gold" />
              Recalculated Score Card
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">FACULTY</p>
                <p className="text-xl font-bold text-zinc-800 dark:text-zinc-200 truncate mt-1">{faculty.name}</p>

                <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 mt-4">PERFORMANCE RATING</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getRatingBadgeClass(scoreBreakdown.rating)}`}>
                    {scoreBreakdown.rating}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end justify-center bg-white dark:bg-[#1c2232] rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Cumulative Score</span>
                <span className="text-5xl font-black text-brand-navy dark:text-brand-gold mt-1">
                  {scoreBreakdown.finalScore}%
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700/50">
              <h4 className="text-sm font-bold text-zinc-600 dark:text-zinc-300 mb-3">Weighted Input Breakdown</h4>
              <div className="space-y-3">
                {/* Official Inspection */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Official Inspector Audit (70% weight)</span>
                    <span className="text-brand-navy dark:text-zinc-300">{scoreBreakdown.officialNormalized}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-navy h-full rounded-full" style={{ width: `${scoreBreakdown.officialNormalized}%` }} />
                  </div>
                </div>

                {/* Staff opinion */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Staff Opinions (20% weight - {scoreBreakdown.totalStaffVotes} votes)</span>
                    <span className="text-brand-navy dark:text-zinc-300">{scoreBreakdown.staffNormalized}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-gold h-full rounded-full" style={{ width: `${scoreBreakdown.staffNormalized}%` }} />
                  </div>
                </div>

                {/* Student feedback */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Student Feedback (10% weight - {scoreBreakdown.totalStudentVotes} votes)</span>
                    <span className="text-brand-navy dark:text-zinc-300">{scoreBreakdown.studentNormalized}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-zinc-450 h-full rounded-full" style={{ width: `${scoreBreakdown.studentNormalized}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setSubmitResult(null);
                setStep(1);
                reset();
              }}
              className="flex-1 max-w-xs h-12 inline-flex items-center justify-center rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold shadow-md active:scale-[0.98]"
            >
              Submit Another Response
            </button>
            <a
              href="/"
              className="flex-1 max-w-xs h-12 inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold transition-all duration-200"
            >
              Back to Leaderboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Determine current items to display based on step
  const renderStepQuestions = () => {
    let currentQuestions: Question[] = [];
    if (step === 2) currentQuestions = questions.slice(0, 3);
    else if (step === 3) currentQuestions = questions.slice(3, 6);
    else if (step === 4) currentQuestions = questions.slice(6, 9);
    else if (step === 5) currentQuestions = questions.slice(9, 11);

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {currentQuestions.map((q) => (
          <div
            key={q.id}
            className="p-6 bg-zinc-50/50 dark:bg-[#181d2a]/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="text-base font-bold text-brand-navy dark:text-white leading-tight">
                {q.title}
              </h3>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                {q.description}
              </p>
            </div>

            <Controller
              name={q.id}
              control={control}
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label={q.title}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-5"
                >
                  {q.options.map((opt) => {
                    const isSelected = field.value === opt.score;
                    return (
                      <button
                        key={opt.score}
                        type="button"
                        onClick={() => field.onChange(opt.score)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 relative flex flex-col justify-between min-h-[105px] focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold ${isSelected
                            ? "bg-brand-navy/5 dark:bg-brand-navy/20 border-brand-navy dark:border-brand-gold shadow-md"
                            : "bg-white dark:bg-[#11141e] border-zinc-200 dark:border-zinc-800/70 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-extrabold transition-colors duration-200 ${isSelected
                              ? "bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy"
                              : "bg-zinc-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400"
                            }`}>
                            {opt.score}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-brand-navy dark:text-brand-gold" />
                          )}
                        </div>
                        <div className="mt-3">
                          <p className={`text-sm font-bold leading-none ${isSelected ? "text-brand-navy dark:text-brand-gold" : "text-zinc-700 dark:text-zinc-300"
                            }`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-snug">
                            {opt.detail}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors[q.id] && (
              <span className="text-rose-500 text-xs font-semibold mt-2 block" role="alert">
                {errors[q.id]?.message}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-[#090b10] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-5xl flex flex-col items-start mb-6">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl shadow-sm hover:shadow active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4 text-[#fcb900]" />
          Cancel
        </a>
      </div>

      {/* Brand Heading */}
      <div className="w-full max-w-8/10 text-center mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4 bg-white dark:bg-[#11141e] border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2 px-4 shadow-sm">
          <img src="/oau-logo.png" alt="OAU Logo" className="h-10 w-10 object-contain" />
          <div className="text-left">
            <span className="font-black text-xs uppercase tracking-wide text-brand-navy dark:text-brand-gold block">Obafemi Awolowo University</span>
            <span className="text-xs text-zinc-450 dark:text-zinc-400 font-bold block uppercase tracking-widest leading-none mt-0.5">Ile-Ife, Nigeria</span>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy dark:text-white tracking-tight">
          Cleanliness & Compliance Survey
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
          Help build a cleaner, greener campus. Rate your target faculty based on the criteria below.
        </p>
      </div>

      <div className="w-full max-w-8/10 bg-white dark:bg-[#11141e] rounded-3xl shadow-xl border border-zinc-150 dark:border-zinc-800/80 overflow-hidden flex flex-col md:flex-row min-h-[580px]">

        {/* Left Side: Step Tracker Panel (Desktop sidebar) */}
        <div className="md:w-1/4 bg-brand-navy p-6 md:p-8 text-white flex flex-col justify-between border-r border-brand-navy-light relative overflow-hidden">

          {/* Subtle logo vector effect in background */}
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-8 bg-white/5 border border-white/10 rounded-2xl p-2.5">
              <img src="/oau-logo.png" alt="OAU Logo" className="h-10 w-10 object-contain bg-white/10 rounded-lg p-1" />
              <div className="text-left">
                <span className="font-black text-xs uppercase tracking-wider text-brand-gold block">OAU, Ile-Ife</span>
                <span className="text-xs text-slate-300 font-bold block uppercase tracking-widest leading-none mt-0.5">Compliance Poll</span>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-6 relative">
              {stepsMeta.map((s, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                return (
                  <div key={idx} className="flex gap-3 items-center group">
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${isActive
                        ? "bg-brand-gold text-brand-navy border-brand-gold shadow-md shadow-brand-gold/20 scale-105"
                        : isCompleted
                          ? "bg-white text-brand-navy border-white"
                          : "bg-transparent text-white/50 border-white/20"
                      }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-brand-gold" : isCompleted ? "text-white" : "text-white/40"}`}>
                        {s.desc}
                      </p>
                      <p className={`text-xs font-medium leading-none mt-0.5 ${isActive ? "text-white font-semibold" : "text-white/60"}`}>
                        {s.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Progress Text */}
            <div className="md:hidden flex flex-col">
              <span className="text-xs uppercase font-bold text-brand-gold tracking-widest">Progress</span>
              <span className="text-xl font-black mt-1">Step {step} of 5</span>
              <span className="text-xs text-white/70 mt-1">{stepsMeta[step - 1].label}</span>
            </div>
          </div>

          <div className="mt-8 md:mt-0 pt-4 border-t border-white/10 text-xs text-white/50 font-medium">
            Active Period: {activePeriodLabel || "..."}
          </div>
        </div>

        {/* Right Side: Form Body */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">

          {/* Progress bar at the top */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-2">
              <span className="uppercase tracking-wider">Step {step} Progress</span>
              <span>{Math.round(((step - 1) / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-gold h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-between">

            {/* Step 1 Content: Role & Faculty Select */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-extrabold text-brand-navy dark:text-white">
                    Step 1: Role & Target Faculty Select
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                    Select your designation and search for the faculty environment you want to evaluate.
                  </p>
                </div>

                {/* Role select cards */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">
                    Your Role in the Institution
                  </label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => field.onChange("STUDENT")}
                          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold ${field.value === "STUDENT"
                              ? "bg-brand-navy/5 dark:bg-brand-navy/20 border-brand-navy dark:border-brand-gold shadow-md"
                              : "bg-white dark:bg-[#11141e] border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                        >
                          <div className={`p-2.5 rounded-lg ${field.value === "STUDENT" ? "bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Student</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Enrolled pupil rating</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange("STAFF")}
                          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold ${field.value === "STAFF"
                              ? "bg-brand-navy/5 dark:bg-brand-navy/20 border-brand-navy dark:border-brand-gold shadow-md"
                              : "bg-white dark:bg-[#11141e] border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                        >
                          <div className={`p-2.5 rounded-lg ${field.value === "STAFF" ? "bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                            <UserCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Staff</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Academic/Non-academic</p>
                          </div>
                        </button>
                      </div>
                    )}
                  />
                  {errors.role && (
                    <span className="text-rose-500 text-xs font-semibold block" role="alert">
                      {errors.role.message}
                    </span>
                  )}
                </div>

                {/* Combobox for Faculty selection */}
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">
                    Target Faculty to Assess
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className="w-full flex justify-between items-center px-4 h-12 bg-white dark:bg-[#11141e] border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-left text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold"
                    >
                      <span className="truncate">
                        {currentFaculty ? currentFaculty.name : "Select clean, environmental faculty..."}
                      </span>
                      <Search className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
                    </button>

                    {/* Combobox Dropdown */}
                    {dropdownOpen && (
                      <div className="absolute z-10 mt-1.5 w-full bg-white dark:bg-[#131724] border border-zinc-250 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-105 max-h-[260px] flex flex-col">
                        <div className="flex items-center px-3 border-b border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
                          <Search className="h-4 w-4 text-zinc-400 mr-2 shrink-0" />
                          <input
                            type="text"
                            placeholder="Type to filter faculties..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3 bg-transparent text-sm border-none focus:outline-none text-zinc-800 dark:text-zinc-100"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="overflow-y-auto flex-1 py-1 max-h-[200px]">
                          {facultiesLoading ? (
                            <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                              Loading faculties list...
                            </div>
                          ) : facultiesError ? (
                            <div className="p-4 text-center text-xs text-rose-500">
                              Error: {facultiesError}
                            </div>
                          ) : filteredFaculties.length === 0 ? (
                            <div className="p-4 text-center text-xs text-zinc-400">
                              No matching faculties found.
                            </div>
                          ) : (
                            filteredFaculties.map((faculty) => (
                              <button
                                key={faculty.id}
                                type="button"
                                onClick={() => {
                                  setValue("facultyId", faculty.id);
                                  setSearchQuery("");
                                  setDropdownOpen(false);
                                  trigger("facultyId");
                                }}
                                className={`w-full text-left px-4 py-3 text-xs flex justify-between items-center transition-colors duration-150 ${selectedFacultyId === faculty.id
                                    ? "bg-brand-navy text-white"
                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                  }`}
                              >
                                <div>
                                  <p className="font-bold">{faculty.name}</p>
                                  {faculty.buildingName && (
                                    <p className={`text-xs mt-0.5 ${selectedFacultyId === faculty.id ? "text-white/70" : "text-zinc-400"}`}>
                                      Building: {faculty.buildingName}
                                    </p>
                                  )}
                                </div>
                                {selectedFacultyId === faculty.id && (
                                  <Check className="h-3.5 w-3.5 shrink-0 ml-2" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.facultyId && (
                    <span className="text-rose-500 text-xs font-semibold block" role="alert">
                      {errors.facultyId.message}
                    </span>
                  )}
                </div>

                {currentFaculty && currentFaculty.description && (
                  <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/10 rounded-xl border border-zinc-150 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-bold text-zinc-750 dark:text-zinc-300 block mb-1">Faculty Description</span>
                    {currentFaculty.description}
                  </div>
                )}

                {/* Respondent ID (Optional) */}
                {selectedRole && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">
                      {selectedRole === "STUDENT" ? "Matriculation Number (Optional)" : "Staff ID Number (Optional)"}
                    </label>
                    <Controller
                      name="respondentId"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder={selectedRole === "STUDENT" ? "e.g. CSC/2021/001" : "e.g. STF/1024"}
                          className="w-full px-4 h-12 bg-white dark:bg-[#11141e] border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-gold"
                        />
                      )}
                    />
                    {errors.respondentId && (
                      <span className="text-rose-500 text-xs font-semibold block" role="alert">
                        {errors.respondentId.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Steps 2-5 Content: Dynamic Questions rendering */}
            {step > 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-brand-navy dark:text-white">
                    Step {step}: {stepsMeta[step - 1].label}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                    Rate each criterion from 1 (Poor) to 5 (Excellent). Click on a card option to make a selection.
                  </p>
                </div>
                {renderStepQuestions()}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-semibold transition-all duration-200 focus:outline-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="h-11 px-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white text-sm font-semibold transition-all duration-200 focus:outline-none shadow-md shadow-brand-navy/10 hover:shadow-lg active:scale-[0.98]"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-8 inline-flex items-center gap-1.5 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white text-sm font-bold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-navy/15 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Recalculating Ranking...
                    </>
                  ) : (
                    <>
                      Submit Assessment
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
