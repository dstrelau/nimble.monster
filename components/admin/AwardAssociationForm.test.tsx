import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AwardAssociationForm } from "./AwardAssociationForm";

afterEach(() => {
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
  const onSubmit = vi.fn();
  render(<AwardAssociationForm awards={[]} onSubmit={onSubmit} />);
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
  expect(onSubmit).not.toHaveBeenCalled();
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
