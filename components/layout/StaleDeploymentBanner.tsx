"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 60_000;

export function StaleDeploymentBanner() {
  const initialBuildId = useRef<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const checkBuildId = useCallback(async () => {
    try {
      const res = await fetch("/api/build-id");
      if (!res.ok) return;
      const { buildId } = await res.json();
      if (initialBuildId.current === null) {
        initialBuildId.current = buildId;
      } else if (buildId !== initialBuildId.current) {
        setIsStale(true);
      }
    } catch {
      // Network error, ignore
    }
  }, []);

  useEffect(() => {
    checkBuildId();
    const interval = setInterval(checkBuildId, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkBuildId]);

  if (!isStale) return null;

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
