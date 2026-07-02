"use client";

import { usePathname } from "next/navigation";

export function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/obr")) {
    return <>{children}</>;
  }

  return <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>;
}
