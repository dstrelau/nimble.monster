import { File } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { auth, flag, upload, remove } = vi.hoisted(() => ({
  auth: vi.fn(),
  flag: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/services/featureFlags", () => ({ isFeatureFlagEnabled: flag }));
vi.mock("@/lib/services/monster-artwork", () => ({
  MonsterArtworkInputError: class extends Error {},
  uploadMonsterArtwork: upload,
  deleteMonsterArtworkIfUnreferenced: remove,
}));
vi.mock("@/lib/telemetry", () => ({ telemetry: vi.fn((handler) => handler) }));

import { MonsterArtworkInputError } from "@/lib/services/monster-artwork";
import { DELETE } from "./deleteMonsterArtwork/route";
import { POST } from "./uploadMonsterArtwork/route";

const artwork = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
};
function uploadRequest(origin = "http://localhost") {
  return new Request("http://localhost/_actions/uploadMonsterArtwork", {
    method: "POST",
    headers: {
      origin,
      "content-type": "multipart/form-data; boundary=artwork",
    },
    body: '--artwork\r\nContent-Disposition: form-data; name="image"; filename="monster.png"\r\nContent-Type: image/png\r\n\r\nimage content\r\n--artwork--\r\n',
  });
}
function deleteRequest(body = JSON.stringify({ id: artwork.id })) {
  return new Request("http://localhost/_actions/deleteMonsterArtwork", {
    method: "DELETE",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body,
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("File", File);
  auth.mockResolvedValue({ user: { id: artwork.userId } });
  flag.mockResolvedValue(true);
  upload.mockResolvedValue(artwork);
  remove.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllGlobals());

describe("monster artwork action routes", () => {
  it("requires same origin, multipart media type, authentication and the upload feature flag", async () => {
    expect((await POST(uploadRequest("https://attacker.test"))).status).toBe(
      403
    );
    expect(auth).not.toHaveBeenCalled();
    expect(
      (
        await POST(
          new Request("http://localhost/_actions/uploadMonsterArtwork", {
            method: "POST",
            headers: {
              origin: "http://localhost",
              "content-type": "application/json",
            },
            body: "{}",
          })
        )
      ).status
    ).toBe(415);
    auth.mockResolvedValue(null);
    expect((await POST(uploadRequest())).status).toBe(401);
    expect((await DELETE(deleteRequest())).status).toBe(401);
    auth.mockResolvedValue({ user: { id: artwork.userId } });
    flag.mockResolvedValue(false);
    expect((await POST(uploadRequest())).status).toBe(403);
    expect(upload).not.toHaveBeenCalled();
  });
  it("returns the owned artwork at 201 and passes the authenticated owner to the service", async () => {
    const response = await POST(uploadRequest());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(artwork);
    expect(upload).toHaveBeenCalledWith(artwork.userId, expect.any(File));
    expect(flag).toHaveBeenCalledWith(artwork.userId, "monster-custom-artwork");
  });
  it("rejects malformed multipart, missing image, oversized requests and invalid image content", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost/_actions/uploadMonsterArtwork", {
            method: "POST",
            headers: {
              origin: "http://localhost",
              "content-type": "multipart/form-data; boundary=broken",
            },
            body: "broken",
          })
        )
      ).status
    ).toBe(400);
    expect(
      (
        await POST(
          new Request("http://localhost/_actions/uploadMonsterArtwork", {
            method: "POST",
            headers: {
              origin: "http://localhost",
              "content-type": "multipart/form-data; boundary=empty",
            },
            body: "--empty--\r\n",
          })
        )
      ).status
    ).toBe(400);
    const large = uploadRequest();
    large.headers.set("content-length", String(11 * 1024 * 1024));
    expect((await POST(large)).status).toBe(413);
    upload.mockRejectedValue(new MonsterArtworkInputError("Invalid image"));
    const response = await POST(uploadRequest());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid image" });
  });
  it("allows deletion with the feature disabled, passes only the session owner, and rejects referenced/foreign assets", async () => {
    flag.mockResolvedValue(false);
    expect((await DELETE(deleteRequest())).status).toBe(204);
    expect(remove).toHaveBeenCalledWith(artwork.id, artwork.userId);
    expect(flag).not.toHaveBeenCalled();
    remove.mockResolvedValue(false);
    expect((await DELETE(deleteRequest())).status).toBe(409);
    expect(
      (
        await DELETE(
          deleteRequest(JSON.stringify({ id: artwork.id, userId: "attacker" }))
        )
      ).status
    ).toBe(400);
    expect((await DELETE(deleteRequest("bad json"))).status).toBe(400);
    expect((await DELETE(deleteRequest('{"id":"bad"}'))).status).toBe(400);
  });
  it("sanitizes unexpected storage failures", async () => {
    upload.mockRejectedValue(new Error("private bucket"));
    const response = await POST(uploadRequest());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
