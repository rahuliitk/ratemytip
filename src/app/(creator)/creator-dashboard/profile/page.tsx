"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ProfileData {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  profileImageUrl: string | null;
  specializations: string[];
  tier: string;
  platforms: Array<{
    id: string;
    platform: string;
    platformHandle: string;
    platformUrl: string;
    followerCount: number;
  }>;
}

export default function ProfilePage(): React.ReactElement {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  useEffect(() => {
    async function fetchProfile(): Promise<void> {
      try {
        const res = await fetch("/api/v1/creator-dashboard/profile");
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setBio(data.data.bio ?? "");
          setSpecializations(data.data.specializations.join(", "));
          setProfileImageUrl(data.data.profileImageUrl ?? "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/creator-dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || null,
          specializations: specializations
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          profileImageUrl: profileImageUrl || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        setMessage({ type: "error", text: data.error?.message ?? "Update failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-bg" />
        <div className="h-64 animate-pulse rounded-lg bg-bg" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-danger">Failed to load profile</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Edit Profile</h1>
        <p className="text-sm text-muted">Update your creator profile information</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-surface p-6">
        <div className="mb-4">
          <p className="text-sm font-medium text-text">{profile.displayName}</p>
          <p className="text-xs text-muted">@{profile.slug} &middot; {profile.tier}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-text">Bio</label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              maxLength={500}
              placeholder="Tell people about yourself and your trading style..."
            />
            <p className="mt-1 text-xs text-muted">{bio.length}/500</p>
          </div>

          <div>
            <label htmlFor="specializations" className="block text-sm font-medium text-text">
              Specializations
            </label>
            <input
              id="specializations"
              type="text"
              value={specializations}
              onChange={(e) => setSpecializations(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="INTRADAY, OPTIONS, LARGE_CAP (comma-separated)"
            />
            <p className="mt-1 text-xs text-muted">Comma-separated tags</p>
          </div>

          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-text">
              Profile Image URL
            </label>
            <input
              id="avatar"
              type="url"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-success" : "text-danger"}`}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </div>

      {/* Connected Platforms (read-only) */}
      <div className="rounded-lg border border-gray-200 bg-surface p-6">
        <h2 className="text-lg font-bold text-primary">Connected Platforms</h2>
        <p className="mt-1 text-xs text-muted">
          Platforms linked to your creator profile (managed by admin)
        </p>
        <div className="mt-4 space-y-2">
          {profile.platforms.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md bg-bg px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-text">{p.platform}</span>
                <span className="ml-2 text-muted">@{p.platformHandle}</span>
              </div>
              <span className="text-xs text-muted">{p.followerCount.toLocaleString()} followers</span>
            </div>
          ))}
          {profile.platforms.length === 0 && (
            <p className="text-sm text-muted">No platforms linked</p>
          )}
        </div>
      </div>
    </div>
  );
}
