import { Users } from "lucide-react";
import { WithConditionsTooltips } from "@/components/WithConditionsTooltips";
import { maybePeriod } from "@/lib/text";
import type { Ability, Condition, FamilyOverview } from "@/lib/types";

export const AbilityOverlay = ({
  abilities,
  family,
  conditions = [],
}: {
  abilities: Ability[];
  family?: FamilyOverview;
  conditions: Condition[];
}) => {
  if (abilities.length === 0) return null;

  const familyAbilities = family?.abilities || [];
  const familyAbilityNames = new Set(
    familyAbilities.map((a) => a.name || a.Name)
  );

  return (
    <div className="ability relative font-condensed p-2 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-sm w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem]">
      <div className="flex flex-col gap-4">
        {abilities?.map((ability) => {
          const abilityName = ability.name || ability.Name || "";
          const isFromFamily = familyAbilityNames.has(abilityName);

          return (
            <div key={abilityName}>
              {isFromFamily && family && (
                <Users className="w-4 pb-1 mr-0.5 inline-block text-flame" />
              )}
              <strong className="pr-1">{maybePeriod(abilityName)}</strong>
              <WithConditionsTooltips
                text={ability.description || ability.Description}
                conditions={conditions}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
