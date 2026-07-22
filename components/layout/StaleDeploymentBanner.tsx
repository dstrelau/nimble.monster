"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  checkDeploymentStale,
  getStaleSnapshot,
  subscribeStale,
} from "@/lib/deployment";

const POLL_INTERVAL_MS = 60_000;

export function StaleDeploymentBanner() {
  const isStale = useSyncExternalStore(
    subscribeStale,
    getStaleSnapshot,
    () => false
  );

  useEffect(() => {
    checkDeploymentStale();
    const interval = setInterval(checkDeploymentStale, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!isStale) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-background px-4 py-3 shadow-lg">
      <p className="text-sm text-muted-foreground">
        A new version is available.{" "}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Refresh
        </button>
      </p>
    </div>
  );
}
