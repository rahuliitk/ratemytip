import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <BarChart3 className="h-8 w-8 text-accent" />
        <span className="text-2xl font-bold text-primary">RateMyTip</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
