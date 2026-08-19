import puppeteer from "puppeteer-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBrowser } from "./browser";

vi.mock("puppeteer-core", () => ({
  default: {
    launch: vi.fn(),
  },
}));

describe("getBrowser", () => {
  beforeEach(() => {
    vi.mocked(puppeteer.launch).mockReset();
  });

  it("retries after browser launch fails", async () => {
    vi.mocked(puppeteer.launch)
      .mockRejectedValueOnce(new Error("first launch failed"))
      .mockRejectedValueOnce(new Error("second launch failed"));

    await expect(getBrowser()).rejects.toThrow("first launch failed");
    await expect(getBrowser()).rejects.toThrow("second launch failed");

    expect(puppeteer.launch).toHaveBeenCalledTimes(2);
  });
});
