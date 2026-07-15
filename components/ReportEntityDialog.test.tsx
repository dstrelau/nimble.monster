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

const { mockReportEntity, mockGetMyReport } = vi.hoisted(() => ({
  mockReportEntity: vi.fn(),
  mockGetMyReport: vi.fn(),
}));

vi.mock("@/app/actions/reports", () => ({
  reportEntity: mockReportEntity,
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
  mockGetMyReport.mockResolvedValue(false);
});

afterEach(() => {
  vi.clearAllMocks();
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
    mockReportEntity.mockResolvedValue({ success: true });

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
      expect(mockReportEntity).toHaveBeenCalledWith(
        "item",
        "i1",
        "spam",
        "Looks like duplicate spam."
      );
    });
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

  it("disables the report trigger when the user already reported this entity", async () => {
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
      expect(screen.getByRole("button", { name: "Report" })).toBeDisabled();
    });
  });

  it("disables the report trigger after a successful submission", async () => {
    mockReportEntity.mockResolvedValue({ success: true });

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
      expect(screen.getByRole("button", { name: "Report" })).toBeDisabled();
    });
  });
});
