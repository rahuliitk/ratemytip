import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  const user = await db.user.findUnique({
    where: { emailVerificationToken: token },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  if (user.emailVerified) {
    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationToken: null,
    },
  });

  return NextResponse.redirect(new URL("/login?verified=true", request.url));
}
