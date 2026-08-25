"use client";

import { ChevronLeft, ChevronRight, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SelectableItemGrid } from "@/app/collections/SelectableItemGrid";
import { Card } from "@/components/item/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARD_MARGIN_MM,
  CARD_SIZES,
  type CardSize,
  getItemCardPrintLayout,
  PAPER_SIZES,
  type PaperSize,
} from "@/lib/item-card-printing";
import type { Item } from "@/lib/services/items";

const CARD_SLOT_IDS = Array.from(
  { length: 9 },
  (_, slotIndex) => `card-slot-${slotIndex + 1}`
);

export function ItemCardPrinter() {
  const [paperSize, setPaperSize] = useState<PaperSize>("letter");
  const [cardSize, setCardSize] = useState<CardSize>("standard");
  const [selectedItems, setSelectedItems] = useState<Map<string, Item>>(
    () => new Map()
  );
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const selectedIds = useMemo(
    () => new Set(selectedItems.keys()),
    [selectedItems]
  );
  const layout = getItemCardPrintLayout(paperSize, cardSize);
  const paper = PAPER_SIZES[paperSize];
  const card = CARD_SIZES[cardSize];
  const itemPages = useMemo(() => {
    const items = [...selectedItems.values()];
    return Array.from(
      { length: Math.ceil(items.length / layout.capacity) },
      (_, pageIndex) =>
        items.slice(
          pageIndex * layout.capacity,
          (pageIndex + 1) * layout.capacity
        )
    );
  }, [layout.capacity, selectedItems]);
  const pageCount = Math.max(itemPages.length, 1);
  const activePageIndex = Math.min(selectedPageIndex, pageCount - 1);
  const previewPages = itemPages.length > 0 ? itemPages : [[]];

  const toggleItem = (item: Item) => {
    const next = new Map(selectedItems);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.set(item.id, item);
      setSelectedPageIndex(Math.floor((next.size - 1) / layout.capacity));
    }
    setSelectedItems(next);
  };

  return (
    <div className="item-card-printer space-y-8">
      <style>{`@media print { @page { size: ${paper.cssName} portrait; margin: 0; } }`}</style>

      <section className="printer-controls space-y-4">
        <div>
          <h1 className="font-slab text-3xl font-black">Print Item Cards</h1>
          <p className="mt-1 text-muted-foreground">
            Select items to fill {layout.capacity} cards per page, then print at
            100% scale.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="paper-size">Paper size</Label>
            <Select
              value={paperSize}
              onValueChange={(value) => {
                if (value === "letter" || value === "a4") setPaperSize(value);
              }}
            >
              <SelectTrigger id="paper-size" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">
                  {PAPER_SIZES.letter.label}
                </SelectItem>
                <SelectItem value="a4">{PAPER_SIZES.a4.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-size">Card size</Label>
            <Select
              value={cardSize}
              onValueChange={(value) => {
                if (value === "standard" || value === "euro") {
                  setCardSize(value);
                }
              }}
            >
              <SelectTrigger id="card-size" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  {CARD_SIZES.standard.label}
                </SelectItem>
                <SelectItem value="euro">{CARD_SIZES.euro.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {selectedItems.size} selected
            </span>
            <fieldset className="flex items-center gap-1">
              <legend className="sr-only">Print sheet pages</legend>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Previous print page"
                disabled={activePageIndex === 0}
                onClick={() => setSelectedPageIndex(activePageIndex - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-20 text-center text-sm font-medium">
                Page {activePageIndex + 1} of {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Next print page"
                disabled={activePageIndex === pageCount - 1}
                onClick={() => setSelectedPageIndex(activePageIndex + 1)}
              >
                <ChevronRight />
              </Button>
            </fieldset>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Clear selected cards"
              disabled={selectedItems.size === 0}
              onClick={() => {
                setSelectedItems(new Map());
                setSelectedPageIndex(0);
              }}
            >
              <Trash2 />
            </Button>
            <Button
              type="button"
              disabled={selectedItems.size === 0}
              onClick={() => window.print()}
            >
              <Printer />
              Print cards
            </Button>
          </div>
        </div>
      </section>

      <div className="printer-preview overflow-auto rounded-lg border bg-muted p-4">
        {previewPages.map((pageItems, pageIndex) => (
          <div
            key={pageItems[0]?.id ?? "empty-page"}
            className="item-card-print-sheet mx-auto grid bg-white shadow-lg"
            data-paper-size={paperSize}
            data-card-size={cardSize}
            data-page={pageIndex + 1}
            data-active={pageIndex === activePageIndex ? "true" : "false"}
            style={{
              width: `${paper.widthMm}mm`,
              height: `${paper.heightMm}mm`,
              padding: `${layout.verticalMarginMm}mm ${layout.horizontalMarginMm}mm`,
              gridTemplateColumns: `repeat(${layout.columns}, ${layout.columnWidthMm}mm)`,
              gridTemplateRows: `repeat(${layout.rows}, ${layout.rowHeightMm}mm)`,
            }}
          >
            {pageItems.map((item) => (
              <div
                key={item.id}
                className="item-card-print-frame"
                data-print-card={item.id}
                style={{
                  width: `${card.widthMm}mm`,
                  height: `${card.heightMm}mm`,
                  margin: `${CARD_MARGIN_MM}mm`,
                }}
              >
                <Card
                  item={item}
                  creator={item.creator}
                  link={false}
                  noInteractive
                  hideActions
                  compact
                  className="size-full overflow-hidden rounded-none border-0 shadow-none"
                />
              </div>
            ))}
            {CARD_SLOT_IDS.slice(pageItems.length, layout.capacity).map(
              (slotId) => (
                <div
                  key={slotId}
                  className="item-card-print-placeholder"
                  aria-hidden="true"
                  style={{
                    width: `${card.widthMm}mm`,
                    height: `${card.heightMm}mm`,
                    margin: `${CARD_MARGIN_MM}mm`,
                  }}
                />
              )
            )}
          </div>
        ))}
      </div>

      <section className="printer-picker space-y-4">
        <h2 className="font-slab text-2xl font-black">Choose items</h2>
        <SelectableItemGrid selectedIds={selectedIds} onToggle={toggleItem} />
      </section>
    </div>
  );
}
