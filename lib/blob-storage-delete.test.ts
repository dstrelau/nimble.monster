import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteBlobs } from "./blob-storage";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@aws-sdk/client-s3", () => ({
  DeleteObjectsCommand: class DeleteObjectsCommand {},
  PutObjectCommand: class PutObjectCommand {},
  S3Client: class S3Client {
    send = send;
  },
}));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_BUCKET_NAME", "test-bucket");
  vi.stubEnv("AWS_ENDPOINT_URL_S3", "https://example.invalid");
  vi.stubEnv("AWS_REGION", "auto");
  send.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("deleteBlobs", () => {
  it("rejects a batch response containing per-object errors", async () => {
    send.mockResolvedValue({
      Errors: [{ Key: "failed.webp", Code: "InternalError" }],
    });

    await expect(deleteBlobs(["failed.webp"])).rejects.toThrow(
      "Failed to delete 1 blob object"
    );
  });

  it("accepts a batch response without per-object errors", async () => {
    send.mockResolvedValue({ Errors: [] });

    await expect(deleteBlobs(["deleted.webp"])).resolves.toBeUndefined();
  });
});
