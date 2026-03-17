"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import { ModuleCard } from "@/components/learning/module-card";

const STORAGE_KEY = "ratemytip-learning-progress";

function getCompletedModules(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed as string[]);
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

export default function LearnPage(): React.ReactElement {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCompleted(getCompletedModules());
    setMounted(true);
  }, []);

  const completedCount = completed.size;
  const totalCount = LEARNING_MODULES.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <GraduationCap className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">Learn</h1>
          <p className="mt-1 text-sm text-muted">
            Free bite-sized modules to help you navigate stock tips safely.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {mounted && completedCount > 0 && (
        <div className="mt-6 rounded-lg border border-border/60 bg-surface p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text">Your Progress</span>
            <span className="text-muted tabular-nums">
              {completedCount} of {totalCount} modules completed
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-bg-alt overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Module grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING_MODULES.map((mod) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            isCompleted={mounted && completed.has(mod.id)}
          />
        ))}
      </div>
    </div>
  );
}
