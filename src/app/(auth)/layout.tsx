import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Brand (hidden on mobile, shown on md+) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-accent/90 md:flex">
        <div className="dot-pattern absolute inset-0" />
        <div className="relative z-10 flex max-w-md flex-col items-center px-8 text-center">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">RateMyTip</span>
          </Link>
          <p className="mb-4 text-xl font-semibold text-white">
            Every Call. Rated.
          </p>
          <p className="text-sm leading-relaxed text-white/70">
            Track, verify, and score stock market tips from India&apos;s top
            financial influencers. Transparent, data-driven accountability for
            every call.
          </p>
        </div>
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Right Panel - Form Content */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-surface px-4 md:w-1/2">
        {/* Mobile logo (shown only on small screens) */}
        <div className="mb-8 md:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent/90">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient-primary">
              RateMyTip
            </span>
          </Link>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
