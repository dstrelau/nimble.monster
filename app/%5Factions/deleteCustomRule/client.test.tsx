import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomRuleActions } from "@/app/custom-rules/CustomRuleActions";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));

const rule = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Deletion fixture",
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function confirmDelete() {
  fireEvent.click(screen.getByRole("button", { name: /^Delete$/ }));
  const dialog = await screen.findByRole("alertdialog");
  expect(dialog).toHaveTextContent(rule.name);
  expect(dialog).toHaveTextContent("cannot be undone");
  fireEvent.click(within(dialog).getByRole("button", { name: /^Delete$/ }));
}

describe("custom-rule deletion client", () => {
  it("uses stable JSON without next-action, disables pending delete and navigates on success", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<CustomRuleActions rule={rule} />);
    await confirmDelete();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Delete$/ })).toBeDisabled()
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/deleteCustomRule");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    expect(JSON.parse(String(options.body))).toEqual({ id: rule.id });
    finish(Response.json({ success: true }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/my/rules"));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it.each(["http", "network"])(
    "retains the detail and allows manual retry after %s failure",
    async (failure) => {
      const fetchMock = vi.fn();
      if (failure === "http")
        fetchMock.mockResolvedValue(
          Response.json({ error: "Custom rule not found" }, { status: 404 })
        );
      else fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      vi.stubGlobal("fetch", fetchMock);
      render(<CustomRuleActions rule={rule} />);
      await confirmDelete();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Failed to delete custom rule. Please try again."
      );
      expect(mocks.push).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /^Delete$/ })).toBeEnabled();
      expect(fetchMock).toHaveBeenCalledOnce();
      fetchMock.mockResolvedValue(Response.json({ success: true }));
      await confirmDelete();
      await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/my/rules"));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
  );
  it("does not delete on cancellation", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<CustomRuleActions rule={rule} />);
    fireEvent.click(screen.getByRole("button", { name: /^Delete$/ }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
