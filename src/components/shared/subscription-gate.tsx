"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";

const TIER_RANK: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
};

interface SubscriptionGateProps {
  readonly minTier: "PRO" | "PREMIUM";
  readonly feature?: string;
  readonly children: React.ReactNode;
}

/**
 * Wraps content that requires a minimum subscription tier.
 * Shows an upgrade CTA if the user's tier is insufficient.
 */
export function SubscriptionGate({ minTier, feature, children }: SubscriptionGateProps): React.ReactElement {
  const { data: session } = useSession();

  // Type assertion -- subscriptionTier is added to session in auth config
  const userTier = (session?.user as Record<string, unknown> | undefined)?.subscriptionTier as string | undefined;
  const currentRank = TIER_RANK[userTier ?? "FREE"] ?? 0;
  const requiredRank = TIER_RANK[minTier] ?? 0;

  if (currentRank >= requiredRank) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-xl border border-dashed border-accent/20 bg-accent-subtle shadow-sm">
      <div className="flex flex-col items-center py-14 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <Lock className="h-6 w-6 text-accent" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-text">
          {feature ? `${feature} requires ${minTier}` : `Upgrade to ${minTier}`}
        </h3>
        <p className="mb-6 max-w-md text-sm text-muted">
          {minTier === "PRO"
            ? "Unlock AI recommendations, advanced analytics, and up to 50 portfolio positions."
            : "Get priority support, 500 positions, and early access to new features."}
        </p>
        <Button asChild>
          <Link href="/pricing">
            <Crown className="mr-2 h-4 w-4" />
            View Plans
          </Link>
        </Button>
      </div>
    </div>
  );
}
