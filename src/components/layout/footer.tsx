import Link from "next/link";
import { Github } from "lucide-react";

export function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted">
            &copy; {currentYear} RateMyTip. All rights reserved.
          </p>
          <nav className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted transition-colors hover:text-primary"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <a
              href="https://github.com/rahuliitk/ratemytip"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Every Call. Rated. RateMyTip is{" "}
          <a
            href="https://github.com/rahuliitk/ratemytip"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            open source
          </a>
          {" "}&mdash; track, verify, and score stock market tips from influencers and analysts.
        </p>
      </div>
    </footer>
  );
}
