import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { NOTIFICATION } from "@/lib/constants";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const email = typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email)
      : "";

    if (!email || !email.includes("@")) {
      // Still return 200 to prevent enumeration
      return NextResponse.json({ success: true });
    }

    const user = await db.user.findUnique({
      where: { email, isActive: true },
      select: { id: true },
    });

    if (user) {
      // Generate a secure random token
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      const expiresAt = new Date(
        Date.now() + NOTIFICATION.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000
      );

      // Invalidate any existing tokens for this user
      await db.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Create new token
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Send email (fire and forget — don't block response)
      sendPasswordResetEmail(email, rawToken).catch(() => {
        // Silently fail — user can request another
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
