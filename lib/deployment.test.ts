import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockBuildIds(...ids: string[]) {
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ buildId: ids[Math.min(i++, ids.length - 1)] }),
    }))
  );
}

describe("checkDeploymentStale", () => {
  beforeEach(() => {
    // Reset the module's singleton state between tests.
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("captures the first build id without marking stale", async () => {
    mockBuildIds("a", "a");
    const mod = await import("./deployment");
    expect(await mod.checkDeploymentStale()).toBe(false);
    expect(mod.getStaleSnapshot()).toBe(false);
  });

  it("marks stale and notifies when the build id changes", async () => {
    mockBuildIds("a", "b");
    const mod = await import("./deployment");
    const listener = vi.fn();
    mod.subscribeStale(listener);

    await mod.checkDeploymentStale(); // captures "a"
    expect(await mod.checkDeploymentStale()).toBe(true); // sees "b"

    expect(mod.getStaleSnapshot()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stays stale once detected, even if the id flips back", async () => {
    mockBuildIds("a", "b", "a");
    const mod = await import("./deployment");

    await mod.checkDeploymentStale(); // "a"
    await mod.checkDeploymentStale(); // "b" -> stale
    expect(await mod.checkDeploymentStale()).toBe(true); // "a" again, still stale
  });

  it("ignores network errors and keeps the last known state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      })
    );
    const mod = await import("./deployment");
    expect(await mod.checkDeploymentStale()).toBe(false);
  });
});
