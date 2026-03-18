"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { OfficialOnlyContext } from "@/lib/hooks/useOfficialOnly";
import { getQueryClient } from "@/lib/queryClient";

export function Providers({
  session,
  officialOnly,
  defaultTheme,
  children,
}: {
  session: Session | null;
  officialOnly: boolean;
  defaultTheme?: string;
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <NuqsAdapter>
          <OfficialOnlyContext.Provider value={officialOnly}>
            <ThemeProvider
              attribute="data-theme"
              defaultTheme={defaultTheme ?? "system"}
              enableSystem={!defaultTheme}
              themes={["light", "dark", "parchment"]}
            >
              {children}
            </ThemeProvider>
          </OfficialOnlyContext.Provider>
        </NuqsAdapter>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
