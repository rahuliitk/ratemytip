"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  readonly creatorId: string;
  readonly initialFollowing: boolean;
}

export function FollowButton({ creatorId, initialFollowing }: FollowButtonProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleToggle(): Promise<void> {
    if (!session?.user?.userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    const prevState = following;
    setFollowing(!following); // optimistic

    try {
      const res = await fetch("/api/v1/follows", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });

      if (!res.ok) {
        setFollowing(prevState); // revert
      }
    } catch {
      setFollowing(prevState); // revert
    }
    setLoading(false);
  }

  return (
    <Button
      variant={following ? "secondary" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {following ? (
        <>
          <UserCheck className="mr-1 h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-1 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
