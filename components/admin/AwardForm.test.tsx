import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AwardForm } from "./AwardForm";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => vi.clearAllMocks());

it("uses stable JSON without next-action, retains errors/draft, disables pending saves and retries", async () => {
  let finish: (response: Response) => void = () => {};
  const fetcher = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValueOnce(Response.json({ success: true }));
  vi.stubGlobal("fetch", fetcher);
  render(<AwardForm />);
  for (const [label, value] of [
    ["Name", "QA Award"],
    ["Abbreviation", "Q27"],
    ["URL", "https://example.com"],
    ["Description", "Retain me"],
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  const form = screen
    .getByRole("button", { name: "Create Award" })
    .closest("form");
  if (!form) throw new Error("Missing award form");
  fireEvent.submit(form);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Create Award" })).toBeDisabled()
  );
  expect(fetcher.mock.calls[0][0]).toBe("/_actions/createAward");
  const options = fetcher.mock.calls[0][1];
  expect(options.method).toBe("POST");
  expect(new Headers(options.headers).has("next-action")).toBe(false);
  expect(JSON.parse(options.body)).toMatchObject({
    name: "QA Award",
    abbreviation: "Q27",
    color: "blue",
    icon: "award",
  });
  finish(Response.json({ error: "Try again" }, { status: 500 }));
  await screen.findByText("Try again");
  expect(screen.getByLabelText("Description")).toHaveValue("Retain me");
  expect(push).not.toHaveBeenCalled();
  fireEvent.submit(form);
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  expect(push).toHaveBeenCalledWith("/admin/awards");
  expect(screen.getByLabelText("Name")).toHaveValue("");
});
