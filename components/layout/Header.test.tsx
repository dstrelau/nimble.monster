import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AllNavCounts } from "@/lib/db/nav";
import Header from "./Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/layout/UserNavItem", () => ({
  UserNavItem: () => null,
}));

const counts: AllNavCounts = {
  monsters: 2772,
  hazards: 12,
  companions: 116,
  ancestries: 124,
  backgrounds: 45,
  classes: 33,
  subclasses: 247,
  spellSchools: 63,
  items: 949,
  adventures: 1,
  encounters: 28,
  rules: 137,
  randomTables: 7,
};

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => vi.stubGlobal("fetch", fetchMock));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Header", () => {
  it("renders mobile navigation counts from server-provided initial data", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <Header initialCounts={counts} />
      </QueryClientProvider>
    );

    const mobileMenuButton = container.querySelector("nav button");
    expect(mobileMenuButton).not.toBeNull();
    if (!mobileMenuButton) return;
    fireEvent.click(mobileMenuButton);

    expect(
      screen.getByRole("link", { name: /^Monsters\s*2772$/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Adventures\s*1$/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Encounters\s*28$/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Rules\s*137$/ })).toHaveAttribute(
      "href",
      "/rules"
    );
    expect(screen.getByRole("link", { name: "Dice Roller" })).toHaveAttribute(
      "href",
      "/roll"
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Reference Tables\s*7$/ })
    ).toHaveAttribute("href", "/tables");
    expect(
      screen.queryByRole("link", { name: "Create" })
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows reference tables without a feature flag provider", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <Header initialCounts={counts} />
      </QueryClientProvider>
    );

    const mobileMenuButton = container.querySelector("nav button");
    expect(mobileMenuButton).not.toBeNull();
    if (!mobileMenuButton) return;
    fireEvent.click(mobileMenuButton);

    const link = screen.getByRole("link", { name: /^Reference Tables\s*7$/ });
    expect(link).toHaveAttribute("href", "/tables");
    expect(link.querySelector("svg")).toHaveClass("lucide-table-2");
  });

  it("refetches public counts through one stable GET and retains counts on failure", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let resolveRead: (response: Response) => void = () => {};
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        })
    );
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <Header initialCounts={counts} />
      </QueryClientProvider>
    );
    const menu = container.querySelector("nav button");
    if (!menu) throw new Error("Missing mobile menu");
    fireEvent.click(menu);
    let refetch: Promise<void> = Promise.resolve();
    act(() => {
      refetch = queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("link", { name: /^Monsters\s*2772$/ })
    ).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/getNavCounts");
    expect(options?.method).toBe("GET");
    expect(options?.credentials).toBe("same-origin");
    expect(options?.body).toBeUndefined();
    expect(new Headers(options?.headers).has("next-action")).toBe(false);
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    await act(async () => {
      resolveRead(Response.json({ ...counts, monsters: 2775, hazards: 19 }));
      await refetch;
    });
    expect(
      await screen.findByRole("link", { name: /^Monsters\s*2775$/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Hazards\s*19$/ })
    ).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "Unavailable" }, { status: 503 })
    );
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
    });
    expect(
      screen.getByRole("link", { name: /^Monsters\s*2775$/ })
    ).toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(
      Response.json({ ...counts, monsters: 2776 })
    );
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
    });
    expect(
      await screen.findByRole("link", { name: /^Monsters\s*2776$/ })
    ).toBeInTheDocument();
    queryClient.clear();
  });
});
