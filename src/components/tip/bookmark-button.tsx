"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  readonly tipId: string;
  readonly initialSaved: boolean;
}

export function BookmarkButton({ tipId, initialSaved }: BookmarkButtonProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleToggle(): Promise<void> {
    if (!session?.user?.userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    const prevState = saved;
    setSaved(!saved); // optimistic

    try {
      const res = await fetch(`/api/v1/tips/${tipId}/save`, {
        method: saved ? "DELETE" : "POST",
      });

      if (!res.ok) setSaved(prevState);
    } catch {
      setSaved(prevState);
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="rounded-md p-2 text-muted transition-colors hover:bg-bg hover:text-primary disabled:cursor-not-allowed"
      aria-label={saved ? "Unsave tip" : "Save tip"}
    >
      <Bookmark
        className={`h-5 w-5 ${saved ? "fill-accent text-accent" : ""}`}
      />
    </button>
  );
}
