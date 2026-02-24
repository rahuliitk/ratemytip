"use client";

import { useState, useEffect } from "react";
import { SubscriptionGate } from "@/components/shared/subscription-gate";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { RecommendedCreators } from "@/components/recommendations/recommended-creators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TipRec {
  tipId: string;
  score: number;
  reason: string;
  tip: {
    id: string;
    direction: string;
    entryPrice: number;
    target1: number;
    stopLoss: number;
    status: string;
    timeframe: string;
    tipTimestamp: string;
    stock: { symbol: string; name: string; lastPrice: number | null };
    creator: { slug: string; displayName: string; currentScore: { rmtScore: number } | null };
  } | null;
}

interface CreatorRec {
  creatorId: string;
  score: number;
  reason: string;
  creator: {
    id: string;
    slug: string;
    displayName: string;
    profileImageUrl: string | null;
    tier: string;
    specializations: string[];
    totalTips: number;
    currentScore: { rmtScore: number; accuracyRate: number } | null;
  } | null;
}

export default function DiscoverPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Sparkles className="h-6 w-6 text-accent" />
            Discover
          </h1>
          <p className="text-sm text-muted">Personalized tip and creator recommendations based on your preferences</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <Settings2 className="mr-2 h-4 w-4" />
            Preferences
          </Link>
        </Button>
      </div>

      <SubscriptionGate minTier="PRO" feature="AI Recommendations">
        <DiscoverContent />
      </SubscriptionGate>
    </div>
  );
}

function DiscoverContent(): React.ReactElement {
  const [tips, setTips] = useState<TipRec[]>([]);
  const [creators, setCreators] = useState<CreatorRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/recommendations").then((r) => r.json()),
      fetch("/api/v1/recommendations/creators").then((r) => r.json()),
    ]).then(([tipRes, creatorRes]) => {
      if (tipRes.success) setTips(tipRes.data);
      if (creatorRes.success) setCreators(creatorRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-40 rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded bg-gray-200" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Recommended Creators */}
      {creators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <RecommendedCreators creators={creators} />
          </CardContent>
        </Card>
      )}

      {/* Recommended Tips */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-primary">Recommended Tips</h2>
        {tips.length === 0 ? (
          <p className="py-8 text-center text-muted">
            No recommendations yet. Set your preferences to get personalized tips.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tips.map((rec) =>
              rec.tip ? (
                <RecommendationCard key={rec.tipId} recommendation={rec} />
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
