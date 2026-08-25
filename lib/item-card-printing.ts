export const PAPER_SIZES = {
  letter: {
    label: "US Letter",
    widthMm: 215.9,
    heightMm: 279.4,
    cssName: "letter",
  },
  a4: {
    label: "A4",
    widthMm: 210,
    heightMm: 297,
    cssName: "A4",
  },
} as const;

export const CARD_SIZES = {
  standard: {
    label: "Standard (88 × 63.5 mm)",
    widthMm: 63.5,
    heightMm: 88,
  },
  euro: {
    label: "Euro (92 × 59 mm)",
    widthMm: 59,
    heightMm: 92,
  },
} as const;

export const CARD_MARGIN_MM = 0.5;

export type PaperSize = keyof typeof PAPER_SIZES;
export type CardSize = keyof typeof CARD_SIZES;

export interface ItemCardPrintLayout {
  columns: number;
  rows: number;
  capacity: number;
  columnWidthMm: number;
  rowHeightMm: number;
  horizontalMarginMm: number;
  verticalMarginMm: number;
}

export function getItemCardPrintLayout(
  paperSize: PaperSize,
  cardSize: CardSize
): ItemCardPrintLayout {
  const paper = PAPER_SIZES[paperSize];
  const card = CARD_SIZES[cardSize];
  const columnWidthMm = card.widthMm + CARD_MARGIN_MM * 2;
  const rowHeightMm = card.heightMm + CARD_MARGIN_MM * 2;
  const columns = Math.floor(paper.widthMm / columnWidthMm);
  const rows = Math.floor(paper.heightMm / rowHeightMm);

  return {
    columns,
    rows,
    capacity: columns * rows,
    columnWidthMm,
    rowHeightMm,
    horizontalMarginMm: (paper.widthMm - columns * columnWidthMm) / 2,
    verticalMarginMm: (paper.heightMm - rows * rowHeightMm) / 2,
  };
}
