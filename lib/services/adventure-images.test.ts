import { File } from "node:buffer";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADVENTURE_IMAGE_MAX_FILE_SIZE } from "@/lib/adventure-images";
import {
  deleteAdventureImageIfUnreferenced,
  uploadAdventureImage,
} from "./adventure-images";

const { deleteBlobs, getDatabase, uploadBlob, uploadDatabase } = vi.hoisted(
  () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const where = vi.fn().mockResolvedValue(undefined);
    const database = {
      insert: vi.fn(() => ({ values })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where })) })),
    };
    return {
      deleteBlobs: vi.fn().mockResolvedValue(undefined),
      getDatabase: vi.fn(),
      uploadBlob: vi.fn().mockResolvedValue({ url: "url", downloadUrl: "url" }),
      uploadDatabase: database,
    };
  }
);

vi.mock("@/lib/blob-storage", () => ({ deleteBlobs, uploadBlob }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

beforeEach(() => {
  deleteBlobs.mockClear();
  getDatabase.mockReturnValue(uploadDatabase);
  uploadBlob.mockClear();
});

describe("uploadAdventureImage", () => {
  it("validates and stores the original plus two WebP sizes", async () => {
    const buffer = await sharp({
      create: {
        width: 2000,
        height: 1000,
        channels: 3,
        background: "#123456",
      },
    })
      .jpeg()
      .toBuffer();

    const image = await uploadAdventureImage(
      "user-1",
      new File([buffer], "map.jpg", { type: "image/jpeg" })
    );

    expect(image.extension).toBe("jpg");
    expect(image.originalUrl).toContain(
      `/adventure-images/user-1/${image.id}/original.jpg`
    );
    expect(uploadBlob).toHaveBeenCalledTimes(3);
    expect(uploadBlob.mock.calls.map((call) => call[0])).toEqual([
      `adventure-images/user-1/${image.id}/original.jpg`,
      `adventure-images/user-1/${image.id}/thumbnail-480.webp`,
      `adventure-images/user-1/${image.id}/display-1600.webp`,
    ]);
    expect(uploadBlob.mock.calls.map((call) => call[2])).toEqual([
      "image/jpeg",
      "image/webp",
      "image/webp",
    ]);
  });

  it("rejects content that is not a supported raster image", async () => {
    await expect(
      uploadAdventureImage(
        "user-1",
        new File(["not really an image"], "map.png", { type: "image/png" })
      )
    ).rejects.toThrow("not a supported image");

    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it("rejects files larger than 10 MB before reading them", async () => {
    const arrayBuffer = vi.fn<() => Promise<ArrayBuffer>>();

    await expect(
      uploadAdventureImage("user-1", {
        size: ADVENTURE_IMAGE_MAX_FILE_SIZE + 1,
        arrayBuffer,
      })
    ).rejects.toThrow("10 MB or smaller");

    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it("rejects images whose dimensions are too large", async () => {
    const buffer = await sharp({
      create: {
        width: 12_001,
        height: 1,
        channels: 3,
        background: "#123456",
      },
    })
      .png()
      .toBuffer();

    await expect(
      uploadAdventureImage(
        "user-1",
        new File([buffer], "too-wide.png", { type: "image/png" })
      )
    ).rejects.toThrow("12,000 pixels");

    expect(uploadBlob).not.toHaveBeenCalled();
  });
});

describe("deleteAdventureImageIfUnreferenced", () => {
  it("does not delete storage for an image referenced by an adventure", async () => {
    const selectResults = [[{ extension: "png" }], [{ id: "node-1" }]];
    const tx = queryDatabase(selectResults);
    getDatabase.mockReturnValue({
      ...tx,
      transaction: async (
        callback: (database: ReturnType<typeof queryDatabase>) => Promise<void>
      ) => callback(tx),
    });

    await expect(
      deleteAdventureImageIfUnreferenced(
        "11111111-1111-4111-8111-111111111111",
        "user-1"
      )
    ).resolves.toBe(false);

    expect(deleteBlobs).not.toHaveBeenCalled();
  });

  it("deletes all variants for an owned unreferenced image", async () => {
    const selectResults = [[{ extension: "png" }], []];
    const tx = queryDatabase(selectResults);
    getDatabase.mockReturnValue({
      ...tx,
      transaction: async (
        callback: (database: ReturnType<typeof queryDatabase>) => Promise<void>
      ) => callback(tx),
    });

    await expect(
      deleteAdventureImageIfUnreferenced(
        "11111111-1111-4111-8111-111111111111",
        "user-1"
      )
    ).resolves.toBe(true);

    expect(deleteBlobs).toHaveBeenCalledWith([
      "adventure-images/user-1/11111111-1111-4111-8111-111111111111/original.png",
      "adventure-images/user-1/11111111-1111-4111-8111-111111111111/thumbnail-480.webp",
      "adventure-images/user-1/11111111-1111-4111-8111-111111111111/display-1600.webp",
    ]);
  });
});

function queryDatabase(selectResults: object[][]) {
  const where = vi.fn(() => {
    const result = selectResults.shift() ?? [];
    return {
      limit: vi.fn().mockResolvedValue(result),
    };
  });
  return {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
  };
}
