"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/ui/Header";

export function ConditionalHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/obr")) {
    return null;
  }

  return <Header />;
}
