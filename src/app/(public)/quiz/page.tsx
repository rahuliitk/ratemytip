import type { Metadata } from "next";
import { QuizWizard } from "@/components/onboarding/quiz-wizard";

export const metadata: Metadata = {
  title: "Find Your Ideal Creators | RateMyTip",
  description:
    "Take a quick quiz to discover which stock tip creators match your trading style, risk appetite, and schedule. Personalized recommendations powered by RateMyTip.",
  openGraph: {
    title: "Find Your Ideal Creators | RateMyTip",
    description:
      "Answer 6 quick questions and get personalized creator recommendations based on your trading profile.",
  },
};

export default function QuizPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text">Who Should I Follow?</h1>
        <p className="mt-2 text-sm text-muted">
          Answer a few questions and we will match you with creators that fit
          your trading style.
        </p>
      </div>
      <div className="mt-8">
        <QuizWizard />
      </div>
    </div>
  );
}
