"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { dismissBanner } from "@/app/actions/user";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nimble-nexus-banner-dismissed";

export function FreeBanner() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const localDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    const userDismissed = session?.user?.bannerDismissed ?? false;
    setDismissed(localDismissed || userDismissed);
  }, [session?.user?.bannerDismissed]);

  const handleDismiss = async () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
    if (session?.user?.id) {
      await dismissBanner();
    }
  };

  if (pathname.startsWith("/obr") || dismissed) {
    return null;
  }

  return (
    <div className="bg-flame text-white px-4 py-2">
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
