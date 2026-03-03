import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { mapTipRow } from "@/lib/utils/map-tip";
import { TipCardWithCreator } from "@/components/tip/tip-card-with-creator";

async function getRecentTips() {
  try {
    const rows = await db.tip.findMany({
      where: {
        reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
        status: { not: "REJECTED" },
      },
      orderBy: { tipTimestamp: "desc" },
      include: {
        stock: { select: { symbol: true, name: true } },
        creator: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            profileImageUrl: true,
            tier: true,
            isVerified: true,
            currentScore: { select: { rmtScore: true } },
          },
        },
      },
      take: 6,
    });
    return rows.map(mapTipRow);
  } catch {
    return [];
  }
}

export async function RecentTipsSection(): Promise<React.ReactElement> {
  const tips = await getRecentTips();

  if (tips.length === 0) {
    return <></>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Recent Tips</h2>
          <p className="mt-1 text-muted">
            Latest stock tips from tracked creators
          </p>
        </div>
        <Link
          href="/tips"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-xs transition-all duration-200 hover:bg-bg-alt hover:text-text hover:shadow-sm"
        >
          View All Tips
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => (
          <TipCardWithCreator key={tip.id} tip={tip} />
        ))}
      </div>
    </section>
  );
}
