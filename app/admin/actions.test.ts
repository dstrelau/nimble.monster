import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockIsAdmin } = vi.hoisted(() => ({ mockIsAdmin: vi.fn() }));
vi.mock("@/lib/auth", () => ({ isAdmin: mockIsAdmin }));

const mockAwardDb = vi.hoisted(() => ({
  addAwardToMonster: vi.fn(),
  addAwardToItem: vi.fn(),
  addAwardToCompanion: vi.fn(),
  addAwardToSubclass: vi.fn(),
  addAwardToSchool: vi.fn(),
  addAwardToAncestry: vi.fn(),
  addAwardToBackground: vi.fn(),
}));
vi.mock("@/lib/db/award", () => mockAwardDb);

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/utils/slug", () => ({ awardSlugify: vi.fn() }));
vi.mock("@/lib/db/source", () => ({}));
vi.mock("@/lib/services/ancestries/official", () => ({}));
vi.mock("@/lib/services/ancestries/repository", () => ({}));
vi.mock("@/lib/services/backgrounds/official", () => ({}));
vi.mock("@/lib/services/backgrounds/repository", () => ({}));
vi.mock("@/lib/services/classes/official", () => ({}));
vi.mock("@/lib/services/classes/repository", () => ({}));
vi.mock("@/lib/services/ensure-official-user", () => ({}));
vi.mock("@/lib/services/monsters/official", () => ({}));
vi.mock("@/lib/services/monsters/preview-session", () => ({}));
vi.mock("@/lib/services/monsters/repository", () => ({}));
vi.mock("@/lib/services/preview-session", () => ({}));
vi.mock("@/lib/services/spell-schools/official", () => ({}));
vi.mock("@/lib/services/spell-schools/repository", () => ({}));
vi.mock("@/lib/services/subclasses/official", () => ({}));
vi.mock("@/lib/services/subclasses/repository", () => ({}));

import { addAwardAssociationAction } from "./actions";

const AWARD_ID = "award-111";
const ENTITY_ID = "entity-222";

function makeFormData(entityType: string) {
  const fd = new FormData();
  fd.append("entityType", entityType);
  fd.append("entityId", ENTITY_ID);
  fd.append("awardId", AWARD_ID);
  return fd;
}

describe("addAwardAssociationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.mockResolvedValue(true);
  });

  const cases: Array<[string, keyof typeof mockAwardDb]> = [
    ["monster", "addAwardToMonster"],
    ["item", "addAwardToItem"],
    ["companion", "addAwardToCompanion"],
    ["subclass", "addAwardToSubclass"],
    ["school", "addAwardToSchool"],
    ["ancestry", "addAwardToAncestry"],
    ["background", "addAwardToBackground"],
  ];

  for (const [entityType, fnName] of cases) {
    it(`calls ${fnName} with (awardId, entityId) for ${entityType}`, async () => {
      await addAwardAssociationAction(makeFormData(entityType));
      expect(mockAwardDb[fnName]).toHaveBeenCalledWith(AWARD_ID, ENTITY_ID);
    });
  }
});
