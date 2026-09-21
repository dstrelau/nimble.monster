import { propagation } from "@opentelemetry/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateEntityImagePath, uploadBlob } from "@/lib/blob-storage";
import {
  claimImageGeneration,
  completeImageGeneration,
  failImageGeneration,
} from "@/lib/db/entity-images";
import {
  generateEntityImageWithStorage,
  type ImageGenerationOptions,
  ImageRendererUnavailableError,
} from "./image-generation";

vi.mock("@/lib/blob-storage", () => ({
  generateEntityImagePath: vi.fn(() => "card-images/render.png"),
  uploadBlob: vi.fn(),
}));

vi.mock("@/lib/db/entity-images", () => ({
  claimImageGeneration: vi.fn(),
  completeImageGeneration: vi.fn(),
  failImageGeneration: vi.fn(),
}));

const options: ImageGenerationOptions & { entityVersion: string } = {
  baseUrl: "https://nimble.nexus",
  entityId: "11111111-1111-4111-8111-111111111111",
  entityUrlPath: "/monsters/example-abc123",
  entityType: "monster",
  entityVersion: "version-1",
  theme: "dark",
};

describe("production image rendering", () => {
  beforeEach(() => {
    vi.spyOn(propagation, "inject").mockImplementation((_context, carrier) => {
      if (typeof carrier === "object" && carrier !== null) {
        Object.assign(carrier, {
          traceparent:
            "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
        });
      }
    });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("IMAGE_RENDERER_URL", "https://nimble-nexus-renderer.example");
    vi.stubEnv("IMAGE_RENDERER_SECRET", "renderer-secret");
    vi.mocked(claimImageGeneration).mockResolvedValue({
      id: "image-row",
      claimed: true,
      generationToken: "attempt-token",
    });
    vi.mocked(uploadBlob).mockResolvedValue({
      url: "https://images.example/render.png",
      downloadUrl: "https://images.example/render.png",
    });
    vi.mocked(completeImageGeneration).mockResolvedValue(Object.create(null));
    vi.mocked(failImageGeneration).mockResolvedValue(Object.create(null));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValue(
          new Response(Buffer.from("png"), {
            headers: {
              "Content-Type": "image/png",
              "Content-Length": "3",
            },
          })
        )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("makes one bounded renderer request and fences the uploaded object", async () => {
    const result = await generateEntityImageWithStorage(options);

    expect(result).toBe("https://images.example/render.png");
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      new URL("https://nimble-nexus-renderer.example/health"),
      expect.objectContaining({
        headers: expect.objectContaining({
          traceparent:
            "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
          "x-image-renderer-secret": "renderer-secret",
        }),
        cache: "no-store",
        signal: expect.any(AbortSignal),
      })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL("https://nimble-nexus-renderer.example/render"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          traceparent:
            "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
          "x-image-renderer-secret": "renderer-secret",
        }),
        body: JSON.stringify({
          entityId: options.entityId,
          entityUrlPath: options.entityUrlPath,
          entityType: options.entityType,
          theme: options.theme,
        }),
        cache: "no-store",
        signal: expect.any(AbortSignal),
      })
    );
    expect(generateEntityImagePath).toHaveBeenCalledWith(
      "monster",
      options.entityId,
      "dark",
      "version-1-attempt-token"
    );
    expect(completeImageGeneration).toHaveBeenCalledWith(
      "image-row",
      "attempt-token",
      "version-1",
      "https://images.example/render.png"
    );
  });

  it("maps renderer admission rejection to renderer unavailability", async () => {
    vi.mocked(fetch)
      .mockReset()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(null, { status: 503, headers: { "Retry-After": "5" } })
      );

    await expect(generateEntityImageWithStorage(options)).rejects.toThrow(
      "Image renderer is busy"
    );

    expect(uploadBlob).not.toHaveBeenCalled();
    expect(failImageGeneration).toHaveBeenCalledWith(
      "image-row",
      "attempt-token",
      "version-1",
      "Image renderer is busy"
    );
  });

  it("rejects renderer responses above the image size limit", async () => {
    vi.mocked(fetch)
      .mockReset()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(null, {
          headers: {
            "Content-Type": "image/png",
            "Content-Length": String(5 * 1024 * 1024 + 1),
          },
        })
      );

    await expect(generateEntityImageWithStorage(options)).rejects.toThrow(
      "Image renderer response exceeded the size limit"
    );

    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it("does not submit a render when the Sprite fails to wake", async () => {
    vi.mocked(fetch)
      .mockReset()
      .mockResolvedValue(new Response(null, { status: 502 }));

    await expect(generateEntityImageWithStorage(options)).rejects.toThrow(
      "Image renderer failed to wake"
    );

    expect(fetch).toHaveBeenCalledOnce();
    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it("fails when the renderer is not configured", async () => {
    vi.stubEnv("IMAGE_RENDERER_SECRET", "");

    await expect(generateEntityImageWithStorage(options)).rejects.toThrow(
      ImageRendererUnavailableError
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it("does not queue behind an existing generation claim", async () => {
    vi.mocked(claimImageGeneration).mockResolvedValue({
      id: "image-row",
      claimed: false,
    });

    await expect(generateEntityImageWithStorage(options)).rejects.toThrow(
      "Image generation is already in progress"
    );

    expect(fetch).not.toHaveBeenCalled();
  });
});
