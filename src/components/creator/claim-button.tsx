"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface ClaimButtonProps {
  readonly creatorId: string;
  readonly creatorName: string;
}

export function ClaimButton({ creatorId, creatorName }: ClaimButtonProps): React.ReactElement | null {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Only show for logged-in users who are not already creators
  const isUser = session?.user?.userType === "user";
  const isCreator = session?.user?.role === "CREATOR";
  if (!isUser || isCreator) return null;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/v1/creators/${creatorId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl, verificationNote: note || undefined }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "Claim submitted! An admin will review your request." });
        setShowForm(false);
      } else {
        setResult({ success: false, message: data.error?.message ?? "Failed to submit claim" });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (result?.success) {
    return (
      <div className="rounded-xl bg-[#276749]/10 px-3 py-2 text-sm text-[#276749]">
        {result.message}
      </div>
    );
  }

  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
        className="gap-1.5"
      >
        <ShieldCheck className="h-4 w-4" />
        Claim this profile
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
      <h3 className="text-sm font-bold text-gradient-primary">
        Claim {creatorName}&apos;s profile
      </h3>
      <p className="mt-1 text-xs text-muted">
        Provide a link to your social media profile that matches this creator to verify ownership.
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="proof-url" className="block text-xs font-medium text-text">
            Proof URL *
          </label>
          <input
            id="proof-url"
            type="url"
            required
            placeholder="https://twitter.com/yourusername"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-100 px-3 py-2 text-sm transition-colors duration-200 focus:border-[#2B6CB0] focus:outline-none focus:ring-1 focus:ring-[#2B6CB0]/20"
          />
        </div>

        <div>
          <label htmlFor="claim-note" className="block text-xs font-medium text-text">
            Additional note (optional)
          </label>
          <textarea
            id="claim-note"
            rows={2}
            placeholder="Any additional information to help verify your identity..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-100 px-3 py-2 text-sm transition-colors duration-200 focus:border-[#2B6CB0] focus:outline-none focus:ring-1 focus:ring-[#2B6CB0]/20"
            maxLength={1000}
          />
        </div>

        {result && !result.success && (
          <p className="text-xs text-danger">{result.message}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Submitting..." : "Submit claim"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
