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
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

const AUTH_BADGE_STYLES: Record<string, string> = {
  Public: "bg-bg-alt text-text-secondary",
  User: "bg-accent/10 text-accent",
  "PRO+": "bg-purple-100 text-purple-700",
};

export default function ApiDocsPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text">API Reference</h1>
        <p className="mt-3 text-muted">
          All responses use the envelope format:{" "}
          <code className="rounded-lg bg-primary px-2 py-0.5 text-xs font-mono text-white/90">
            {"{ success, data, error? }"}
          </code>
        </p>
        <p className="mt-2 text-sm text-muted">
          Rate limit: 60 req/min for public endpoints, 10 req/min for search.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-8 rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Base URL
        </h2>
        <div className="rounded-lg bg-primary p-4 font-mono text-sm text-white/90">
          https://ratemytip.com
        </div>
      </div>

      {/* Authentication Info */}
      <div className="mb-8 rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Authentication
        </h2>
        <p className="text-sm text-text-secondary">
          Public endpoints require no authentication. User and PRO+ endpoints
          require a valid session token passed via cookies (NextAuth). Include
          credentials in your requests when calling protected endpoints.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Public -- No auth required
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            User -- Session required
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            PRO+ -- Pro or Premium subscription
          </span>
        </div>
      </div>

      {/* Endpoints */}
      <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
        <div className="border-b border-border/40 px-5 py-4">
          <h2 className="text-lg font-semibold text-text">Endpoints</h2>
          <p className="mt-0.5 text-sm text-muted">
            {ENDPOINTS.length} endpoints available
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {ENDPOINTS.map((ep) => (
            <div
              key={`${ep.method}-${ep.path}`}
              className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block w-[4.5rem] rounded-md px-2 py-0.5 text-center text-xs font-mono font-bold ${
                    METHOD_COLORS[ep.method] ?? ""
                  }`}
                >
                  {ep.method}
                </span>
                <code className="min-w-0 flex-1 truncate text-sm font-mono text-text">
                  {ep.path}
                </code>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    AUTH_BADGE_STYLES[ep.auth] ?? ""
                  }`}
                >
                  {ep.auth}
                </span>
                <span className="hidden text-xs text-muted lg:block">
                  {ep.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Format Example */}
      <div className="mt-8 rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Response Format
        </h2>
        <div className="rounded-lg bg-primary p-4 font-mono text-sm text-white/90">
          <pre className="overflow-x-auto">
{`// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "hasMore": true
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
