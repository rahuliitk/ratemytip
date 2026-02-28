"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gradient-primary">Choose Your Plan</h1>
        <p className="mt-3 text-lg text-muted">
          Upgrade to unlock AI recommendations, advanced analytics, and more.
        </p>
        {canceled && (
          <p className="mt-2 text-sm text-warning">Checkout was canceled. No charges were made.</p>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={`relative flex flex-col ${
              tier.popular
                ? "border-2 border-accent shadow-lg"
                : "shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
            )}
            <CardHeader className="text-center">
              <tier.icon className="mx-auto mb-2 h-8 w-8 text-accent" />
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <p className="text-sm text-muted">{tier.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gradient-primary">{tier.price}</span>
                <span className="text-muted">{tier.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                    )}
                    <span className={f.included ? "text-text" : "text-gray-400"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
              {tier.tier === "FREE" ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleCheckout(tier.tier)}
                  disabled={loading !== null}
                >
                  {loading === tier.tier ? "Redirecting..." : `Upgrade to ${tier.name}`}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage(): React.ReactElement {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 text-center text-muted">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
