"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ExperienceLevelProvider } from "@/components/beginner/beginner-mode-toggle";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <ExperienceLevelProvider>{children}</ExperienceLevelProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
