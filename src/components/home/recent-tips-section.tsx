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
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Recent Tips</h2>
        <Link
          href="/tips"
          className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          View All Tips
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => (
          <TipCardWithCreator key={tip.id} tip={tip} />
        ))}
      </div>
    </section>
  );
}
