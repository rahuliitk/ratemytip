"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToPortfolioButtonProps {
  readonly tipId: string;
  readonly className?: string;
}

type ButtonState = "idle" | "loading" | "success" | "error";

export function AddToPortfolioButton({
  tipId,
  className,
}: AddToPortfolioButtonProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [state, setState] = useState<ButtonState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleClick(): Promise<void> {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/portfolio/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipId, quantity: 1 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error?.message ?? "Failed to add to portfolio";
        setState("error");
        setErrorMessage(message);
        setTimeout(() => {
          setState("idle");
          setErrorMessage("");
        }, 3000);
        return;
      }

      setState("success");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again.");
      setTimeout(() => {
        setState("idle");
        setErrorMessage("");
      }, 3000);
    }
  }

  return (
    <div className={cn("relative inline-flex flex-col items-start", className)}>
      <Button
        variant={state === "success" ? "secondary" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={state === "loading" || state === "success"}
        className={cn(
          state === "success" && "border-transparent bg-[#C6F6D5] text-[#276749]",
          state === "error" && "border-[#C53030] text-[#C53030]"
        )}
      >
        {state === "idle" && (
          <>
            <Plus className="h-3.5 w-3.5" />
            Portfolio
          </>
        )}
        {state === "loading" && (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Adding...
          </>
        )}
        {state === "success" && (
          <>
            <Check className="h-3.5 w-3.5" />
            Added
          </>
        )}
        {state === "error" && (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            Error
          </>
        )}
      </Button>
      {state === "error" && errorMessage && (
        <span className="mt-1 text-xs text-[#C53030]">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
