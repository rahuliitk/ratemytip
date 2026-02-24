import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("token" in body) ||
      !("newPassword" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Token and new password are required" },
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = body as { token: string; newPassword: string };

    if (typeof token !== "string" || token.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid or expired reset link" },
        },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" },
        },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid or expired reset link" },
        },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "TOKEN_USED", message: "This reset link has already been used" },
        },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "TOKEN_EXPIRED", message: "This reset link has expired" },
        },
        { status: 400 }
      );
    }

    if (!resetToken.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "ACCOUNT_INACTIVE", message: "Account is not active" },
        },
        { status: 403 }
      );
    }

    const passwordHash = await hash(newPassword, 12);

    // Update password and mark token as used in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 }
    );
  }
}
