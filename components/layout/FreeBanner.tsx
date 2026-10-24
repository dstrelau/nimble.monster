"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLayoutEffect, useState } from "react";
import { dismissBanner } from "@/app/%5Factions/dismissBanner/contract";
import { Button } from "@/components/ui/button";
import { call } from "@/lib/contract";

const STORAGE_KEY = "nimble-nexus-banner-dismissed";

export function FreeBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  useLayoutEffect(() => {
    // Hydration can reset the early root marker; retain its state before paint.
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleDismiss = async () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
    if (session?.user?.id) {
      try {
        await call(dismissBanner, {});
      } catch {
        // Local dismissal is independent of best-effort account persistence.
      }
    }
  };

  if (dismissed || session?.user?.bannerDismissed) {
    return null;
  }

  return (
    <div className="bg-flame text-white px-4 py-2 [[data-free-banner-dismissed=true]_&]:hidden">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <p className="text-sm flex-1">
          This tool is free to use for anyone who already owns the content, is
          trying the system out, or cannot afford to buy it right now. If you
          enjoy Nimble and are able, please support the game by purchasing the
          official content at{" "}
          <Link href="https://nimblerpg.com" className="underline font-bold">
            nimbleRPG.com
          </Link>
          .
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="shrink-0 text-white hover:bg-white/20 hover:text-white"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
