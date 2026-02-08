"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AdminHeader(): React.ReactElement {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-surface px-6">
      <h1 className="text-lg font-semibold text-primary">
        RateMyTip Admin
      </h1>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-danger"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </header>
  );
}
