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
import BuildMonsterView from "@/app/monsters/BuildMonsterView";
import { call } from "@/lib/contract";
import { getMonsterUrl } from "@/lib/utils/url";

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
vi.mock("@/app/families/hooks", () => ({
  useUserFamiliesQuery: () => ({ data: [] }),
}));
vi.mock("@/components/shared/BuildView", () => ({
  BuildView: ({ formContent }: { formContent: ReactNode }) => formContent,
}));
vi.mock("@/components/shared/ExampleLoader", () => ({
  ExampleLoader: () => null,
}));
vi.mock("@/components/create/AbilitiesSection", () => ({
  AbilitiesSection: () => null,
}));
vi.mock("@/components/create/ActionsSection", () => ({
  ActionsSection: () => null,
}));
vi.mock("@/components/create/MembersSection", () => ({
  emptyMember: () => ({}),
  MembersSection: () => null,
}));
vi.mock("@/components/create/SourceSelect", () => ({
  SourceSelect: () => null,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/monster/Card", () => ({ Card: () => null }));
vi.mock("@/components/paperforge/PaperforgeImageSelect", () => ({
  PaperforgeImageSelect: () => null,
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function renderBuilder() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  render(
    <QueryClientProvider client={queryClient}>
      <BuildMonsterView />
    </QueryClientProvider>
  );
  return { invalidate };
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bestiary builder mutation", () => {
  it("preserves the draft while pending, invalidates caches, and navigates", async () => {
    const pending = deferred<{ id: string; name: string; hazard: boolean }>();
    vi.mocked(call).mockReturnValueOnce(pending.promise);
    const { invalidate } = renderBuilder();

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Clockwork Goblin" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const saving = await screen.findByRole("button", { name: "Saving…" });
    expect(saving).toBeDisabled();
    expect(name).toHaveValue("Clockwork Goblin");
    expect(call).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: "monster",
        input: expect.objectContaining({ name: "Clockwork Goblin" }),
      })
    );

    const result = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Clockwork Goblin",
      hazard: false,
    };
    pending.resolve(result);
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["monsters"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["hazards"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["nav-counts"] });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["monster", result.id],
      });
      expect(mockPush).toHaveBeenCalledWith(getMonsterUrl(result));
    });
  });

  it("shows a save failure without clearing the draft", async () => {
    vi.mocked(call).mockRejectedValueOnce(new Error("Monster save failed"));
    renderBuilder();

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Unsaved Monster" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Monster save failed"
    );
    expect(name).toHaveValue("Unsaved Monster");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
