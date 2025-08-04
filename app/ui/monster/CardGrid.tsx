import clsx from "clsx";
import type { Monster } from "@/lib/types";
import { Card } from "./Card";

export const CardGrid = ({
  monsters,
  hideActions = false,
  currentUserId,
  gridColumns = { default: 1, md: 2, lg: 3 },
  hideFamilyAbilities = false,
}: {
  monsters: Monster[];
  hideActions?: boolean;
  currentUserId?: string;
  gridColumns?: { default?: number; sm?: number; md?: number; lg?: number };
  hideFamilyAbilities?: boolean;
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
      {monsters.map((m) => {
        const isOwner =
          !!currentUserId && currentUserId === m.creator?.discordId;
        return (
          <Card
            key={m.id}
            monster={m}
            creator={m.creator}
            isOwner={isOwner}
            hideActions={hideActions}
            hideFamilyAbilities={hideFamilyAbilities}
          />
        );
      })}
    </div>
  );
};
