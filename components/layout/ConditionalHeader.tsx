"use client";

import { usePathname } from "next/navigation";
import Header, { type AllNavCounts } from "@/components/layout/Header";

interface ConditionalHeaderProps {
  initialCounts: AllNavCounts;
}

export function ConditionalHeader({ initialCounts }: ConditionalHeaderProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/obr")) {
    return null;
  }

  return <Header initialCounts={initialCounts} />;
}
