// src/lib/queue/workers/recommendation-worker.ts
//
// Pre-computes personalized recommendations for PRO/PREMIUM users.
// Runs daily after score calculation, stores results in Redis for fast reads.

import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { computeTipRecommendations, computeCreatorRecommendations } from "@/lib/recommendations";

function getConnection() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
  };
}

export function createRecommendationWorker(): Worker {
  return new Worker(
    "recommendations",
    async (job) => {
      const { userId } = job.data as { userId?: string };
      console.log(`[recommendation-worker] Computing recommendations for ${userId ?? "all users"}`);

      if (userId) {
        // Single user recompute (triggered by preference update)
        const tipRecs = await computeTipRecommendations(userId);
        const creatorRecs = await computeCreatorRecommendations(userId);

        // Log recommendations
        const tipLogs = tipRecs.map((r) => ({
          userId,
          type: "TIP",
          referenceId: r.tipId,
          score: r.score,
          reason: r.reason,
        }));
        const creatorLogs = creatorRecs.map((r) => ({
          userId,
          type: "CREATOR",
          referenceId: r.creatorId,
          score: r.score,
          reason: r.reason,
        }));

        // Clear old recs and insert new
        await db.recommendationLog.deleteMany({
          where: { userId },
        });
        if (tipLogs.length > 0 || creatorLogs.length > 0) {
          await db.recommendationLog.createMany({
            data: [...tipLogs, ...creatorLogs],
          });
        }

        console.log(`[recommendation-worker] Stored ${tipLogs.length} tip + ${creatorLogs.length} creator recs for user ${userId}`);
      } else {
        // Batch recompute for all PRO/PREMIUM users
        const subscribers = await db.user.findMany({
          where: { subscriptionTier: { in: ["PRO", "PREMIUM"] }, isActive: true },
          select: { id: true },
        });

        let processed = 0;
        for (const user of subscribers) {
          try {
            const tipRecs = await computeTipRecommendations(user.id);
            const creatorRecs = await computeCreatorRecommendations(user.id);

            await db.recommendationLog.deleteMany({ where: { userId: user.id } });

            const allLogs = [
              ...tipRecs.map((r) => ({
                userId: user.id,
                type: "TIP" as const,
                referenceId: r.tipId,
                score: r.score,
                reason: r.reason,
              })),
              ...creatorRecs.map((r) => ({
                userId: user.id,
                type: "CREATOR" as const,
                referenceId: r.creatorId,
                score: r.score,
                reason: r.reason,
              })),
            ];

            if (allLogs.length > 0) {
              await db.recommendationLog.createMany({ data: allLogs });
            }

            processed++;
          } catch (error) {
            console.error(`[recommendation-worker] Error for user ${user.id}:`, error);
          }
        }

        console.log(`[recommendation-worker] Processed ${processed}/${subscribers.length} users`);
      }
    },
    { connection: getConnection(), concurrency: 3 }
  );
}
