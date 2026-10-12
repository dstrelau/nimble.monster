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
import BuildBackgroundView from "@/app/backgrounds/BuildBackgroundView";
import type { Background } from "@/lib/services/backgrounds/types";
import { UNKNOWN_USER } from "@/lib/types";
import { getBackgroundUrl } from "@/lib/utils/url";

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
vi.mock("@/components/background/Card", () => ({ Card: () => null }));
vi.mock("@/components/create/SourceSelect", () => ({
  SourceSelect: () => null,
}));
vi.mock("@/components/layout/DiscordLoginButton", () => ({
  DiscordLoginButton: () => null,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));

const background: Background = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Old name",
  description: "Old description",
  creator: UNKNOWN_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderBuilder(editing: boolean) {
  const client = new QueryClient();
  client.setQueryData(["backgrounds"], ["old list"]);
  client.setQueryData(["my-backgrounds"], ["old owner list"]);
  render(
    <QueryClientProvider client={client}>
      <BuildBackgroundView background={editing ? background : undefined} />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: " Stargazer " },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
    target: { value: " Read the stars. " },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Requirement (Optional)" }),
    { target: { value: " Wits 2 " } }
  );
  return client;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe.each([false, true])("background builder editing=%s", (editing) => {
  it("uses stable JSON transport, disables pending saves, refreshes both lists and navigates", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (
        _url: string,
        _options: {
          method: string;
          credentials: string;
          headers: HeadersInit;
          body: string;
        }
      ) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = renderBuilder(editing);
    fireEvent.click(
      screen.getByRole("button", { name: editing ? "Update" : "Create" })
    );
    expect(
      await screen.findByRole("button", { name: "Saving..." })
    ).toBeDisabled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      editing ? "/_actions/updateBackground" : "/_actions/createBackground"
    );
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    const input = {
      name: "Stargazer",
      description: "Read the stars.",
      requirement: "Wits 2",
    };
    expect(JSON.parse(options.body)).toEqual(
      editing ? { id: background.id, input } : input
    );
    const result = { id: background.id, name: "Stargazer" };
    finish(Response.json(result, { status: editing ? 200 : 201 }));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(getBackgroundUrl(result))
    );
    expect(router.refresh).toHaveBeenCalled();
    expect(client.getQueryState(["backgrounds"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["my-backgrounds"])?.isInvalidated).toBe(true);
  });

  it("retains the draft with one actionable error and no automatic retry/navigation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ error: "Unauthorized" }, { status: 401 })
      );
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(editing);
    fireEvent.click(
      screen.getByRole("button", { name: editing ? "Update" : "Create" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      " Stargazer "
    );
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      " Read the stars. "
    );
    expect(
      screen.getByRole("button", { name: editing ? "Update" : "Create" })
    ).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
