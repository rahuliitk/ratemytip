"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage(): React.ReactElement {
  const { data: session, update: updateSession } = useSession();
  const sessionName = session?.user?.name ?? "";
  const [displayName, setDisplayName] = useState(sessionName);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMsg, setDeleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync display name when session loads
  const [prevSessionName, setPrevSessionName] = useState(sessionName);
  if (sessionName !== prevSessionName) {
    setPrevSessionName(sessionName);
    if (sessionName) setDisplayName(sessionName);
  }

  async function handleProfileSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);

    try {
      const res = await fetch("/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setProfileMsg({ type: "error", text: data.error?.message ?? "Failed to update profile" });
      } else {
        setProfileMsg({ type: "success", text: "Profile updated successfully" });
        await updateSession({ name: displayName });
      }
    } catch {
      setProfileMsg({ type: "error", text: "An unexpected error occurred" });
    }
    setProfileLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/v1/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPasswordMsg({ type: "error", text: data.error?.message ?? "Failed to change password" });
      } else {
        setPasswordMsg({ type: "success", text: "Password changed successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "An unexpected error occurred" });
    }
    setPasswordLoading(false);
  }

  async function handleDeleteAccount(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setDeleteMsg(null);
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/v1/user/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteMsg({ type: "error", text: data.error?.message ?? "Failed to delete account" });
      } else {
        await signOut({ callbackUrl: "/" });
      }
    } catch {
      setDeleteMsg({ type: "error", text: "An unexpected error occurred" });
    }
    setDeleteLoading(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile section */}
        <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-base font-semibold text-text">Profile</h2>
            <p className="mt-0.5 text-sm text-muted">Update your display name and profile information</p>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileMsg && (
                <div className={`rounded-lg p-3 text-sm ${profileMsg.type === "success" ? "bg-success-light text-success" : "bg-danger-light text-danger"}`}>
                  {profileMsg.text}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={session?.user?.email ?? ""} disabled className="bg-bg-alt" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={session?.user?.username ?? ""} disabled className="bg-bg-alt" />
                <p className="text-xs text-muted">Username cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>
              <Button type="submit" variant="glow" disabled={profileLoading}>
                {profileLoading ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </div>
        </div>

        {/* Password section */}
        <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-base font-semibold text-text">Change Password</h2>
            <p className="mt-0.5 text-sm text-muted">Update your account password</p>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMsg && (
                <div className={`rounded-lg p-3 text-sm ${passwordMsg.type === "success" ? "bg-success-light text-success" : "bg-danger-light text-danger"}`}>
                  {passwordMsg.text}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" variant="glow" disabled={passwordLoading}>
                {passwordLoading ? "Changing..." : "Change password"}
              </Button>
            </form>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-danger/20 bg-surface shadow-sm">
          <div className="border-b border-danger/20 px-6 py-4">
            <h2 className="text-base font-semibold text-danger">Danger Zone</h2>
            <p className="mt-0.5 text-sm text-muted">
              Permanently delete your account and all associated data
            </p>
          </div>
          <div className="px-6 py-5">
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="border-danger/30 text-danger hover:bg-danger-light"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete my account
              </Button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                {deleteMsg && (
                  <div className={`rounded-lg p-3 text-sm ${deleteMsg.type === "error" ? "bg-danger-light text-danger" : "bg-success-light text-success"}`}>
                    {deleteMsg.text}
                  </div>
                )}
                <p className="text-sm text-danger">
                  This action is irreversible. Your profile, comments, and ratings will be anonymized.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="deletePassword">Confirm your password</Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-danger/30 text-danger hover:bg-danger-light"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Permanently delete"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                      setDeleteMsg(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
