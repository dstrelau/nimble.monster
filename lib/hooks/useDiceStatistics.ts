"use client";

import type { DiceStats } from "nimble-dice";
import { parseDiceNotation } from "nimble-dice";
import { useEffect, useState } from "react";

interface Result {
  notation: string;
  stats: DiceStats | null;
  error: string | null;
}

export function useDiceStatistics(notation: string | null) {
  const [result, setResult] = useState<Result | null>(null);
  const [loadingNotation, setLoadingNotation] = useState<string | null>(null);
  const valid = notation !== null && parseDiceNotation(notation) !== null;
  const current = valid && result?.notation === notation ? result : null;

  useEffect(() => {
    setResult(null);
    setLoadingNotation(null);
    if (notation === null) return;
    const roll = parseDiceNotation(notation);
    if (!roll) return;

    let active = true;
    let worker: Worker | undefined;
    const loadingTimer = setTimeout(() => setLoadingNotation(notation), 500);
    const fail = () => {
      clearTimeout(loadingTimer);
      if (active) {
        setResult({ notation, stats: null, error: "Statistics unavailable" });
      }
      worker?.terminate();
    };

    try {
      worker = new Worker(new URL("../dice.worker.ts", import.meta.url));
      worker.onmessage = ({ data }: MessageEvent<DiceStats>) => {
        clearTimeout(loadingTimer);
        if (active) setResult({ notation, stats: data, error: null });
        worker?.terminate();
      };
      worker.onerror = fail;
      worker.onmessageerror = fail;
      worker.postMessage(roll);
    } catch {
      fail();
    }

    // Terminating the worker interrupts synchronous work, unlike a Promise timeout.
    return () => {
      active = false;
      clearTimeout(loadingTimer);
      worker?.terminate();
    };
  }, [notation]);

  return {
    stats: current?.stats ?? null,
    pending: valid && current === null,
    showLoading: valid && current === null && loadingNotation === notation,
    error: current?.error ?? null,
  };
}
