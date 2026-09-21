import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateEntityImageWithStorage,
  ImageGenerationDeniedError,
} from "@/lib/image-generation";
import { createImageResponse } from "./image-route-handler";

vi.mock("@/lib/image-generation", () => ({
  generateEntityImageWithStorage: vi.fn(),
  ImageGenerationDeniedError: class extends Error {},
  ImageRendererUnavailableError: class extends Error {},
}));

const entity = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Example Monster",
  updatedAt: new Date("2026-09-21T00:00:00.000Z"),
};

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("https://nimble.nexus/monsters/example/image", {
    headers: { host: "nimble.nexus", ...headers },
  });
}

describe("entity image generation authorization", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(generateEntityImageWithStorage).mockResolvedValue(
      "https://images.example/image.png"
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("allows a same-origin browser request to generate an image", async () => {
    await createImageResponse(
      makeRequest({
        referer: "https://nimble.nexus/monsters/example",
        "sec-fetch-site": "same-origin",
      }),
      entity,
      "monster"
    );

    expect(generateEntityImageWithStorage).toHaveBeenCalledWith(
      expect.objectContaining({ allowGeneration: true })
    );
  });

  it("does not allow a browser-like request without a referrer to generate", async () => {
    await createImageResponse(
      makeRequest({
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/148.0.0.0",
      }),
      entity,
      "monster"
    );

    expect(generateEntityImageWithStorage).toHaveBeenCalledWith(
      expect.objectContaining({ allowGeneration: false })
    );
  });

  it("does not trust a cross-site referrer", async () => {
    await createImageResponse(
      makeRequest({
        referer: "https://example.com/monsters/example",
        "sec-fetch-site": "same-origin",
      }),
      entity,
      "monster"
    );

    expect(generateEntityImageWithStorage).toHaveBeenCalledWith(
      expect.objectContaining({ allowGeneration: false })
    );
  });

  it("allows an approved social preview bot to generate", async () => {
    await createImageResponse(
      makeRequest({ "user-agent": "Discordbot/2.0" }),
      entity,
      "monster"
    );

    expect(generateEntityImageWithStorage).toHaveBeenCalledWith(
      expect.objectContaining({ allowGeneration: true })
    );
  });

  it("returns 403 when an untrusted request misses the image cache", async () => {
    vi.mocked(generateEntityImageWithStorage).mockRejectedValue(
      new ImageGenerationDeniedError()
    );

    const response = await createImageResponse(
      makeRequest({ "user-agent": "UntrustedBot/1.0" }),
      entity,
      "monster"
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
