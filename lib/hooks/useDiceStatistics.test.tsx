import { act, cleanup, render, renderHook } from "@testing-library/react";
import type { DiceStats } from "nimble-dice";
import * as dice from "nimble-dice";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DiceNotation } from "@/components/dice/DiceNotation";
import { useDiceStatistics } from "./useDiceStatistics";

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent<DiceStats>) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminated = false;
  postMessage() {}
  terminate() {
    this.terminated = true;
  }

  constructor() {
    TestWorker.instances.push(this);
  }

  finish(averageRoll: number) {
    this.onmessage?.(
      new MessageEvent<DiceStats>("message", {
        data: {
          distribution: new Map([[2, 1]]),
          averageRoll,
          totalAverageRoll: averageRoll,
          missProbability: 0,
        },
      })
    );
  }
}

beforeEach(() => {
  TestWorker.instances = [];
  vi.stubGlobal("Worker", TestWorker);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("clears stale statistics and ignores late results after input changes or closing", () => {
  const initialProps: { notation: string | null } = { notation: "1d4n" };
  const { result, rerender } = renderHook(
    ({ notation }: { notation: string | null }) => useDiceStatistics(notation),
    { initialProps }
  );
  const first = TestWorker.instances[0];
  expect(result.current.pending).toBe(true);
  act(() => first.finish(2.5));
  expect(result.current.stats?.averageRoll).toBe(2.5);
  expect(first.terminated).toBe(true);

  rerender({ notation: "1d20a5+11" });
  const expensive = TestWorker.instances[1];
  expect(result.current.pending).toBe(true);
  expect(result.current.stats).toBeNull();
  act(() => first.finish(99));
  expect(result.current.stats).toBeNull();

  rerender({ notation: "1d8n" });
  expect(expensive.terminated).toBe(true);
  act(() => expensive.finish(999));
  expect(result.current.stats).toBeNull();
  act(() => TestWorker.instances[2].finish(4.5));
  expect(result.current.stats?.averageRoll).toBe(4.5);

  rerender({ notation: null });
  act(() => TestWorker.instances[2].finish(999));
  expect(result.current).toEqual({
    stats: null,
    pending: false,
    showLoading: false,
    error: null,
  });
});

it("reports worker failures without presenting made-up statistics", () => {
  const { result, rerender } = renderHook(
    ({ notation }) => useDiceStatistics(notation),
    { initialProps: { notation: "1d4n" } }
  );
  act(() => TestWorker.instances[0].onerror?.());
  expect(TestWorker.instances[0].terminated).toBe(true);
  expect(result.current).toEqual({
    stats: null,
    pending: false,
    showLoading: false,
    error: "Statistics unavailable",
  });
  rerender({ notation: "invalid" });
  expect(result.current).toEqual({
    stats: null,
    pending: false,
    showLoading: false,
    error: null,
  });
});

it("retries a failed notation after closing with fresh delayed loading feedback", () => {
  vi.useFakeTimers();
  const initialProps: { notation: string | null } = { notation: "1d4n" };
  const { result, rerender, unmount } = renderHook(
    ({ notation }) => useDiceStatistics(notation),
    { initialProps }
  );
  act(() => TestWorker.instances[0].onerror?.());
  expect(result.current.error).toBe("Statistics unavailable");
  rerender({ notation: null });
  rerender({ notation: "1d4n" });
  expect(result.current.error).toBeNull();
  expect(result.current.pending).toBe(true);
  act(() => vi.advanceTimersByTime(500));
  expect(result.current.showLoading).toBe(true);
  act(() => TestWorker.instances[1].finish(2.5));
  expect(result.current.stats?.averageRoll).toBe(2.5);

  rerender({ notation: "1d8n" });
  const closing = TestWorker.instances[2];
  rerender({ notation: null });
  expect(closing.terminated).toBe(true);
  rerender({ notation: "1d4n" });
  const unmounting = TestWorker.instances[3];
  unmount();
  expect(unmounting.terminated).toBe(true);
});

it("does not start workers for closed dice drawers", () => {
  render(<DiceNotation text="Damage: 1d20a5+11" />);
  expect(TestWorker.instances).toHaveLength(0);
});

it("waits 500ms before showing loaders and resets the delay for new input", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ notation }) => useDiceStatistics(notation),
    { initialProps: { notation: "1d4n" } }
  );
  act(() => vi.advanceTimersByTime(499));
  expect(result.current.showLoading).toBe(false);
  act(() => TestWorker.instances[0].finish(2.5));
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.showLoading).toBe(false);

  rerender({ notation: "1d20a5+11" });
  act(() => vi.advanceTimersByTime(499));
  expect(result.current.showLoading).toBe(false);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.showLoading).toBe(true);

  rerender({ notation: "1d8n" });
  expect(result.current.showLoading).toBe(false);
  act(() => vi.advanceTimersByTime(499));
  expect(result.current.showLoading).toBe(false);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.showLoading).toBe(true);
  act(() => TestWorker.instances[2].finish(4.5));
  expect(result.current.showLoading).toBe(false);
});

it("server-renders expensive dice notation without calculating or needing Workers", () => {
  vi.stubGlobal("Worker", undefined);
  vi.spyOn(dice, "calculateProbabilityDistribution").mockImplementation(() => {
    throw new Error("Probability calculations must not run during SSR");
  });
  const html = renderToString(<DiceNotation text="Damage: 1d20a5+11" />);
  expect(html).toContain("data-dice-notation");
  expect(html).toContain("ADV 5");
});
