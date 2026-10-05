import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockNotFound } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ notFound: mockNotFound }));
vi.mock("./NewRandomTableClient", () => ({
  NewRandomTable: () => <div>New random table form</div>,
}));

import NewRandomTablePage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NewRandomTablePage", () => {
  it("returns not found for an anonymous user", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(NewRandomTablePage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("renders for an authenticated user without a feature flag", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    render(await NewRandomTablePage());

    expect(screen.getByText("New random table form")).toBeInTheDocument();
  });
});
