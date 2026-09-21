import { describe, expect, it, vi } from "vitest";
import { RenderQueue, RenderQueueFullError } from "./queue";

describe("RenderQueue", () => {
  it("runs queued renders one at a time in arrival order", async () => {
    const queue = new RenderQueue(3);
    const first = Promise.withResolvers<string>();
    const second = Promise.withResolvers<string>();
    const starts: string[] = [];

    const firstResult = queue.run(() => {
      starts.push("first");
      return first.promise;
    });
    const secondResult = queue.run(() => {
      starts.push("second");
      return second.promise;
    });

    await vi.waitFor(() => expect(starts).toEqual(["first"]));
    expect(queue.size).toBe(2);
    first.resolve("first result");
    await expect(firstResult).resolves.toBe("first result");
    await vi.waitFor(() => expect(starts).toEqual(["first", "second"]));
    second.resolve("second result");
    await expect(secondResult).resolves.toBe("second result");
    expect(queue.size).toBe(0);
  });

  it("continues processing after a render fails", async () => {
    const queue = new RenderQueue(2);
    const nextRender = vi.fn().mockResolvedValue("next result");

    const failedResult = queue.run(async () => {
      throw new Error("render failed");
    });
    const nextResult = queue.run(nextRender);

    await expect(failedResult).rejects.toThrow("render failed");
    await expect(nextResult).resolves.toBe("next result");
    expect(nextRender).toHaveBeenCalledOnce();
  });

  it("rejects only after the bounded queue is full", async () => {
    const queue = new RenderQueue(2);
    const first = Promise.withResolvers<void>();
    const second = Promise.withResolvers<void>();

    const firstResult = queue.run(() => first.promise);
    const secondResult = queue.run(() => second.promise);
    await expect(queue.run(async () => undefined)).rejects.toThrow(
      RenderQueueFullError
    );

    first.resolve();
    await firstResult;
    second.resolve();
    await secondResult;
  });
});
