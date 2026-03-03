"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, XCircle, CheckCircle2 } from "lucide-react";

interface SubscriptionData {
  tier: string;
  subscription: {
    tier: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  payments: {
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    createdAt: string;
  }[];
}

function BillingContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/subscriptions/current")
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(): Promise<void> {
    if (!confirm("Cancel your subscription? You'll retain access until the end of your billing period.")) return;
    setCanceling(true);
    await fetch("/api/v1/subscriptions/cancel", { method: "POST" });
    // Refresh data
    const res = await fetch("/api/v1/subscriptions/current").then((r) => r.json());
    if (res.success) setData(res.data);
    setCanceling(false);
  }

  async function handlePortal(): Promise<void> {
    setPortalLoading(true);
    const res = await fetch("/api/v1/subscriptions/portal", { method: "POST" }).then((r) => r.json());
    if (res.success) window.location.href = res.data.url;
    setPortalLoading(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl shimmer" />
          <div className="h-40 rounded-xl shimmer" />
        </div>
      </div>
    );
  }

  const sub = data?.subscription;
  const tier = data?.tier ?? "FREE";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-muted">Manage your plan and payment history</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-light p-4 text-sm text-success">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Subscription activated successfully!
          </div>
        )}

        {/* Current Plan */}
        <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-text">
              <CreditCard className="h-5 w-5 text-muted" />
              Current Plan
            </h2>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={tier === "FREE" ? "secondary" : "default"} className="text-sm">
                  {tier}
                </Badge>
                {sub && (
                  <div className="mt-2 text-sm text-muted">
                    {sub.cancelAtPeriodEnd ? (
                      <span className="text-warning">
                        Cancels on {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    ) : (
                      <>Renews on {new Date(sub.currentPeriodEnd).toLocaleDateString()}</>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {sub && sub.status === "ACTIVE" && !sub.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={canceling}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    {canceling ? "Canceling..." : "Cancel"}
                  </Button>
                )}
                {sub && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePortal}
                    disabled={portalLoading}
                  >
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Manage in Stripe
                  </Button>
                )}
                {tier === "FREE" && (
                  <Button size="sm" asChild>
                    <a href="/pricing">Upgrade</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {data?.payments && data.payments.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
            <div className="border-b border-border/60 px-6 py-4">
              <h2 className="text-base font-semibold text-text">Payment History</h2>
              <p className="mt-0.5 text-sm text-muted">Your recent transactions</p>
            </div>
            <div className="divide-y divide-border/60 px-6">
              {data.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium text-text">{p.description ?? "Subscription payment"}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-text">
                      {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                    </p>
                    <Badge
                      variant={p.status === "SUCCEEDED" ? "default" : "destructive"}
                      className="mt-1 text-xs"
                    >
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingPage(): React.ReactElement {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl shimmer" />
          <div className="h-40 rounded-xl shimmer" />
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
