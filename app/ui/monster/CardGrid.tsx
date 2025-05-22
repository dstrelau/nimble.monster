import type { Monster } from "@/lib/types";
import clsx from "clsx";
import { Card } from "./Card";

export const CardGrid = ({
  monsters,
  showActions,
  gridColumns = { default: 1, md: 2, lg: 3 },
}: {
  monsters: Monster[];
  showActions: boolean;
  gridColumns?: { default?: number; sm?: number; md?: number; lg?: number };
}) => {
  return (
    <div
      className={clsx(
        "grid gap-8",
        gridColumns.default && `grid-cols-${gridColumns.default}`,
        gridColumns.sm && `grid-cols-${gridColumns.sm}`,
        gridColumns.md && `md:grid-cols-${gridColumns.md}`,
        gridColumns.lg && `lg:grid-cols-${gridColumns.lg}`,
      )}
    >
      {monsters.map((m) => (
        <Card
          key={m.id}
          monster={m}
          creator={m.creator}
          showActions={showActions}
        />
      ))}
    </div>
  );
};
