import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/condition", () => ({
  listLibraryConditions: mocks.list,
  updateConditionDescription: mocks.update,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: unknown) => handler,
}));

import { GET, PATCH } from "./route";

const id = "11111111-1111-4111-8111-111111111111";
function request(method: string, body?: string, origin = "http://localhost") {
  return new Request(`http://localhost/_actions/conditions?id=${id}`, {
    method,
    headers: { origin, "content-type": "application/json" },
    body,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner" } });
});

describe("condition routes", () => {
  it("returns private owner-scoped usage", async () => {
    const usage = { monsters: 2, items: 1, spells: 0, rules: 3 };
    mocks.list.mockResolvedValue([{ id, usage }]);
    const response = await GET(request("GET"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(usage);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.list).toHaveBeenCalledWith("owner");
  });
  it("only edits description using session ownership", async () => {
    mocks.update.mockResolvedValue({ id });
    const response = await PATCH(
      request(
        "PATCH",
        JSON.stringify({
          id,
          description: " Updated ",
          name: "Renamed",
          userId: "attacker",
        })
      )
    );
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(id, "owner", "Updated");
  });
  it("hides non-owned conditions", async () => {
    mocks.update.mockResolvedValue(null);
    mocks.list.mockResolvedValue([]);
    expect(
      (
        await PATCH(
          request("PATCH", JSON.stringify({ id, description: "Updated" }))
        )
      ).status
    ).toBe(404);
    expect((await GET(request("GET"))).status).toBe(404);
  });
  it("requires authentication and rejects cross-origin writes", async () => {
    expect(
      (await PATCH(request("PATCH", "{}", "https://evil.test"))).status
    ).toBe(403);
    mocks.auth.mockResolvedValue(null);
    expect((await PATCH(request("PATCH", "{}"))).status).toBe(401);
    expect((await GET(request("GET"))).status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([
    "{broken",
    JSON.stringify({ id, description: "  " }),
  ])("rejects invalid input", async (body) => {
    expect((await PATCH(request("PATCH", body))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
