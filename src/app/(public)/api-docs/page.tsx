import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation | RateMyTip",
  description: "RateMyTip public API endpoints reference",
};

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/leaderboard", auth: "Public", description: "Leaderboard rankings with filtering and pagination" },
  { method: "GET", path: "/api/v1/creators", auth: "Public", description: "List creators with search and filters" },
  { method: "GET", path: "/api/v1/creators/:idOrSlug", auth: "Public", description: "Creator profile with score and recent tips" },
  { method: "GET", path: "/api/v1/creators/:id/tips", auth: "Public", description: "Paginated tips for a creator" },
  { method: "GET", path: "/api/v1/creators/:id/score-history", auth: "Public", description: "Score history for charting" },
  { method: "GET", path: "/api/v1/tips", auth: "Public", description: "List tips with filters" },
  { method: "GET", path: "/api/v1/tips/:id", auth: "Public", description: "Single tip detail" },
  { method: "GET", path: "/api/v1/stocks", auth: "Public", description: "List stocks with search" },
  { method: "GET", path: "/api/v1/stocks/:symbol", auth: "Public", description: "Stock detail with tips and consensus" },
  { method: "GET", path: "/api/v1/search", auth: "Public", description: "Search creators, stocks, and tips" },
  { method: "POST", path: "/api/v1/checkout/session", auth: "User", description: "Create Stripe checkout session" },
  { method: "GET", path: "/api/v1/subscriptions/current", auth: "User", description: "Get current subscription status" },
  { method: "POST", path: "/api/v1/subscriptions/cancel", auth: "User", description: "Cancel subscription at period end" },
  { method: "POST", path: "/api/v1/subscriptions/portal", auth: "User", description: "Get Stripe customer portal URL" },
  { method: "GET", path: "/api/v1/portfolio", auth: "User", description: "Portfolio summary with positions" },
  { method: "POST", path: "/api/v1/portfolio/entries", auth: "User", description: "Add tip to portfolio" },
  { method: "PATCH", path: "/api/v1/portfolio/entries/:id", auth: "User", description: "Close a portfolio position" },
  { method: "DELETE", path: "/api/v1/portfolio/entries/:id", auth: "User", description: "Remove a portfolio entry" },
  { method: "GET", path: "/api/v1/portfolio/history", auth: "User", description: "Portfolio value history" },
  { method: "GET", path: "/api/v1/portfolio/analytics", auth: "PRO+", description: "Detailed portfolio analytics" },
  { method: "GET", path: "/api/v1/recommendations", auth: "PRO+", description: "Personalized tip recommendations" },
  { method: "GET", path: "/api/v1/recommendations/creators", auth: "PRO+", description: "Recommended creators" },
  { method: "GET", path: "/api/v1/user/preferences", auth: "User", description: "Get user preferences" },
  { method: "POST", path: "/api/v1/user/preferences", auth: "User", description: "Update user preferences" },
  { method: "GET", path: "/api/health", auth: "Public", description: "Health check (DB + Redis)" },
] as const;

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PATCH: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
};

const AUTH_COLORS: Record<string, string> = {
  Public: "bg-gray-100 text-gray-700",
  User: "bg-blue-50 text-blue-700",
  "PRO+": "bg-purple-50 text-purple-700",
};

export default function ApiDocsPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-primary">API Reference</h1>
      <p className="mb-8 text-muted">
        All responses use the envelope format: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{"{ success, data, error? }"}</code>.
        Rate limit: 60 req/min for public endpoints, 10 req/min for search.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {ENDPOINTS.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="flex items-center gap-3 py-3">
                <span className={`inline-block w-16 rounded px-2 py-0.5 text-center text-xs font-bold ${METHOD_COLORS[ep.method] ?? ""}`}>
                  {ep.method}
                </span>
                <code className="min-w-0 flex-1 truncate text-sm">{ep.path}</code>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${AUTH_COLORS[ep.auth] ?? ""}`}>
                  {ep.auth}
                </Badge>
                <span className="hidden text-xs text-muted sm:block">{ep.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
