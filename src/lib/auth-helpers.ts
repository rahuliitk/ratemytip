import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

const UNAUTHORIZED_RESPONSE = NextResponse.json(
  {
    success: false,
    error: { code: "UNAUTHORIZED", message: "Authentication required" },
  },
  { status: 401 }
);

const FORBIDDEN_RESPONSE = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "Insufficient permissions" },
  },
  { status: 403 }
);

interface AdminSession {
  session: Session;
  adminId: string;
}

interface UserSession {
  session: Session;
  userId: string;
  username: string;
}

/**
 * Require an authenticated admin session.
 * Returns the session + adminId, or a 401/403 NextResponse.
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await auth();
  if (!session?.user) return UNAUTHORIZED_RESPONSE;
  if (session.user.userType !== "admin" || !session.user.adminId) {
    return FORBIDDEN_RESPONSE;
  }
  return { session, adminId: session.user.adminId };
}

/**
 * Require an authenticated public user session.
 * Returns the session + userId + username, or a 401/403 NextResponse.
 */
export async function requireUser(): Promise<UserSession | NextResponse> {
  const session = await auth();
  if (!session?.user) return UNAUTHORIZED_RESPONSE;
  if (session.user.userType !== "user" || !session.user.userId) {
    return FORBIDDEN_RESPONSE;
  }
  return {
    session,
    userId: session.user.userId,
    username: session.user.username ?? "",
  };
}

/**
 * Require any authenticated session (admin or user).
 * Returns the session, or a 401 NextResponse.
 */
export async function requireAuth(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user) return UNAUTHORIZED_RESPONSE;
  return session;
}

/**
 * Get the optional session (no error if not authenticated).
 * Returns the session or null.
 */
export async function getOptionalSession(): Promise<Session | null> {
  return await auth();
}

/**
 * Type guard: check if a result from requireAdmin/requireUser is an error response.
 */
export function isAuthError(
  result: AdminSession | UserSession | Session | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
