import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validators/user";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid password data", details: parsed.error.flatten() },
      },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NO_PASSWORD",
          message: "Account uses OAuth login. Set a password in settings first.",
        },
      },
      { status: 400 }
    );
  }

  const isValid = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" } },
      { status: 400 }
    );
  }

  const newHash = await hash(parsed.data.newPassword, 12);
  await db.user.update({
    where: { id: session.user.userId },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ success: true, data: { message: "Password changed successfully" } });
}
