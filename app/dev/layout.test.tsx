import { afterEach, describe, expect, it, vi } from "vitest";
import DevLayout from "./layout";

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  mockNotFound.mockClear();
});

describe("development routes layout", () => {
  it("renders children in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(DevLayout({ children: <div>Lab</div> })).toEqual(<div>Lab</div>);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("returns not found outside development", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => DevLayout({ children: <div>Lab</div> })).toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mockNotFound).toHaveBeenCalledOnce();
  });
});
