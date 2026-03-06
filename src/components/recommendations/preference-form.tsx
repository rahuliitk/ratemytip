"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const TIMEFRAMES = ["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"] as const;
const ASSET_CLASSES = ["EQUITY", "INDEX", "FUTURES", "OPTIONS", "CRYPTO", "COMMODITY", "FOREX"] as const;
const RISK_LEVELS = ["LOW", "MODERATE", "HIGH"] as const;

interface Prefs {
  preferredTimeframes: string[];
  preferredAssetClasses: string[];
  riskTolerance: string;
  minCreatorScore: number | null;
  preferredSectors: string[];
}

export function PreferenceForm(): React.ReactElement {
  const [prefs, setPrefs] = useState<Prefs>({
    preferredTimeframes: [],
    preferredAssetClasses: [],
    riskTolerance: "MODERATE",
    minCreatorScore: null,
    preferredSectors: [],
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/v1/user/preferences")
      .then((r) => r.json())
      .then((res) => { if (res.success) setPrefs(res.data); });
  }, []);

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/v1/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: "Preferences saved! Recommendations will update shortly." });
      } else {
        setMsg({ type: "error", text: data.error?.message ?? "Failed to save preferences" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error" });
    }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="text-base font-semibold text-text">Recommendation Preferences</h2>
        <p className="mt-0.5 text-sm text-muted">Customize what tips and creators are recommended to you</p>
      </div>
      <div className="space-y-6 px-6 py-5">
        {/* Timeframes */}
        <div>
          <Label className="mb-2.5 block text-sm font-medium text-text">Preferred Timeframes</Label>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAMES.map((tf) => (
              <Badge
                key={tf}
                variant={prefs.preferredTimeframes.includes(tf) ? "default" : "outline"}
                className="cursor-pointer transition-all duration-150 hover:shadow-sm"
                onClick={() => setPrefs({ ...prefs, preferredTimeframes: toggleItem(prefs.preferredTimeframes, tf) })}
              >
                {tf.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Asset Classes */}
        <div>
          <Label className="mb-2.5 block text-sm font-medium text-text">Preferred Asset Classes</Label>
          <div className="flex flex-wrap gap-2">
            {ASSET_CLASSES.map((ac) => (
              <Badge
                key={ac}
                variant={prefs.preferredAssetClasses.includes(ac) ? "default" : "outline"}
                className="cursor-pointer transition-all duration-150 hover:shadow-sm"
                onClick={() => setPrefs({ ...prefs, preferredAssetClasses: toggleItem(prefs.preferredAssetClasses, ac) })}
              >
                {ac}
              </Badge>
            ))}
          </div>
        </div>

        {/* Risk Tolerance */}
        <div>
          <Label className="mb-2.5 block text-sm font-medium text-text">Risk Tolerance</Label>
          <div className="flex gap-2">
            {RISK_LEVELS.map((level) => (
              <Badge
                key={level}
                variant={prefs.riskTolerance === level ? "default" : "outline"}
                className="cursor-pointer transition-all duration-150 hover:shadow-sm"
                onClick={() => setPrefs({ ...prefs, riskTolerance: level })}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>

        {/* Min Creator Score */}
        <div>
          <Label className="mb-2.5 block text-sm font-medium text-text">
            Minimum Creator RMT Score
            {prefs.minCreatorScore !== null && (
              <span className="ml-2 font-bold text-accent tabular-nums">{prefs.minCreatorScore}</span>
            )}
          </Label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={prefs.minCreatorScore ?? 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setPrefs({ ...prefs, minCreatorScore: val === 0 ? null : val });
            }}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-muted">
            <span>Any</span>
            <span>100</span>
          </div>
        </div>

        {msg && (
          <div className={`rounded-lg p-3 text-sm ${msg.type === "success" ? "bg-success-light text-success" : "bg-danger-light text-danger"}`}>
            {msg.text}
          </div>
        )}

        <Button variant="glow" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
