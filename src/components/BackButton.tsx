"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-6 self-start cursor-pointer border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl shadow-sm hover:shadow active:scale-[0.98]"
    >
      <ChevronLeft className="h-4 w-4 text-[#fcb900]" />
      Back
    </button>
  );
}
