import puppeteer from "puppeteer-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withBrowser } from "./browser";

vi.mock("puppeteer-core", () => ({
  default: {
    launch: vi.fn(),
  },
}));

function browserMock(close = vi.fn().mockResolvedValue(undefined)) {
  return Object.assign(Object.create(null), { close });
}

describe("withBrowser", () => {
  beforeEach(() => {
    vi.stubEnv("PUPPETEER_EXECUTABLE_PATH", "/test/chromium");
    vi.mocked(puppeteer.launch).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses a fresh browser for each render and closes it", async () => {
    const firstClose = vi.fn().mockResolvedValue(undefined);
    const secondClose = vi.fn().mockResolvedValue(undefined);
    vi.mocked(puppeteer.launch)
      .mockResolvedValueOnce(browserMock(firstClose))
      .mockResolvedValueOnce(browserMock(secondClose));

    await withBrowser(async () => "first");
    await withBrowser(async () => "second");

    expect(puppeteer.launch).toHaveBeenCalledTimes(2);
    expect(puppeteer.launch).toHaveBeenCalledWith({
      executablePath: "/test/chromium",
      headless: true,
      timeout: 10_000,
      protocolTimeout: 30_000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    expect(firstClose).toHaveBeenCalledOnce();
    expect(secondClose).toHaveBeenCalledOnce();
  });

  it("closes the browser after a failed render", async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    vi.mocked(puppeteer.launch).mockResolvedValue(browserMock(close));

    await expect(
      withBrowser(async () => {
        throw new Error("render failed");
      })
    ).rejects.toThrow("render failed");

    expect(close).toHaveBeenCalledOnce();
  });
});
