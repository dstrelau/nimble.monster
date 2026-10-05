import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCreateRandomTable,
  mockUpdateRandomTable,
  revalidatePath,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateRandomTable: vi.fn(),
  mockUpdateRandomTable: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  createRandomTable: mockCreateRandomTable,
  updateRandomTable: mockUpdateRandomTable,
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
      columns: [
        { id: "roll", name: "1d6" },
        { id: "result", name: "Weather" },
      ],
      rows: [{ cells: { roll: "1–6", result: "Clear" } }],
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
  });

  it("creates a random table without a feature flag and returns navigation data", async () => {
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
    expect(revalidatePath).toHaveBeenCalledWith("/my/tables");
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
    expect(revalidatePath).toHaveBeenCalledWith("/tables/[id]", "page");
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(request(input));

    expect(response.status).toBe(401);
    expect(mockCreateRandomTable).not.toHaveBeenCalled();
  });

  it("rejects invalid table input", async () => {
    const response = await POST(request({ ...input, name: "" }));

    expect(response.status).toBe(400);
    expect(mockCreateRandomTable).not.toHaveBeenCalled();
  });

  it("uses reference table terminology for invalid IDs", async () => {
    const response = await POST(request({ ...input, id: "invalid" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid reference table ID",
    });
    expect(mockUpdateRandomTable).not.toHaveBeenCalled();
  });

  it("translates the internal missing-table error to the user-facing name", async () => {
    mockUpdateRandomTable.mockRejectedValue(
      new Error("Random table not found")
    );
    const response = await POST(
      request({
        ...input,
        id: "22222222-2222-2222-2222-222222222222",
      })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Reference table not found",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
