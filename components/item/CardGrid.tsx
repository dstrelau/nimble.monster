import type { Item } from "@/lib/services/items";
import { Card } from "./Card";

interface GridColumns {
  default: number;
  md: number;
  lg?: number;
}

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
  const gridClasses = [
    `grid-cols-${gridColumns.default}`,
    `md:grid-cols-${gridColumns.md}`,
    gridColumns.lg && `lg:grid-cols-${gridColumns.lg}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`grid gap-6 [&>*]:w-full ${gridClasses}`}>
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
