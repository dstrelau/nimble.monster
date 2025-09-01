import clsx from "clsx";
import type { Companion } from "@/lib/types";
import { Card } from "./Card";

export const CardGrid = ({
  companions,
  hideActions = false,
  gridColumns = { default: 1, md: 1, lg: 2 },
  hideCreator = false,
}: {
  companions: Companion[];
  hideActions?: boolean;
  gridColumns?: { default?: number; sm?: number; md?: number; lg?: number };
  hideCreator?: boolean;
}) => {
  return (
    <div
      className={clsx(
        "grid gap-8",
        gridColumns.default && `grid-cols-${gridColumns.default}`,
        gridColumns.sm && `grid-cols-${gridColumns.sm}`,
        gridColumns.md && `md:grid-cols-${gridColumns.md}`,
        gridColumns.lg && `lg:grid-cols-${gridColumns.lg}`
      )}
    >
      {companions.map((c) => {
        return (
          <Card
            key={c.id}
            companion={c}
            creator={c.creator}
            hideActions={hideActions}
            hideCreator={hideCreator}
          />
        );
      })}
    </div>
  );
};
