import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ call: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/lib/contract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contract")>()),
  call: mocks.call,
}));

import { FeatureFlagToggle } from "./FeatureFlagToggle";

const confirmation = { title: "Before you upload", description: "Rules" };

function renderToggle(withConfirmation: boolean) {
  render(
    <FeatureFlagToggle
      feature="monster-custom-artwork"
      label="Custom Image Uploads"
      enabled={false}
      confirmation={withConfirmation ? confirmation : undefined}
    />
  );
  return screen.getByRole("switch", { name: "Custom Image Uploads" });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.call.mockResolvedValue({ success: true });
});
afterEach(cleanup);

describe("FeatureFlagToggle confirmation", () => {
  it("enables the flag only after the user agrees", async () => {
    const toggle = renderToggle(true);
    fireEvent.click(toggle);
    expect(
      await screen.findByRole("alertdialog", { name: "Before you upload" })
    ).toBeTruthy();
    expect(mocks.call).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Agree" }));
    await vi.waitFor(() =>
      expect(mocks.call).toHaveBeenCalledWith(expect.anything(), {
        feature: "monster-custom-artwork",
        enabled: true,
      })
    );
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("leaves the flag off when the user cancels", async () => {
    const toggle = renderToggle(true);
    fireEvent.click(toggle);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(mocks.call).not.toHaveBeenCalled();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("enables directly without a confirmation", async () => {
    fireEvent.click(renderToggle(false));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await vi.waitFor(() => expect(mocks.call).toHaveBeenCalledTimes(1));
  });
});
