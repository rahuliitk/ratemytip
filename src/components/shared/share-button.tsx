"use client";

import * as React from "react";
import { Share2, Check, Twitter, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  readonly url?: string;
  readonly title?: string;
  readonly className?: string;
}

export function ShareButton({
  url,
  title = "Check this out on RateMyTip",
  className,
}: ShareButtonProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleCopyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleShareTwitter = React.useCallback(() => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }, [title, shareUrl]);

  const handleShareWhatsApp = React.useCallback(() => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${shareUrl}`)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [title, shareUrl]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          <span>{copied ? "Copied!" : "Share"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border border-border/60 shadow-lg">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2.5 px-3 py-2">
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Share2 className="h-4 w-4 text-muted" />
          )}
          <span>Copy Link</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer gap-2.5 px-3 py-2">
          <Twitter className="h-4 w-4 text-muted" />
          <span>Share on X</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer gap-2.5 px-3 py-2">
          <MessageCircle className="h-4 w-4 text-muted" />
          <span>Share on WhatsApp</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
