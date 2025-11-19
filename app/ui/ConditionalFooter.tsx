"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/app/Footer";

export function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/obr")) {
    return null;
  }

  return <Footer />;
}
