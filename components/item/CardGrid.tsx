import type { Item } from "@/lib/services/items";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

type GridColumnCount = 1 | 2 | 3;

interface GridColumns {
  default: GridColumnCount;
  md: GridColumnCount;
  lg?: GridColumnCount;
}

const DEFAULT_GRID_CLASSES: Record<GridColumnCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

const MD_GRID_CLASSES: Record<GridColumnCount, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

const LG_GRID_CLASSES: Record<GridColumnCount, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
};

interface CardGridProps {
  items: Item[];
  gridColumns?: GridColumns;
  hideActions?: boolean;
}

export function CardGrid({
  items,
  gridColumns = { default: 1, md: 2, lg: 3 },
  hideActions = false,
}: CardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6 [&>*]:w-full",
        DEFAULT_GRID_CLASSES[gridColumns.default],
        MD_GRID_CLASSES[gridColumns.md],
        gridColumns.lg && LG_GRID_CLASSES[gridColumns.lg]
      )}
    >
      {items.map((item) => (
        <Card
          key={item.id}
          item={item}
          creator={item.creator}
          hideActions={hideActions}
        />
      ))}
    </div>
  );
}
