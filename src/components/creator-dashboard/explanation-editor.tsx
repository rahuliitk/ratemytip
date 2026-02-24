"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExplanationEditorProps {
  readonly tipId: string;
  readonly existingContent?: string;
  readonly existingImageUrls?: string[];
  readonly onSaved?: () => void;
}

export function ExplanationEditor({
  tipId,
  existingContent,
  existingImageUrls,
  onSaved,
}: ExplanationEditorProps): React.ReactElement {
  const [content, setContent] = useState(existingContent ?? "");
  const [imageUrlsText, setImageUrlsText] = useState(
    (existingImageUrls ?? []).join("\n")
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isUpdate = !!existingContent;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const imageUrls = imageUrlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/v1/tips/${tipId}/explanation`, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrls }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: isUpdate ? "Explanation updated" : "Explanation added" });
        onSaved?.();
      } else {
        setMessage({ type: "error", text: data.error?.message ?? "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="explanation-content" className="block text-sm font-medium text-text">
          {isUpdate ? "Update your analysis" : "Add your analysis"}
        </label>
        <textarea
          id="explanation-content"
          rows={6}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          maxLength={5000}
          placeholder="Explain your reasoning, technical analysis, key levels to watch..."
        />
        <p className="mt-1 text-xs text-muted">{content.length}/5000</p>
      </div>

      <div>
        <label htmlFor="image-urls" className="block text-sm font-medium text-text">
          Chart/Image URLs (optional, one per line)
        </label>
        <textarea
          id="image-urls"
          rows={2}
          value={imageUrlsText}
          onChange={(e) => setImageUrlsText(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="https://example.com/chart1.png"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}

      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Saving..." : isUpdate ? "Update explanation" : "Add explanation"}
      </Button>
    </form>
  );
}
