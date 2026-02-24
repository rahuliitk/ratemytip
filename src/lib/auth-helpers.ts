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

interface CreatorSession {
  session: Session;
  userId: string;
  username: string;
  creatorId: string;
}

/**
 * Require that the authenticated user has the CREATOR role.
 * Returns the session + userId + creatorId, or a 401/403 NextResponse.
 */
export async function requireCreator(): Promise<CreatorSession | NextResponse> {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;

  if (result.session.user.role !== "CREATOR") {
    return FORBIDDEN_RESPONSE;
  }

  const { db } = await import("@/lib/db");
  const user = await db.user.findUnique({
    where: { id: result.userId },
    select: { claimedCreatorId: true },
  });

  if (!user?.claimedCreatorId) {
    return FORBIDDEN_RESPONSE;
  }

  return {
    session: result.session,
    userId: result.userId,
    username: result.username,
    creatorId: user.claimedCreatorId,
  };
}

/**
 * Require that the authenticated creator owns the specified creator profile.
 * Used to ensure a creator can only modify their own profile/tips.
 */
export async function requireCreatorOwnership(
  creatorId: string
): Promise<CreatorSession | NextResponse> {
  const result = await requireCreator();
  if (result instanceof NextResponse) return result;

  if (result.creatorId !== creatorId) {
    return FORBIDDEN_RESPONSE;
  }

  return result;
}

/**
 * Type guard: check if a result from requireAdmin/requireUser/requireCreator is an error response.
 */
export function isAuthError(
  result: AdminSession | UserSession | CreatorSession | Session | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
