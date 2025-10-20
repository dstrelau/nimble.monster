import type { Monster } from "@/lib/services/monsters";
import { Card } from "./Card";

export const CardGrid = ({
  monsters,
  hideActions = false,
  hideFamilyAbilities = false,
  hideFamilyName = false,
}: {
  monsters: Monster[];
  hideActions?: boolean;
  hideFamilyAbilities?: boolean;
  hideFamilyName?: boolean;
}) => {
  return (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {monsters.map((m) => {
        return (
          <Card
            key={m.id}
            monster={m}
            creator={m.creator}
            hideActions={hideActions}
            hideFamilyAbilities={hideFamilyAbilities}
            hideFamilyName={hideFamilyName}
          />
        );
      })}
    </div>
  );
};
