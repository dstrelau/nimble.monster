import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/custom-rule", () => ({
  createCustomRule: mocks.create,
  updateCustomRule: mocks.update,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/telemetry", () => ({
  telemetry:
    (handler: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        mocks.errors(error);
        throw error;
      }
    },
}));

import { POST as create } from "./createCustomRule/route";
import { POST as update } from "./updateCustomRule/route";

const id = "33333333-3333-3333-3333-333333333333";
const input = {
  name: "House rule",
  content: "Move 3 spaces",
  keywords: "movement, speed",
  visibility: "private",
  links: [{ ruleSlug: "movement", relation: "replaces" }],
};
function request(path: string, body: unknown, headers?: HeadersInit) {
  return new Request(`http://localhost/_actions/${path}`, {
    method: "POST",
    headers: {
      origin: "http://localhost",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner" } });
  mocks.create.mockResolvedValue({ id, ...input, updatedAt: new Date() });
  mocks.update.mockResolvedValue({ id, ...input, updatedAt: new Date() });
});
describe.each([
  { path: "createCustomRule", handler: create, status: 201 },
  { path: "updateCustomRule", handler: update, status: 200 },
])("$path", ({ path, handler, status }) => {
  const body = (value: unknown) =>
    status === 201 ? value : { id, input: value };
  it("returns minimal JSON and derives ownership while preserving invalidation", async () => {
    const response = await handler(
      request(path, body({ ...input, userId: "attacker" }))
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ id, name: input.name });
    expect(status === 201 ? mocks.create : mocks.update).toHaveBeenCalledWith({
      ...input,
      ...(status === 200 ? { id } : {}),
      userId: "owner",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/custom-rules");
    if (status === 200)
      expect(mocks.revalidate).toHaveBeenCalledWith(`/custom-rules/${id}`);
  });
  it("requires authentication before writes", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await handler(request(path, body(input)))).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON, invalid fields and invalid update IDs", async () => {
    const malformed = await handler(request(path, "{broken"));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
    for (const invalid of [
      { ...input, name: "   " },
      { ...input, content: 9 },
      { ...input, keywords: null },
      { ...input, visibility: "unlisted" },
      { ...input, links: [{ ruleSlug: 2, relation: "augments" }] },
      { ...input, links: [{ ruleSlug: "movement", relation: "unknown" }] },
    ])
      expect((await handler(request(path, body(invalid)))).status).toBe(400);
    if (status === 200)
      expect((await handler(request(path, { id: "bad", input }))).status).toBe(
        400
      );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("checks exact origin and JSON media before auth", async () => {
    expect(
      (
        await handler(
          request(path, body(input), { origin: "https://evil.test" })
        )
      ).status
    ).toBe(403);
    expect(
      (
        await handler(
          request(path, body(input), { "content-type": "text/plain" })
        )
      ).status
    ).toBe(415);
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it("preserves actionable unknown-link errors without cache invalidation", async () => {
    mocks.create.mockRejectedValue(new Error("Unknown rule(s): invalid"));
    mocks.update.mockRejectedValue(new Error("Unknown rule(s): invalid"));
    const response = await handler(request(path, body(input)));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: "Unknown rule(s): invalid",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("records unexpected failures and hides infrastructure details", async () => {
    const error = new Error("private database details");
    mocks.create.mockRejectedValue(error);
    mocks.update.mockRejectedValue(error);
    const response = await handler(request(path, body(input)));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mocks.errors).toHaveBeenCalledWith(error);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
it("hides missing and non-owned updates behind 404", async () => {
  mocks.update.mockRejectedValue(new Error("Custom rule not found"));
  const response = await update(request("updateCustomRule", { id, input }));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Custom rule not found" });
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
