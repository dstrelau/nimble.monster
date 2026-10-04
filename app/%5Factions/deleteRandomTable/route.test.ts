import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockDeleteRandomTable,
  mockIsFeatureFlagEnabled,
  revalidatePath,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDeleteRandomTable: vi.fn(),
  mockIsFeatureFlagEnabled: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ deleteRandomTable: mockDeleteRandomTable }));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: mockIsFeatureFlagEnabled,
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: unknown) => handler,
}));

import { POST } from "./route";

function request(id: string) {
  return new Request("http://localhost/_actions/deleteRandomTable", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost" },
    body: JSON.stringify({ id }),
  });
}

describe("POST /_actions/deleteRandomTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "owner", discordId: "dev-user-1" },
    });
    mockIsFeatureFlagEnabled.mockResolvedValue(true);
  });

  it("uses reference table terminology for invalid IDs without deleting", async () => {
    const response = await POST(request("invalid"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid reference table ID",
    });
    expect(mockDeleteRandomTable).not.toHaveBeenCalled();
  });

  it("uses reference table terminology when the table cannot be deleted", async () => {
    mockDeleteRandomTable.mockResolvedValue(false);
    const response = await POST(
      request("22222222-2222-2222-2222-222222222222")
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Reference table not found",
    });
    expect(mockDeleteRandomTable).toHaveBeenCalledWith({
      id: "22222222-2222-2222-2222-222222222222",
      discordId: "dev-user-1",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
