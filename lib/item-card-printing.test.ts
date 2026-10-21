import { describe, expect, it } from "vitest";
import {
  CARD_MARGIN_MM,
  CARD_SIZES,
  type CardSize,
  getItemCardPrintLayout,
  PAPER_SIZES,
  type PaperSize,
} from "./item-card-printing";

describe("item card print geometry", () => {
  it.each([
    ["letter", "standard"],
    ["letter", "euro"],
    ["a4", "standard"],
    ["a4", "euro"],
  ] satisfies [
    PaperSize,
    CardSize,
  ][])("fits an exact 3 × 3 grid of %s/%s cards on one page", (paperSize, cardSize) => {
    const paper = PAPER_SIZES[paperSize];
    const card = CARD_SIZES[cardSize];
    const layout = getItemCardPrintLayout(paperSize, cardSize);

    expect(layout).toMatchObject({ columns: 3, rows: 3, capacity: 9 });
    expect(
      layout.horizontalMarginMm * 2 + layout.columns * layout.columnWidthMm
    ).toBeCloseTo(paper.widthMm, 10);
    expect(
      layout.verticalMarginMm * 2 + layout.rows * layout.rowHeightMm
    ).toBeCloseTo(paper.heightMm, 10);

    expect((layout.columns + 1) * layout.columnWidthMm).toBeGreaterThan(
      paper.widthMm
    );
    expect((layout.rows + 1) * layout.rowHeightMm).toBeGreaterThan(
      paper.heightMm
    );
    expect(layout.columnWidthMm - card.widthMm).toBe(CARD_MARGIN_MM * 2);
    expect(layout.rowHeightMm - card.heightMm).toBe(CARD_MARGIN_MM * 2);
  });

  it("keeps the requested physical card dimensions in millimetres", () => {
    expect(CARD_SIZES.standard).toMatchObject({
      widthMm: 63.5,
      heightMm: 88,
    });
    expect(CARD_SIZES.euro).toMatchObject({ widthMm: 59, heightMm: 92 });
  });
});
