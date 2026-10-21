import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
import type { MonsterArtwork } from "@/lib/monster-artwork";
import { MonsterImage } from "./MonsterImage";
import { MonsterImageSelect } from "./MonsterImageSelect";

const artwork: MonsterArtwork = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "22222222-2222-2222-2222-222222222222",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Editor() {
  const [selection, setSelection] = useState<{
    paperforgeId?: string;
    customArtwork: MonsterArtwork | null;
  }>({ paperforgeId: "5", customArtwork: null });
  return (
    <FeatureFlagsProvider enabledFeatures={["monster-custom-artwork"]}>
      <MonsterImageSelect
        value={selection.paperforgeId}
        customArtwork={selection.customArtwork}
        onChange={setSelection}
      />
      <output>{JSON.stringify(selection)}</output>
    </FeatureFlagsProvider>
  );
}

describe("custom monster artwork selection", () => {
  it("previews uploads, validates credit URLs, applies exclusively, and preserves the selection on cancel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => artwork }))
    );
    render(<Editor />);
    fireEvent.click(screen.getByRole("button", { name: "Change image" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Upload" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.change(screen.getByLabelText("Image file"), {
      target: {
        files: [new File(["image"], "troll.png", { type: "image/png" })],
      },
    });
    expect(
      await screen.findByRole("img", { name: "Artwork preview" })
    ).toHaveClass("rounded-full", "object-cover");
    expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
      '"paperforgeId":"5"'
    );
    fireEvent.change(screen.getByLabelText("Artist (optional)"), {
      target: { value: "Morgan Vale" },
    });
    fireEvent.change(screen.getByLabelText("Source URL (optional)"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use image" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use an HTTP or HTTPS URL"
    );
    fireEvent.change(screen.getByLabelText("Source URL (optional)"), {
      target: { value: "https://example.com/art" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use image" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Morgan Vale");
    expect(screen.getByRole("status")).not.toHaveTextContent("paperforgeId");
    fireEvent.click(screen.getByRole("button", { name: "Change image" }));
    fireEvent.change(screen.getByLabelText("Artist (optional)"), {
      target: { value: "Discarded edit" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("status")).toHaveTextContent("Morgan Vale");
    expect(screen.getByRole("status")).not.toHaveTextContent("Discarded edit");
    fireEvent.click(screen.getByRole("button", { name: "Change image" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      '"customArtwork":null'
    );
  });

  it("keeps the old selection after failed uploads and rejects oversized files", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: "The file is not a supported image" }),
      }))
    );
    render(<Editor />);
    fireEvent.click(screen.getByRole("button", { name: "Change image" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Upload" }), {
      button: 0,
      ctrlKey: false,
    });
    const file = new File(["invalid"], "invalid.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Image file"), {
      target: { files: [file] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The file is not a supported image"
    );
    expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
      '"paperforgeId":"5"'
    );
    Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 + 1 });
    await waitFor(() =>
      expect(screen.getByLabelText("Image file")).toBeEnabled()
    );
    fireEvent.change(screen.getByLabelText("Image file"), {
      target: { files: [file] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Images must be 10 MB or smaller"
    );
  });

  it("hides new uploads without the flag, but still displays saved art and allows removal", () => {
    const onChange = vi.fn();
    const { rerender } = render(<MonsterImageSelect onChange={onChange} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Upload" })
    ).not.toBeInTheDocument();
    rerender(
      <MonsterImageSelect
        customArtwork={artwork}
        onChange={onChange}
        portrait
      />
    );
    expect(screen.getByRole("img")).toHaveClass("rounded-full", "object-cover");
    fireEvent.click(screen.getByRole("button", { name: "Change image" }));
    expect(screen.queryByLabelText("Image file")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove image" })).toBeEnabled();
    expect(screen.getByText(/uploads are not enabled/)).toBeInTheDocument();
  });

  it("uses the same circular crop for a rectangular image in compact and card slots", () => {
    const { rerender } = render(
      <MonsterImage customArtwork={artwork} size={24} />
    );
    expect(screen.getByRole("img")).toHaveAttribute("width", "24");
    expect(screen.getByRole("img")).toHaveClass(
      "aspect-square",
      "rounded-full",
      "object-cover"
    );
    rerender(<MonsterImage customArtwork={artwork} size={88} />);
    expect(screen.getByRole("img")).toHaveAttribute("height", "88");
    expect(screen.getByRole("img")).toHaveClass(
      "aspect-square",
      "rounded-full",
      "object-cover"
    );
  });
});
