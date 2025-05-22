"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Header from "@/ui/Header";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

const queryClient = new QueryClient();

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
