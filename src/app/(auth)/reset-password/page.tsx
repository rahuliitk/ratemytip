"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">Invalid link</h1>
        <p className="mt-2 text-sm text-muted">
          This password reset link is invalid or has expired.
        </p>
        <div className="mt-8">
          <Link
            href="/forgot-password"
            className="text-sm text-accent hover:text-accent-hover hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-text">Password reset!</h1>
        <p className="mt-2 text-sm text-muted">
          Your password has been updated. You can now sign in with your new
          password.
        </p>
        <div className="mt-8">
          <Button variant="glow" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Failed to reset password");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    }

    setLoading(false);
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <Button
          type="submit"
          variant="glow"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        <Link
          href="/login"
          className="text-accent hover:text-accent-hover hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl shimmer" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
