// tests/integration/api/auth.test.ts
//
// Integration tests for auth API endpoints:
//   POST /api/auth/register
//   POST /api/auth/forgot-password
//   POST /api/auth/reset-password
//   GET  /api/auth/verify-email

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendEmailVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
  compare: vi.fn().mockResolvedValue(true),
}));

import { db } from "@/lib/db";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as forgotPasswordPOST } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPOST } from "@/app/api/auth/reset-password/route";
import { GET as verifyEmailGET } from "@/app/api/auth/verify-email/route";

// ──── Tests: Register ────

describe("POST /api/auth/register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates user with valid data", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      username: "testuser",
      role: "CONSUMER",
      createdAt: new Date(),
    } as never);

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
        displayName: "Test User",
        username: "testuser",
      }),
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe("test@example.com");
  });

  it("returns 409 for duplicate email", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "existing" } as never);

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "taken@example.com",
        password: "Password123!",
        displayName: "Test",
        username: "newuser",
      }),
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("returns 409 for duplicate username", async () => {
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(null) // email check
      .mockResolvedValueOnce({ id: "existing" } as never); // username check

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "new@example.com",
        password: "Password123!",
        displayName: "Test",
        username: "takenuser",
      }),
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("USERNAME_TAKEN");
  });

  it("returns 400 for weak password", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "short",
        displayName: "Test",
        username: "testuser",
      }),
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(400);
  });
});

// ──── Tests: Forgot Password ────

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("always returns 200 regardless of email existence", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "nonexistent@example.com" }),
    });

    const res = await forgotPasswordPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("creates token when user exists", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(db.passwordResetToken.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.passwordResetToken.create).mockResolvedValue({} as never);

    const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "exists@example.com" }),
    });

    const res = await forgotPasswordPOST(req);
    expect(res.status).toBe(200);
    expect(db.passwordResetToken.create).toHaveBeenCalled();
  });
});

// ──── Tests: Reset Password ────

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resets password with valid token", async () => {
    vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 3600000),
      user: { id: "user-1", isActive: true },
    } as never);
    vi.mocked(db.$transaction).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: "a".repeat(64),
        newPassword: "NewPassword123!",
      }),
    });

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 for expired token", async () => {
    vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 3600000), // expired
      user: { id: "user-1", isActive: true },
    } as never);

    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: "a".repeat(64),
        newPassword: "NewPassword123!",
      }),
    });

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 400 for used token", async () => {
    vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      user: { id: "user-1", isActive: true },
    } as never);

    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: "a".repeat(64),
        newPassword: "NewPassword123!",
      }),
    });

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("TOKEN_USED");
  });
});

// ──── Tests: Verify Email ────

describe("GET /api/auth/verify-email", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies email with valid token", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "user-1",
      emailVerified: null,
    } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);

    const req = new NextRequest(
      "http://localhost:3000/api/auth/verify-email?token=valid-token"
    );

    const res = await verifyEmailGET(req);
    // Should redirect to login with verified=true
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?verified=true");
  });

  it("redirects with error for invalid token", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = new NextRequest(
      "http://localhost:3000/api/auth/verify-email?token=invalid-token"
    );

    const res = await verifyEmailGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_token");
  });

  it("redirects with error when no token provided", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/auth/verify-email"
    );

    const res = await verifyEmailGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_token");
  });
});
