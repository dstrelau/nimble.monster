import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetMyReport } = vi.hoisted(() => ({
  mockGetMyReport: vi.fn(),
}));
const mockFetch = vi.fn<typeof fetch>();

vi.mock("@/app/actions/reports", () => ({
  getMyReport: mockGetMyReport,
}));

import { ReportEntityDialog } from "./ReportEntityDialog";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockGetMyReport.mockResolvedValue(false);
  mockFetch.mockResolvedValue(Response.json({ success: true }));
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

describe("ReportEntityDialog", () => {
  it("opens the report dialog on click, titled with the entity label", async () => {
    render(
      <ReportEntityDialog
        entityType="monster"
        entityId="m1"
        entityLabel="Monster"
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole("button", { name: "Report" }));

    await waitFor(() => {
      expect(screen.getByText("Report Monster")).toBeInTheDocument();
    });
    expect(screen.getByText("Inappropriate content")).toBeInTheDocument();
    expect(screen.getByText("Spam")).toBeInTheDocument();
  });

  it("submits a report with the selected reason and details", async () => {
    render(
      <ReportEntityDialog entityType="item" entityId="i1" entityLabel="Item" />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole("button", { name: "Report" }));

    const dialog = await screen.findByRole("dialog", { name: "Report Item" });
    fireEvent.click(within(dialog).getByText("Spam"));
    fireEvent.change(
      within(dialog).getByLabelText("Additional details (optional)"),
      { target: { value: "Looks like duplicate spam." } }
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Report" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/_actions/reportEntity", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "item",
          entityId: "i1",
          reason: "spam",
          details: "Looks like duplicate spam.",
        }),
      });
    });
    const init = mockFetch.mock.calls[0][1];
    expect(new Headers(init?.headers).has("next-action")).toBe(false);
  });

  it("disables the report submit button until a reason is selected", async () => {
    render(
      <ReportEntityDialog
        entityType="monster"
        entityId="m1"
        entityLabel="Monster"
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole("button", { name: "Report" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Report Monster",
    });
    expect(
      within(dialog).getByRole("button", { name: "Report" })
    ).toBeDisabled();
  });

  it("shows a disabled filled Reported trigger when already reported", async () => {
    mockGetMyReport.mockResolvedValue(true);

    render(
      <ReportEntityDialog
        entityType="monster"
        entityId="m1"
        entityLabel="Monster"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      const button = screen.getByRole("button", { name: "Reported" });
      expect(button).toBeDisabled();
      expect(button.querySelector("svg")).toHaveClass("fill-current");
    });
  });

  it("disables the report trigger after a successful submission", async () => {
    render(
      <ReportEntityDialog
        entityType="monster"
        entityId="m1"
        entityLabel="Monster"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Report" })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Report" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Report Monster",
    });
    fireEvent.click(within(dialog).getByText("Spam"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Report" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reported" })).toBeDisabled();
    });
  });

  it.each(["http", "network"])(
    "retains the draft after a %s failure and permits manual retry",
    async (failure) => {
      if (failure === "http") {
        mockFetch.mockResolvedValueOnce(
          Response.json({ error: "Not authenticated" }, { status: 401 })
        );
      } else {
        mockFetch.mockRejectedValueOnce(new Error("Network unavailable"));
      }
      render(
        <ReportEntityDialog
          entityType="item"
          entityId="i1"
          entityLabel="Item"
        />,
        { wrapper: createWrapper() }
      );
      fireEvent.click(screen.getByRole("button", { name: "Report" }));
      const dialog = await screen.findByRole("dialog");
      fireEvent.click(within(dialog).getByText("Other"));
      const details = within(dialog).getByLabelText(
        "Additional details (optional)"
      );
      fireEvent.change(details, { target: { value: "Retain this draft" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Report" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        failure === "http" ? "Not authenticated" : "Network unavailable"
      );
      expect(details).toHaveValue("Retain this draft");
      expect(
        within(dialog).getByRole("radio", { name: "Other" })
      ).toBeChecked();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(
        within(dialog).getByRole("button", { name: "Report" })
      ).toBeEnabled();
      fireEvent.click(within(dialog).getByRole("button", { name: "Report" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Reported" })).toBeDisabled();
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1]).toEqual(mockFetch.mock.calls[0]);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }
  );

  it("disables submission while the request is pending", async () => {
    let finish: ((response: Response) => void) | undefined;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    render(
      <ReportEntityDialog entityType="item" entityId="i1" entityLabel="Item" />,
      { wrapper: createWrapper() }
    );
    fireEvent.click(screen.getByRole("button", { name: "Report" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByText("Spam"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Report" }));
    await waitFor(() => {
      expect(
        within(dialog).getByRole("button", { name: "Report" })
      ).toBeDisabled();
    });
    finish?.(Response.json({ success: true }));
    await screen.findByRole("button", { name: "Reported" });
  });
});
