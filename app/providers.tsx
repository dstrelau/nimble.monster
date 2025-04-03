"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthContext } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/ui/Header";

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useQuery({
    queryKey: ["currentUser"],
    queryFn: () =>
      fetch("/api/users/me", { credentials: "same-origin" }).then((res) => {
        if (!res.ok) return null;
        return res.json();
      }),
  });

  return (
    <AuthContext.Provider value={currentUser}>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </AuthContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
