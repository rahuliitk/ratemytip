"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { getModuleBySlug } from "@/lib/learning/modules";
import { QuizCard } from "@/components/learning/quiz-card";

const STORAGE_KEY = "ratemytip-learning-progress";

function getCompletedModules(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed as string[];
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function markModuleComplete(moduleId: string): void {
  try {
    const current = getCompletedModules();
    if (!current.includes(moduleId)) {
      current.push(moduleId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // ignore
  }
}

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: "bg-green-50", text: "text-green-700" },
  Intermediate: { bg: "bg-blue-50", text: "text-blue-700" },
  Advanced: { bg: "bg-purple-50", text: "text-purple-700" },
};

export default function ModulePage(): React.ReactElement {
  const params = useParams();
  const slug = typeof params.moduleSlug === "string" ? params.moduleSlug : "";
  const mod = getModuleBySlug(slug);

  const [isCompleted, setIsCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mod) {
      const completed = getCompletedModules();
      setIsCompleted(completed.includes(mod.id));
    }
    setMounted(true);
  }, [mod]);

  const handleMarkComplete = useCallback(() => {
    if (mod) {
      markModuleComplete(mod.id);
      setIsCompleted(true);
    }
  }, [mod]);

  if (!mod) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text">Module Not Found</h1>
        <p className="mt-2 text-sm text-muted">
          The learning module you are looking for does not exist.
        </p>
        <Link
          href="/learn"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Hub
        </Link>
      </div>
    );
  }

  const diffStyle = DIFFICULTY_STYLES[mod.difficulty] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text transition-colors duration-150"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Learning Hub
      </Link>

      {/* Module header */}
      <div className="mt-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${diffStyle.bg} ${diffStyle.text}`}
          >
            {mod.difficulty}
          </span>
          {mounted && isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold text-text sm:text-3xl">
          {mod.title}
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          {mod.description}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {mod.estimatedMinutes} min read
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {mod.content.length} sections
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-8 space-y-8">
        {mod.content.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-lg font-semibold text-text">{section.title}</h2>
            <div className="mt-3 text-sm leading-relaxed text-text/80 whitespace-pre-line">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      {/* Quiz */}
      {mod.quiz.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-text">Test Your Knowledge</h2>
          <p className="mt-1 text-sm text-muted">
            Answer these questions to check your understanding.
          </p>
          <div className="mt-4 space-y-4">
            {mod.quiz.map((q, idx) => (
              <QuizCard key={idx} question={q} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Mark as Complete */}
      <div className="mt-10 border-t border-border/60 pt-6">
        {mounted && isCompleted ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">
              You have completed this module.
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleMarkComplete}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md hover:bg-accent/90"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark as Complete
          </button>
        )}

        <div className="mt-4">
          <Link
            href="/learn"
            className="text-sm font-medium text-muted hover:text-text transition-colors duration-150"
          >
            Back to all modules
          </Link>
        </div>
      </div>
    </div>
  );
}
