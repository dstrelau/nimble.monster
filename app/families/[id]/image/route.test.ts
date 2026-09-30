import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as db from "@/lib/db";
import { createImageResponse } from "@/lib/image-route-handler";
import * as monstersRepo from "@/lib/services/monsters/repository";
import type { FamilyOverview } from "@/lib/types";
import { slugify } from "@/lib/utils/slug";
import { GET } from "./route";

vi.mock("@/lib/db", () => ({ getFamily: vi.fn() }));
vi.mock("@/lib/image-route-handler", () => ({ createImageResponse: vi.fn() }));
vi.mock("@/lib/services/monsters/repository", () => ({
  listMonstersByFamilyId: vi.fn(),
}));

const family: FamilyOverview = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Example Family",
  visibility: "public",
  creatorId: "creator-id",
  creator: {
    id: "creator-id",
    discordId: "creator-id",
    username: "creator",
    displayName: "Creator",
  },
  abilities: [],
};
const monsters: Awaited<
  ReturnType<typeof monstersRepo.listMonstersByFamilyId>
> = [];

describe("family image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getFamily).mockResolvedValue(family);
    vi.mocked(monstersRepo.listMonstersByFamilyId).mockResolvedValue(monsters);
    vi.mocked(createImageResponse).mockResolvedValue(new Response(null));
  });

  it("renders the public family and its monsters", async () => {
    const slug = slugify(family);
    const request = new NextRequest(
      `https://nimble.nexus/families/${slug}/image`
    );

    await GET(request, { params: Promise.resolve({ id: slug }) });

    expect(createImageResponse).toHaveBeenCalledWith(
      request,
      { ...family, monsters },
      "family"
    );
  });

  it("does not expose a private family image", async () => {
    vi.mocked(db.getFamily).mockResolvedValue({
      ...family,
      visibility: "private",
    });
    const slug = slugify(family);
    const request = new NextRequest(
      `https://nimble.nexus/families/${slug}/image`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: slug }),
    });

    expect(response.status).toBe(404);
    expect(createImageResponse).not.toHaveBeenCalled();
  });
});
