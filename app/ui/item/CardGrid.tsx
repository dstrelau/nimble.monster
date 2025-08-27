import type { Condition, Item } from "@/lib/types";
import { Card } from "./Card";

interface GridColumns {
  default: number;
  md: number;
  lg?: number;
}

interface CardGridProps {
  items: Item[];
  gridColumns?: GridColumns;
  hideCreator?: boolean;
  conditions?: Condition[];
}

export function CardGrid({
  items,
  gridColumns = { default: 1, md: 2, lg: 3 },
  hideCreator = false,
  conditions = [],
}: CardGridProps) {
  const gridClasses = [
    `grid-cols-${gridColumns.default}`,
    `md:grid-cols-${gridColumns.md}`,
    gridColumns.lg && `lg:grid-cols-${gridColumns.lg}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`grid gap-6 ${gridClasses}`}>
      {items.map((item) => (
        <Card
          key={item.id}
          item={item}
          creator={item.creator}
          hideCreator={hideCreator}
          conditions={conditions}
        />
      ))}
    </div>
  );
}
