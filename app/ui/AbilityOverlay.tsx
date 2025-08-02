import { Users } from "lucide-react";
import { maybePeriod } from "@/lib/text";
import type { Ability, Family } from "@/lib/types";

export const AbilityOverlay = ({
  abilities,
  family,
}: {
  abilities: Ability[];
  family?: Family;
}) => {
  if (abilities.length === 0) return null;

  const familyAbilities = family?.abilities || [];
  const familyAbilityNames = new Set(
    familyAbilities.map((a) => a.name || a.Name)
  );

  return (
    <div className="ability relative font-condensed p-2 bg-secondary text-secondary-foreground shadow-sm  w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem]">
      <div className="flex flex-col gap-4">
        {abilities?.map((ability) => {
          const abilityName = ability.name || ability.Name || "";
          const isFromFamily = familyAbilityNames.has(abilityName);

          return (
            <div key={abilityName}>
              {isFromFamily && family && (
                <>
                  <Users className="w-4 pb-1 mr-1 inline-block align-middle" />
                  <strong className="pr-1 font-condensed">
                    {family.name}:
                  </strong>
                </>
              )}
              <strong className="pr-1 font-condensed">
                {maybePeriod(abilityName)}
              </strong>
              {ability.description || ability.Description || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
};
