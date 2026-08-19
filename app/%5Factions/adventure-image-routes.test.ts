import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockDeleteAdventureImage, mockUploadAdventureImage } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockDeleteAdventureImage: vi.fn(),
    mockUploadAdventureImage: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/adventure-images", () => ({
  AdventureImageInputError: class extends Error {},
  deleteAdventureImageIfUnreferenced: mockDeleteAdventureImage,
  uploadAdventureImage: mockUploadAdventureImage,
}));
vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

import { DELETE } from "./adventureImage/[id]/route";
import { POST } from "./uploadAdventureImage/route";

const imageId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "owner" } });
});

describe("adventure image action routes", () => {
  it("rejects upload media-type mismatches before authentication", async () => {
    const response = await POST(
      new Request("http://localhost/_actions/uploadAdventureImage", {
        method: "POST",
        body: "image=attack",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: "http://localhost",
        },
      })
    );

    expect(response.status).toBe(415);
    expect(mockAuth).not.toHaveBeenCalled();
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("returns 400 for a malformed multipart upload", async () => {
    const response = await POST(
      new Request("http://localhost/_actions/uploadAdventureImage", {
        method: "POST",
        body: "not multipart",
        headers: {
          "content-type": "multipart/form-data; boundary=broken",
          origin: "http://localhost",
        },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid multipart body" });
    expect(mockUploadAdventureImage).not.toHaveBeenCalled();
  });

  it("guards and permits bodyless image deletion", async () => {
    const rejected = await DELETE(
      new Request(`http://localhost/_actions/adventureImage/${imageId}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: imageId }) }
    );
    expect(rejected.status).toBe(403);
    expect(mockDeleteAdventureImage).not.toHaveBeenCalled();

    const allowed = await DELETE(
      new Request(`http://localhost/_actions/adventureImage/${imageId}`, {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: imageId }) }
    );
    expect(allowed.status).toBe(204);
    expect(mockDeleteAdventureImage).toHaveBeenCalledWith(imageId, "owner");
  });

  it("does not leak an unexpected image deletion failure", async () => {
    mockDeleteAdventureImage.mockRejectedValue(
      new Error("private blob bucket unavailable")
    );

    const response = await DELETE(
      new Request(`http://localhost/_actions/adventureImage/${imageId}`, {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: imageId }) }
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
