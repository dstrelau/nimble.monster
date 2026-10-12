import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BuildAncestryView from "@/app/ancestries/BuildAncestryView";
import { getAncestryUrl } from "@/lib/utils/url";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "owner", discordId: "owner-discord" } },
  }),
}));
vi.mock("@/components/shared/BuildView", () => ({
  BuildView: ({ formContent }: { formContent: ReactNode }) => formContent,
}));
vi.mock("@/components/ancestry/Card", () => ({ Card: () => null }));
vi.mock("@/components/create/SourceSelect", () => ({
  SourceSelect: () => null,
}));
vi.mock("@/components/layout/DiscordLoginButton", () => ({
  DiscordLoginButton: () => null,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));

function renderBuilder() {
  const client = new QueryClient();
  client.setQueryData(["ancestries"], ["old list"]);
  client.setQueryData(["my-ancestries"], ["old owner list"]);
  render(
    <QueryClientProvider client={client}>
      <BuildAncestryView />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getAllByRole("textbox", { name: "Name" })[0], {
    target: { value: "Starfolk" },
  });
  fireEvent.change(screen.getAllByRole("textbox", { name: "Description" })[0], {
    target: { value: "Star-born people." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ability" }));
  return client;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ancestry builder", () => {
  it("keeps the draft pending, invalidates both lists and navigates to the saved detail", async () => {
    let finish: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          })
      )
    );
    const client = renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByRole("button", { name: "Saving..." })
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Starfolk"
    );
    const result = {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Starfolk",
    };
    finish(Response.json(result, { status: 201 }));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(getAncestryUrl(result))
    );
    expect(router.refresh).toHaveBeenCalled();
    expect(client.getQueryState(["ancestries"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["my-ancestries"])?.isInvalidated).toBe(true);
  });

  it("shows one inline error, retains input and re-enables retry after a failed save", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ error: "Unauthorized" }, { status: 401 })
      );
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Starfolk"
    );
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Star-born people."
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
