import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BuildItemView from "@/app/items/BuildItemView";
import { call } from "@/lib/contract";
import { getItemUrl } from "@/lib/utils/url";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "owner",
        discordId: "discord-owner",
        username: "owner",
        displayName: "Owner",
      },
    },
  }),
}));
vi.mock("@/lib/contract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contract")>()),
  call: vi.fn(),
}));
vi.mock("@/lib/services/sources", () => ({
  sourcesQueryOptions: () => ({
    queryKey: ["sources"],
    queryFn: async () => [],
    enabled: false,
  }),
}));
vi.mock("@/components/shared/BuildView", () => ({
  BuildView: ({ formContent }: { formContent: ReactNode }) => formContent,
}));
vi.mock("@/components/shared/ExampleLoader", () => ({
  ExampleLoader: () => null,
}));
vi.mock("@/components/shared/VisibilityToggle", () => ({
  VisibilityToggle: () => null,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/item/Card", () => ({ Card: () => null }));
vi.mock("@/app/items/BackdropPicker", () => ({ BackdropPicker: () => null }));
vi.mock("@/app/items/ColorPicker", () => ({ ColorPicker: () => null }));
vi.mock("@/app/items/IconPicker", () => ({ IconPicker: () => null }));

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function renderBuilder() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BuildItemView />
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("item builder mutation", () => {
  it("preserves the draft while pending and navigates after success", async () => {
    const pending = deferred<{ id: string; name: string }>();
    vi.mocked(call).mockReturnValueOnce(pending.promise);
    renderBuilder();

    const name = screen.getByRole("textbox", { name: "Name" });
    const description = screen.getByRole("textbox", { name: "Description" });
    fireEvent.change(name, { target: { value: "Lucky Coin" } });
    fireEvent.change(description, {
      target: { value: "Always lands edge-up." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const saving = await screen.findByRole("button", { name: "Saving..." });
    expect(saving).toBeDisabled();
    expect(name).toHaveValue("Lucky Coin");
    expect(description).toHaveValue("Always lands edge-up.");
    expect(call).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Lucky Coin",
        description: "Always lands edge-up.",
      })
    );

    const result = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Lucky Coin",
    };
    pending.resolve(result);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(getItemUrl(result))
    );
  });

  it("shows a save failure without clearing the draft", async () => {
    vi.mocked(call).mockRejectedValueOnce(new Error("Item save failed"));
    renderBuilder();

    const name = screen.getByRole("textbox", { name: "Name" });
    const description = screen.getByRole("textbox", { name: "Description" });
    fireEvent.change(name, { target: { value: "Unsaved Item" } });
    fireEvent.change(description, { target: { value: "Draft description" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Error creating item: Item save failed")
    ).toBeVisible();
    expect(name).toHaveValue("Unsaved Item");
    expect(description).toHaveValue("Draft description");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
