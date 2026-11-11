import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SourceForm } from "./SourceForm";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => vi.clearAllMocks());

const fill = (values: Record<string, string>) => {
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
};

it("creates over stable JSON, keeping the draft on failure and clearing it on success", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ error: "Internal Server Error" }, { status: 500 })
    )
    .mockResolvedValueOnce(Response.json({ success: true }));
  vi.stubGlobal("fetch", fetcher);
  render(<SourceForm />);
  fill({
    Name: "Core",
    Abbreviation: "CR",
    License: "CC BY 4.0",
    Link: "https://example.com/core",
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Source" }));
  expect(await screen.findByText("Internal Server Error")).toBeInTheDocument();
  expect(screen.getByLabelText("Name")).toHaveValue("Core");
  expect(refresh).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Create Source" }));
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  expect(screen.getByLabelText("Name")).toHaveValue("");
  const [url, options] = fetcher.mock.calls[1];
  expect(url).toBe("/_actions/createSource");
  expect(options.method).toBe("POST");
  expect(new Headers(options.headers).has("next-action")).toBe(false);
  expect(JSON.parse(options.body)).toEqual({
    name: "Core",
    abbreviation: "CR",
    license: "CC BY 4.0",
    link: "https://example.com/core",
  });
});

it("updates the existing source by id", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true }));
  vi.stubGlobal("fetch", fetcher);
  const onSaved = vi.fn();
  render(
    <SourceForm
      source={{
        id: "source-9",
        name: "Old",
        abbreviation: "O",
        license: "OGL",
        link: "https://example.com/o",
        createdAt: null,
        updatedAt: null,
      }}
      onSaved={onSaved}
      submitLabel="Update Source"
    />
  );
  fill({ License: "CC0" });
  fireEvent.click(screen.getByRole("button", { name: "Update Source" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe("/_actions/updateSource");
  expect(JSON.parse(options.body)).toEqual({
    id: "source-9",
    name: "Old",
    abbreviation: "O",
    license: "CC0",
    link: "https://example.com/o",
  });
});
