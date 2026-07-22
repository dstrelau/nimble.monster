import { beforeEach, describe, expect, it, vi } from "vitest";

describe("mutationErrors store", () => {
  beforeEach(() => {
    // Reset the module's singleton state between tests.
    vi.resetModules();
  });

  it("reports a message and notifies subscribers", async () => {
    const mod = await import("./mutationErrors");
    const listener = vi.fn();
    mod.subscribeMutationError(listener);

    expect(mod.getMutationErrorSnapshot()).toBeNull();
    mod.reportMutationError("boom");

    expect(mod.getMutationErrorSnapshot()).toBe("boom");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("dismiss clears the message and notifies once", async () => {
    const mod = await import("./mutationErrors");
    mod.reportMutationError("boom");

    const listener = vi.fn();
    mod.subscribeMutationError(listener);
    mod.dismissMutationError();

    expect(mod.getMutationErrorSnapshot()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("dismiss is a no-op when already clear", async () => {
    const mod = await import("./mutationErrors");
    const listener = vi.fn();
    mod.subscribeMutationError(listener);

    mod.dismissMutationError();

    expect(listener).not.toHaveBeenCalled();
  });
});
