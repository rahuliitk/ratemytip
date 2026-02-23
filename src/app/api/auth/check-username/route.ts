import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const username = request.nextUrl.searchParams.get("username");

  if (!username || username.length < 3 || username.length > 30) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Username must be 3-30 characters" } },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid username format" } },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });

  return NextResponse.json({
    success: true,
    available: !existing,
  });
}
