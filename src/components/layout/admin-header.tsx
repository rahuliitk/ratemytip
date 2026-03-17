"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function AdminHeader(): React.ReactElement {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      {/* Breadcrumb area */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Admin Panel</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-alt">
            <User className="h-4 w-4 text-muted" />
          </div>
          <span className="text-sm font-medium text-text">Admin</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
