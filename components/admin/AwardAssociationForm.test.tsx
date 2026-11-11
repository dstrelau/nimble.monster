import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Award } from "@/lib/types";
import { AwardAssociationForm } from "./AwardAssociationForm";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
  vi.unstubAllGlobals();
});

it("searches via stable bodyless GET, selects results, and retains selection through failed search/retry", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json([{ id: "one", name: "Needle One" }]))
    .mockResolvedValueOnce(
      Response.json({ error: "Forbidden" }, { status: 403 })
    )
    .mockResolvedValueOnce(Response.json([{ id: "two", name: "Needle Two" }]));
  vi.stubGlobal("fetch", fetch);
  render(<AwardAssociationForm awards={[]} />);
  const input = screen.getByLabelText("Search Entities");
  fireEvent.change(input, { target: { value: "a" } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "a+b & 雪" } });
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.click(await screen.findByRole("button", { name: "Needle One" }));
  expect(screen.getByText("Selected (1):")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "second" } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(await screen.findByText("Forbidden")).toBeInTheDocument();
  expect(screen.getByText("Needle One")).toBeInTheDocument();
  expect(input).toHaveValue("second");
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(
    await screen.findByRole("button", { name: "Needle Two" })
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByText("Forbidden")).not.toBeInTheDocument()
  );
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe(
    "/_actions/searchAwardEntities?entityType=monster&query=a%2Bb+%26+%E9%9B%AA"
  );
  for (const [, init] of fetch.mock.calls) {
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBeUndefined();
    expect(new Headers(init.headers).has("next-action")).toBe(false);
  }
  expect(options.body).toBeUndefined();
});

it("adds each selected entity over stable JSON, keeping the unsaved remainder after a failure", async () => {
  const award: Award = {
    id: "award-1",
    slug: "a",
    name: "Award",
    abbreviation: "A",
    url: "https://example.com",
    color: "blue",
    icon: "award",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json([
        { id: "one", name: "Needle One" },
        { id: "two", name: "Needle Two" },
      ])
    )
    .mockResolvedValueOnce(
      Response.json([
        { id: "one", name: "Needle One" },
        { id: "two", name: "Needle Two" },
      ])
    )
    .mockResolvedValueOnce(Response.json({ success: true }))
    .mockResolvedValueOnce(
      Response.json({ error: "Award or entity not found" }, { status: 404 })
    );
  vi.stubGlobal("fetch", fetch);
  const { container } = render(<AwardAssociationForm awards={[award]} />);
  const input = screen.getByLabelText("Search Entities");
  for (const name of ["Needle One", "Needle Two"]) {
    fireEvent.change(input, { target: { value: "needle" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name }));
  }
  // Radix Select renders a hidden native select for form/autofill support.
  const nativeSelect = container.querySelectorAll("select")[1];
  if (!nativeSelect) throw new Error("Missing award select");
  fireEvent.change(nativeSelect, { target: { value: "award-1" } });
  fireEvent.click(
    await screen.findByRole("button", { name: /Add \(2\) Associations/ })
  );
  expect(
    await screen.findByText("Award or entity not found")
  ).toBeInTheDocument();
  expect(screen.getByText("Selected (1):")).toBeInTheDocument();
  expect(screen.getByText("Needle Two")).toBeInTheDocument();
  expect(screen.queryByText("Needle One")).not.toBeInTheDocument();
  expect(refresh).toHaveBeenCalledTimes(1);
  const writes = fetch.mock.calls.slice(2);
  expect(writes.map(([url]) => url)).toEqual([
    "/_actions/addAwardAssociation",
    "/_actions/addAwardAssociation",
  ]);
  expect(writes.map(([, init]) => JSON.parse(init.body))).toEqual([
    { entityType: "monster", entityId: "one", awardId: "award-1" },
    { entityType: "monster", entityId: "two", awardId: "award-1" },
  ]);
  for (const [, init] of writes) {
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).has("next-action")).toBe(false);
  }
});
