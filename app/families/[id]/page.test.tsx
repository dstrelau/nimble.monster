import { beforeEach, describe, expect, it, vi } from "vitest";
import * as db from "@/lib/db";
import * as monstersRepo from "@/lib/services/monsters/repository";
import type { FamilyOverview, FamilyVisibility } from "@/lib/types";
import { slugify } from "@/lib/utils/slug";
import FamilyDetailPage, { generateMetadata } from "./page";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error("redirect");
  }),
}));

vi.mock("next/navigation", () => navigationMocks);
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ getFamily: vi.fn() }));
vi.mock("@/lib/services/monsters/repository", () => ({
  listMonstersByFamilyId: vi.fn(),
}));
vi.mock("@/app/families/FamilyHeader", () => ({
  FamilyHeader: () => null,
}));
vi.mock("@/components/family/FamilyImagePreview", () => ({
  FamilyImagePreview: () => null,
}));
vi.mock("@/components/monster/CardGrid", () => ({ CardGrid: () => null }));

function makeFamily(visibility: FamilyVisibility): FamilyOverview {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Example Family",
    visibility,
    creatorId: "creator-id",
    creator: {
      id: "creator-id",
      discordId: "creator-id",
      username: "creator",
      displayName: "Creator",
    },
    abilities: [],
  };
}

const monsters: Awaited<
  ReturnType<typeof monstersRepo.listMonstersByFamilyId>
> = [];

describe("family image preview privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(monstersRepo.listMonstersByFamilyId).mockResolvedValue(monsters);
  });

  it.each([
    "private",
    "secret",
  ] satisfies FamilyVisibility[])("does not advertise an image for a %s family", async (visibility) => {
    const family = makeFamily(visibility);
    vi.mocked(db.getFamily).mockResolvedValue(family);

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: slugify(family) }),
    });

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter).toEqual({
      card: "summary",
      title: family.name,
      description: "0 monsters by Creator",
    });
  });

  it.each([
    "private",
    "secret",
  ] satisfies FamilyVisibility[])("rejects the renderer-only preview for a %s family", async (visibility) => {
    const family = makeFamily(visibility);
    vi.mocked(db.getFamily).mockResolvedValue(family);

    await expect(
      FamilyDetailPage({
        params: Promise.resolve({ id: slugify(family) }),
        searchParams: Promise.resolve({ imagePreview: "overview" }),
      })
    ).rejects.toThrow("not found");

    expect(monstersRepo.listMonstersByFamilyId).not.toHaveBeenCalled();
  });
});
