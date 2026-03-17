"use client";

import Link from "next/link";
import { Clock, BookOpen, CheckCircle2 } from "lucide-react";
import type { LearningModule } from "@/lib/learning/modules";

interface ModuleCardProps {
  readonly module: LearningModule;
  readonly isCompleted: boolean;
}

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: "bg-green-50", text: "text-green-700" },
  Intermediate: { bg: "bg-blue-50", text: "text-blue-700" },
  Advanced: { bg: "bg-purple-50", text: "text-purple-700" },
};

export function ModuleCard({
  module,
  isCompleted,
}: ModuleCardProps): React.ReactElement {
  const diffStyle = DIFFICULTY_STYLES[module.difficulty] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
  };

  return (
    <Link
      href={`/learn/${module.slug}`}
      className="group block rounded-xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${diffStyle.bg} ${diffStyle.text}`}
            >
              {module.difficulty}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold text-text group-hover:text-accent transition-colors duration-150">
            {module.title}
          </h3>
          <p className="mt-1.5 text-sm text-muted leading-relaxed line-clamp-2">
            {module.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {module.estimatedMinutes} min
        </span>
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {module.content.length} sections
        </span>
        <span className="inline-flex items-center gap-1">
          {module.quiz.length} quiz questions
        </span>
      </div>
    </Link>
  );
}
