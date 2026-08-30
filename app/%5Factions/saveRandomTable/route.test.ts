import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCreateRandomTable,
  mockIsFeatureFlagEnabled,
  mockUpdateRandomTable,
  revalidatePath,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateRandomTable: vi.fn(),
  mockIsFeatureFlagEnabled: vi.fn(),
  mockUpdateRandomTable: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  createRandomTable: mockCreateRandomTable,
  updateRandomTable: mockUpdateRandomTable,
}));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: mockIsFeatureFlagEnabled,
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: unknown) => handler,
}));

import { POST } from "./route";

const SESSION = {
  user: {
    id: "11111111-1111-1111-1111-111111111111",
    discordId: "dev-user-1",
  },
};

const input = {
  name: "Weather",
  description: "Travel weather",
  visibility: "public",
  subtables: [
    {
      title: "Weather",
      notation: "1d6",
      rows: [{ low: 1, high: 6, result: "Clear" }],
    },
  ],
};

function request(body: unknown) {
  return new Request("http://localhost/_actions/saveRandomTable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /_actions/saveRandomTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(SESSION);
    mockIsFeatureFlagEnabled.mockResolvedValue(true);
  });

  it("creates a random table and returns navigation data", async () => {
    mockCreateRandomTable.mockResolvedValue({
      id: "22222222-2222-2222-2222-222222222222",
      name: "Weather",
    });

    const response = await POST(request(input));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: "22222222-2222-2222-2222-222222222222",
      name: "Weather",
    });
    expect(mockCreateRandomTable).toHaveBeenCalledWith({
      ...input,
      discordId: "dev-user-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/my/random-tables");
  });

  it("updates an owned random table", async () => {
    const id = "22222222-2222-2222-2222-222222222222";
    mockUpdateRandomTable.mockResolvedValue({ id, name: "Weather" });

    const response = await POST(request({ ...input, id }));

    expect(response.status).toBe(200);
    expect(mockUpdateRandomTable).toHaveBeenCalledWith({
      ...input,
      id,
      discordId: "dev-user-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/random-tables/[id]", "page");
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(request(input));

    expect(response.status).toBe(401);
    expect(mockCreateRandomTable).not.toHaveBeenCalled();
  });

  it("conceals the route when the feature is disabled", async () => {
    mockIsFeatureFlagEnabled.mockResolvedValue(false);

    const response = await POST(request(input));

    expect(response.status).toBe(404);
    expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith(
      SESSION.user.id,
      "random-tables"
    );
    expect(mockCreateRandomTable).not.toHaveBeenCalled();
    expect(mockUpdateRandomTable).not.toHaveBeenCalled();
  });

  it("rejects invalid table input", async () => {
    const response = await POST(request({ ...input, name: "" }));

    expect(response.status).toBe(400);
    expect(mockCreateRandomTable).not.toHaveBeenCalled();
  });
});
