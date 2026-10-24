import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createCondition: vi.fn(),
  listConditionsForDiscordId: vi.fn(),
  revalidatePath: vi.fn(),
  telemetryErrors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/condition", () => ({
  createCondition: mocks.createCondition,
  listConditionsForDiscordId: mocks.listConditionsForDiscordId,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/telemetry", () => ({
  telemetry:
    (handler: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        mocks.telemetryErrors(error);
        throw error;
      }
    },
}));

import { POST } from "./route";

const input = { name: "Dazed", description: "Cannot react.\nÉlan lost." };
function request(body: unknown = input, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/createCondition", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...headers,
    },
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: "owner", discordId: "discord-owner" },
  });
  mocks.listConditionsForDiscordId.mockResolvedValue([]);
  mocks.createCondition.mockResolvedValue({ id: "new-condition" });
});

describe("condition creation route", () => {
  it("trims input, derives ownership from the session and returns only success", async () => {
    const response = await POST(
      request({
        name: " Dazed ",
        description: ` ${input.description} `,
        discordId: "attacker",
        creatorId: "attacker",
        official: true,
      })
    );
    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.listConditionsForDiscordId).toHaveBeenCalledWith(
      "discord-owner"
    );
    expect(mocks.createCondition).toHaveBeenCalledWith(
      "discord-owner",
      input.name,
      input.description
    );
    expect(mocks.revalidatePath.mock.calls).toEqual([["/my", "layout"]]);
  });
  it("rejects a case-insensitive owner duplicate without writing", async () => {
    mocks.listConditionsForDiscordId.mockResolvedValue([{ name: "dAzEd" }]);
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "A condition with this name already exists",
    });
    expect(mocks.createCondition).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it.each([null, { user: { id: "" } }])(
    "requires an authenticated user",
    async (session) => {
      mocks.auth.mockResolvedValue(session);
      expect((await POST(request())).status).toBe(401);
      expect(mocks.createCondition).not.toHaveBeenCalled();
    }
  );
  it.each([
    "{broken",
    null,
    {},
    { ...input, name: 3 },
    { ...input, name: " " },
    { ...input, name: "x".repeat(101) },
    ...["[Dazed", "Dazed]", "Daz|ed", "Da\nzed", "Da\rzed"].map((name) => ({
      ...input,
      name,
    })),
    { ...input, description: " " },
    { ...input, description: 7 },
  ])("rejects malformed JSON and invalid fields", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.createCondition).not.toHaveBeenCalled();
  });
  it("accepts the 100-character boundary", async () => {
    expect(
      (await POST(request({ ...input, name: "x".repeat(100) }))).status
    ).toBe(201);
  });
  it("enforces exact origin and JSON before authentication or writes", async () => {
    expect(
      (await POST(request(input, { origin: "https://evil.test" }))).status
    ).toBe(403);
    expect(
      (await POST(request(input, { "content-type": "text/plain" }))).status
    ).toBe(415);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.createCondition).not.toHaveBeenCalled();
  });
  it("records unexpected failures without exposing storage details", async () => {
    const error = new Error("SQLITE_BUSY secret details");
    mocks.createCondition.mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mocks.telemetryErrors).toHaveBeenCalledWith(error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
