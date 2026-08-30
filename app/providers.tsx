"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
import { getQueryClient } from "@/lib/queryClient";
import type { FeatureFlag } from "@/lib/services/featureFlags";

export function Providers({
  session,
  enabledFeatures,
  children,
}: {
  session: Session | null;
  enabledFeatures: readonly FeatureFlag[];
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <FeatureFlagsProvider enabledFeatures={enabledFeatures}>
          <NuqsAdapter>
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="system"
              enableSystem
              themes={["light", "dark"]}
            >
              {children}
            </ThemeProvider>
          </NuqsAdapter>
        </FeatureFlagsProvider>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
