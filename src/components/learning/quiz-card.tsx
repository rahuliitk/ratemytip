"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/learning/modules";

interface QuizCardProps {
  readonly question: QuizQuestion;
  readonly index: number;
}

export function QuizCard({ question, index }: QuizCardProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const hasAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
      <p className="text-sm font-semibold text-text">
        <span className="text-muted">Q{index + 1}.</span> {question.question}
      </p>

      <div className="mt-3 space-y-2">
        {question.options.map((option, optIndex) => {
          const isThisSelected = selectedIndex === optIndex;
          const isThisCorrect = optIndex === question.correctIndex;

          let optionClasses =
            "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all duration-150 cursor-pointer ";

          if (!hasAnswered) {
            optionClasses +=
              "border-border/60 hover:border-accent/40 hover:bg-accent/5 text-text";
          } else if (isThisCorrect) {
            optionClasses +=
              "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium";
          } else if (isThisSelected && !isCorrect) {
            optionClasses +=
              "border-red-300 bg-red-50 text-red-800";
          } else {
            optionClasses +=
              "border-border/40 text-muted opacity-60";
          }

          return (
            <button
              key={optIndex}
              type="button"
              onClick={() => {
                if (!hasAnswered) {
                  setSelectedIndex(optIndex);
                }
              }}
              disabled={hasAnswered}
              className={optionClasses}
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px] font-bold">
                {String.fromCharCode(65 + optIndex)}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm ${
            isCorrect
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <p className="font-medium">
            {isCorrect ? "Correct!" : "Not quite."}
          </p>
          <p className="mt-1 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
