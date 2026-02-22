import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid registration data",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { email, password, displayName, username } = parsed.data;

    // Check for existing email
    const existingEmail = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_TAKEN",
            message: "An account with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    // Check for existing username
    const existingUsername = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USERNAME_TAKEN",
            message: "This username is already taken",
          },
        },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        username,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
