import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A365D] to-[#2B6CB0]">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gradient-primary">RateMyTip</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
