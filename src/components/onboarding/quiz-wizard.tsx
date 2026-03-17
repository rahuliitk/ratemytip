"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuizQuestion {
  readonly id: string;
  readonly question: string;
  readonly options: readonly QuizOption[];
  readonly multiSelect?: boolean;
}

interface QuizOption {
  readonly value: string;
  readonly label: string;
}

interface QuizAnswers {
  capital: string;
  availability: string;
  risk: string;
  holdingPeriod: string;
  sectors: string[];
  experience: string;
}

interface MatchedCreator {
  id: string;
  slug: string;
  displayName: string;
  profileImageUrl: string | null;
  tier: string;
  totalTips: number;
  specializations: string[];
  rmtScore: number | null;
  accuracyRate: number | null;
  explanation: string;
}

interface QuizApiResponse {
  success: boolean;
  data?: {
    creators: MatchedCreator[];
    summary: string;
  };
  error?: { message: string };
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "capital",
    question: "How much capital are you starting with?",
    options: [
      { value: "under_25k", label: "Under \u20B925K" },
      { value: "25k_1l", label: "\u20B925K \u2013 \u20B91L" },
      { value: "1l_5l", label: "\u20B91L \u2013 \u20B95L" },
      { value: "5l_plus", label: "\u20B95L+" },
    ],
  },
  {
    id: "availability",
    question: "Can you watch the market during trading hours?",
    options: [
      { value: "full_time", label: "Yes, full time" },
      { value: "partial", label: "Partially" },
      { value: "no_job", label: "No, I have a job" },
    ],
  },
  {
    id: "risk",
    question: "What\u2019s your risk appetite?",
    options: [
      { value: "conservative", label: "Conservative" },
      { value: "moderate", label: "Moderate" },
      { value: "aggressive", label: "Aggressive" },
    ],
  },
  {
    id: "holdingPeriod",
    question: "How long do you want to hold positions?",
    options: [
      { value: "same_day", label: "Same day" },
      { value: "few_days", label: "Few days" },
      { value: "few_weeks", label: "Few weeks" },
      { value: "months", label: "Months" },
    ],
  },
  {
    id: "sectors",
    question: "Which sectors interest you?",
    multiSelect: true,
    options: [
      { value: "IT", label: "IT" },
      { value: "Banking", label: "Banking" },
      { value: "Pharma", label: "Pharma" },
      { value: "Auto", label: "Auto" },
      { value: "no_preference", label: "No preference" },
    ],
  },
  {
    id: "experience",
    question: "Have you traded before?",
    options: [
      { value: "never", label: "Never" },
      { value: "lt_6m", label: "Less than 6 months" },
      { value: "6m_plus", label: "6 months+" },
      { value: "2y_plus", label: "2 years+" },
    ],
  },
] as const;

const STORAGE_KEY = "ratemytip_quiz_answers";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuizWizard(): React.ReactElement {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    capital: "",
    availability: "",
    risk: "",
    holdingPeriod: "",
    sectors: [],
    experience: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    creators: MatchedCreator[];
    summary: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = QUESTIONS.length;
  const currentQuestion = QUESTIONS[step];
  const progressPct = ((step + 1) / totalSteps) * 100;

  // Check if current step has a valid answer
  const isCurrentAnswered = useCallback((): boolean => {
    if (!currentQuestion) return false;
    if (currentQuestion.multiSelect) {
      return (answers[currentQuestion.id as keyof QuizAnswers] as string[]).length > 0;
    }
    return (answers[currentQuestion.id as keyof QuizAnswers] as string) !== "";
  }, [currentQuestion, answers]);

  const handleSelect = useCallback(
    (value: string) => {
      if (!currentQuestion) return;

      if (currentQuestion.multiSelect) {
        setAnswers((prev) => {
          const current = prev[currentQuestion.id as keyof QuizAnswers] as string[];
          // "No preference" is exclusive — deselect others when chosen
          if (value === "no_preference") {
            return { ...prev, [currentQuestion.id]: ["no_preference"] };
          }
          // Deselect "no_preference" if a specific sector is picked
          const withoutNoPref = current.filter((v) => v !== "no_preference");
          if (withoutNoPref.includes(value)) {
            return {
              ...prev,
              [currentQuestion.id]: withoutNoPref.filter((v) => v !== value),
            };
          }
          return { ...prev, [currentQuestion.id]: [...withoutNoPref, value] };
        });
      } else {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
      }
    },
    [currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    }
  }, [step, totalSteps]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    // Persist answers to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // localStorage may be unavailable — ignore
    }

    try {
      const res = await fetch("/api/v1/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const json = (await res.json()) as QuizApiResponse;

      if (!json.success || !json.data) {
        setError(json.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setResults(json.data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers]);

  // ---------------------------------------------------------------------------
  // Results view
  // ---------------------------------------------------------------------------

  if (results) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 text-center">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text">
            Based on your profile, we recommend these creators:
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted">{results.summary}</p>

        <div className="mt-6 space-y-4">
          {results.creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.slug}`}
              className="flex items-start gap-4 rounded-xl border border-border/60 bg-bg-alt/50 p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-sm"
            >
              {creator.profileImageUrl ? (
                <Image
                  src={creator.profileImageUrl}
                  alt={creator.displayName}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border/40"
                  unoptimized
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-lg font-bold text-accent ring-1 ring-border/40">
                  {creator.displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text truncate">
                    {creator.displayName}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {creator.tier}
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                  {creator.rmtScore != null && (
                    <span className="font-medium tabular-nums">
                      RMT Score: {creator.rmtScore.toFixed(1)}
                    </span>
                  )}
                  {creator.accuracyRate != null && (
                    <span className="tabular-nums">
                      {(creator.accuracyRate * 100).toFixed(1)}% accuracy
                    </span>
                  )}
                  <span>{creator.totalTips} tips</span>
                </div>

                <p className="mt-1.5 text-xs text-muted leading-relaxed">
                  {creator.explanation}
                </p>

                {creator.specializations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {creator.specializations.slice(0, 4).map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {results.creators.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted">
              No creators matched your profile yet. Try broadening your
              preferences or check back later as we add more creators.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setResults(null);
              setStep(0);
              setAnswers({
                capital: "",
                availability: "",
                risk: "",
                holdingPeriod: "",
                sectors: [],
                experience: "",
              });
            }}
          >
            Retake Quiz
          </Button>
          <Button variant="glow" asChild>
            <Link href="/leaderboard">View Full Leaderboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Quiz view
  // ---------------------------------------------------------------------------

  if (!currentQuestion) return <></>;

  const isMulti = currentQuestion.multiSelect ?? false;
  const selectedValue = isMulti
    ? (answers[currentQuestion.id as keyof QuizAnswers] as string[])
    : (answers[currentQuestion.id as keyof QuizAnswers] as string);

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span>
            Question {step + 1} of {totalSteps}
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <Progress value={progressPct} />
      </div>

      {/* Question */}
      <h2 className="text-lg font-semibold text-text">
        {currentQuestion.question}
      </h2>
      {isMulti && (
        <p className="mt-1 text-xs text-muted">Select one or more options</p>
      )}

      {/* Options */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {currentQuestion.options.map((option) => {
          const isSelected = isMulti
            ? (selectedValue as string[]).includes(option.value)
            : selectedValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                isSelected
                  ? "border-accent bg-accent/5 text-accent ring-2 ring-accent/20"
                  : "border-border/60 bg-bg-alt/50 text-text hover:border-accent/40 hover:bg-accent/5"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-danger">{error}</p>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {step < totalSteps - 1 ? (
          <Button
            variant="glow"
            size="sm"
            onClick={handleNext}
            disabled={!isCurrentAnswered()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="glow"
            size="sm"
            onClick={handleSubmit}
            disabled={!isCurrentAnswered() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding creators...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Get Recommendations
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
