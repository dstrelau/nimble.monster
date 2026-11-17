import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  getUserById: vi.fn(),
  setPermission: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/lib/db/user", () => ({ getUserById: mocks.getUserById }));
vi.mock("@/lib/services/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/permissions")>()),
  setPermission: mocks.setPermission,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "./route";

const input = {
  userId: "target-user",
  permission: "monstery-monday",
  granted: true,
};

function request(body: unknown = input, origin = "https://nimble.nexus") {
  return new Request("https://nimble.nexus/_actions/updateUserPermission", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.getUserById.mockResolvedValue({ id: input.userId });
});

describe("permission administration", () => {
  it.each([true, false])(
    "persists granted=%s for the selected user",
    async (granted) => {
      const response = await POST(request({ ...input, granted }));
      expect(response.status).toBe(200);
      expect(mocks.setPermission).toHaveBeenCalledWith(
        "target-user",
        "monstery-monday",
        granted
      );
    }
  );

  it("denies non-admins", async () => {
    mocks.isAdmin.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.setPermission).not.toHaveBeenCalled();
  });

  it.each([
    { ...input, permission: "admin" },
    { ...input, granted: "true" },
    { userId: input.userId, permission: input.permission },
  ])("rejects invalid input: %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.setPermission).not.toHaveBeenCalled();
  });

  it("rejects missing users", async () => {
    mocks.getUserById.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(404);
    expect(mocks.setPermission).not.toHaveBeenCalled();
  });
});
