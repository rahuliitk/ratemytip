// src/lib/queue/workers/portfolio-worker.ts
//
// Recalculates unrealized P&L for all users with open positions,
// and creates daily portfolio snapshots at market close.

import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { calculatePositionPnl } from "@/lib/portfolio";

function getConnection() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
  };
}

export function createPortfolioWorker(): Worker {
  return new Worker(
    "portfolio",
    async (job) => {
      const type = job.data.type as string;
      console.log(`[portfolio-worker] Processing job: ${type}`);

      if (type === "recalculate-all") {
        // Get all open entries grouped by stock for efficient price lookups
        const openEntries = await db.portfolioEntry.findMany({
          where: { status: "OPEN" },
          include: {
            tip: {
              select: {
                direction: true,
                stock: { select: { lastPrice: true } },
              },
            },
          },
        });

        let updated = 0;
        for (const entry of openEntries) {
          const currentPrice = entry.tip.stock.lastPrice;
          if (currentPrice === null || currentPrice === undefined) continue;

          const pnl = calculatePositionPnl(
            entry.entryPrice,
            currentPrice,
            entry.quantity,
            entry.tip.direction,
            false
          );

          await db.portfolioEntry.update({
            where: { id: entry.id },
            data: { unrealizedPnl: pnl.pnl },
          });
          updated++;
        }

        console.log(`[portfolio-worker] Updated unrealized P&L for ${updated} positions`);
      }

      if (type === "snapshot") {
        // Create daily snapshots for all portfolios with entries
        const portfolios = await db.portfolio.findMany({
          include: {
            entries: {
              include: {
                tip: {
                  select: {
                    direction: true,
                    stock: { select: { lastPrice: true } },
                  },
                },
              },
            },
          },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let snapshotCount = 0;

        for (const portfolio of portfolios) {
          let totalValue = 0;
          let totalInvested = 0;
          let openCount = 0;

          for (const entry of portfolio.entries) {
            const invested = entry.entryPrice * entry.quantity;
            totalInvested += invested;

            if (entry.status === "OPEN") {
              const price = entry.tip.stock.lastPrice ?? entry.entryPrice;
              const pnl = calculatePositionPnl(entry.entryPrice, price, entry.quantity, entry.tip.direction, false);
              totalValue += invested + pnl.pnl;
              openCount++;
            } else {
              const closedPrice = entry.closedPrice ?? entry.entryPrice;
              const pnl = calculatePositionPnl(entry.entryPrice, closedPrice, entry.quantity, entry.tip.direction, true);
              totalValue += invested + pnl.pnl;
            }
          }

          await db.portfolioSnapshot.upsert({
            where: { portfolioId_date: { portfolioId: portfolio.id, date: today } },
            create: {
              portfolioId: portfolio.id,
              date: today,
              totalValue,
              totalPnl: totalValue - totalInvested,
              openCount,
            },
            update: {
              totalValue,
              totalPnl: totalValue - totalInvested,
              openCount,
            },
          });
          snapshotCount++;
        }

        console.log(`[portfolio-worker] Created ${snapshotCount} portfolio snapshots`);
      }
    },
    { connection: getConnection(), concurrency: 5 }
  );
}
