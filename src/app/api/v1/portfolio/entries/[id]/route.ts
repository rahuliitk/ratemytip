// PATCH /api/v1/portfolio/entries/:id — Close a position
// DELETE /api/v1/portfolio/entries/:id — Remove an entry
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { closePortfolioEntrySchema } from "@/lib/validators/portfolio";
import { calculatePositionPnl } from "@/lib/portfolio";

interface Params {
  params: Promise<{ id: string }>;
}

async function getOwnedEntry(userId: string, entryId: string) {
  const entry = await db.portfolioEntry.findUnique({
    where: { id: entryId },
    include: {
      portfolio: { select: { userId: true } },
      tip: { select: { direction: true } },
    },
  });
  if (!entry || entry.portfolio.userId !== userId) return null;
  return entry;
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;
  const { id } = await params;

  const entry = await getOwnedEntry(result.userId, id);
  if (!entry) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Portfolio entry not found" } },
      { status: 404 }
    );
  }

  if (entry.status === "CLOSED") {
    return NextResponse.json(
      { success: false, error: { code: "ALREADY_CLOSED", message: "Position is already closed" } },
      { status: 400 }
    );
  }

  const body: unknown = await request.json();
  const parsed = closePortfolioEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const pnl = calculatePositionPnl(
    entry.entryPrice,
    parsed.data.closedPrice,
    entry.quantity,
    entry.tip.direction,
    true
  );

  const updated = await db.portfolioEntry.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedPrice: parsed.data.closedPrice,
      closedAt: new Date(),
      realizedPnl: pnl.pnl,
      unrealizedPnl: null,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;
  const { id } = await params;

  const entry = await getOwnedEntry(result.userId, id);
  if (!entry) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Portfolio entry not found" } },
      { status: 404 }
    );
  }

  await db.portfolioEntry.delete({ where: { id } });

  return NextResponse.json({ success: true, data: { deleted: true } });
}
