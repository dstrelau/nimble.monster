import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repository from "../monsters/repository";
import type { Hazard } from "../monsters/types";
import { paginateMyHazards, paginatePublicHazards } from "./index";

vi.mock("../monsters/repository", () => ({
  paginateHazards: vi.fn(),
}));

const hazard: Hazard = {
  id: "hazard-1",
  hazard: true,
  name: "Rockfall",
  level: "2",
  levelInt: 2,
  visibility: "public",
  createdAt: new Date(),
  updatedAt: new Date(),
  abilities: [],
  actions: [],
  actionPreface: "",
  creator: {
    id: "user-1",
    discordId: "discord-1",
    username: "user",
    displayName: "User",
    imageUrl: "",
  },
};

describe("hazard pagination facade", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns public hazards without creature fields", async () => {
    vi.mocked(repository.paginateHazards).mockResolvedValue({
      data: [hazard],
      nextCursor: null,
    });

    const result = await paginatePublicHazards({ limit: 12 });

    expect(repository.paginateHazards).toHaveBeenCalledWith(
      expect.objectContaining({ includePrivate: false, limit: 12 })
    );
    expect(result.data[0]).toMatchObject({ hazard: true, name: "Rockfall" });
    expect(result.data[0]).not.toHaveProperty("hp");
    expect(result.data[0]).not.toHaveProperty("size");
    expect(result.data[0]).not.toHaveProperty("speed");
  });

  it("scopes my hazards to the creator", async () => {
    vi.mocked(repository.paginateHazards).mockResolvedValue({
      data: [hazard],
      nextCursor: null,
    });

    const result = await paginateMyHazards("user-1", {});

    expect(repository.paginateHazards).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: "user-1",
        includePrivate: true,
      })
    );
    expect(result.data[0]).toMatchObject({ hazard: true });
    expect(result.data[0]).not.toHaveProperty("hp");
  });
});
