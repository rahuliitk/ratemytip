"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Crown, Sparkles } from "lucide-react";

const TIERS = [
  {
    name: "Free",
    tier: "FREE" as const,
    price: "$0",
    period: "forever",
    description: "Get started with basic features",
    icon: Zap,
    features: [
      { text: "View leaderboards & creator profiles", included: true },
      { text: "Search tips & stocks", included: true },
      { text: "Save & rate tips", included: true },
      { text: "Up to 5 portfolio positions", included: true },
      { text: "AI recommendations", included: false },
      { text: "Advanced portfolio analytics", included: false },
      { text: "Data export", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    tier: "PRO" as const,
    price: "$9",
    period: "/month",
    description: "For active traders who want an edge",
    icon: Crown,
    popular: true,
    features: [
      { text: "Everything in Free", included: true },
      { text: "Up to 50 portfolio positions", included: true },
      { text: "AI-powered tip recommendations", included: true },
      { text: "AI-powered creator discovery", included: true },
      { text: "Advanced portfolio analytics", included: true },
      { text: "Data export (CSV)", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Premium",
    tier: "PREMIUM" as const,
    price: "$29",
    period: "/month",
    description: "For serious investors & professionals",
    icon: Sparkles,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 500 portfolio positions", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
  },
];

function PricingContent(): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(tier: "PRO" | "PREMIUM"): Promise<void> {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    setLoading(tier);
    try {
      const res = await fetch("/api/v1/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.assign(data.data.url);
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-14 text-center">
        <h1 className="text-3xl font-bold text-text">Choose Your Plan</h1>
        <p className="mt-3 text-lg text-muted">
          Upgrade to unlock AI recommendations, advanced analytics, and more.
        </p>
        {canceled && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm text-warning">
            Checkout was canceled. No charges were made.
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-3">
        {TIERS.map((tier) => {
          const isPopular = !!tier.popular;
          const isFree = tier.tier === "FREE";

          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl bg-surface ${
                isPopular
                  ? "border-2 border-accent shadow-lg"
                  : "border border-border/60 shadow-sm"
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className="px-6 pb-0 pt-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <tier.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-text">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted">{tier.description}</p>
                <div className="mt-5">
                  <span className="text-4xl font-bold text-text">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted">{tier.period}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 my-6 border-t border-border/40" />

              {/* Features */}
              <div className="flex flex-1 flex-col px-6 pb-8">
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      {f.included ? (
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/10">
                          <Check className="h-2.5 w-2.5 text-success" />
                        </div>
                      ) : (
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-bg-alt">
                          <X className="h-2.5 w-2.5 text-muted" />
                        </div>
                      )}
                      <span
                        className={`text-sm ${
                          f.included
                            ? "text-text-secondary"
                            : "text-muted"
                        }`}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isFree ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isPopular ? (
                  <Button
                    variant="glow"
                    className="w-full"
                    onClick={() => handleCheckout(tier.tier)}
                    disabled={loading !== null}
                  >
                    {loading === tier.tier
                      ? "Redirecting..."
                      : `Upgrade to ${tier.name}`}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => handleCheckout(tier.tier)}
                    disabled={loading !== null}
                  >
                    {loading === tier.tier
                      ? "Redirecting..."
                      : `Upgrade to ${tier.name}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PricingPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">
          Loading...
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
