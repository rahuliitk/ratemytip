"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  // Type assertion — subscriptionTier is added to session in auth config
  const userTier = (session?.user as Record<string, unknown> | undefined)?.subscriptionTier as string | undefined;
  const currentRank = TIER_RANK[userTier ?? "FREE"] ?? 0;
  const requiredRank = TIER_RANK[minTier] ?? 0;

  if (currentRank >= requiredRank) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed border-[#2B6CB0]/20 bg-[#2B6CB0]/5">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-accent/10 p-3">
          <Lock className="h-6 w-6 text-accent" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gradient-primary">
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
      </CardContent>
    </Card>
  );
}
