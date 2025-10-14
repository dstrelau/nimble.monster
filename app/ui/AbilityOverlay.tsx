import { Users } from "lucide-react";
import { PrefixedFormattedText } from "@/components/FormattedText";
import { maybePeriod } from "@/lib/text";
import type { Ability, Condition, FamilyOverview } from "@/lib/types";

export const AbilityOverlay = ({
  abilities,
  families = [],
  conditions,
}: {
  abilities: Ability[];
  families?: FamilyOverview[];
  conditions: Condition[];
}) => {
  if (abilities.length === 0) return null;

  const familyAbilityNames = new Set(
    families?.flatMap((f) => f.abilities.map((a) => a.name)) || []
  );

  return (
    <div className="font-stretch-extra-condensed relative p-2 w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem] bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-sm">
      <div className="flex flex-col gap-4">
        {abilities?.map((ability) => {
          const abilityName = ability.name || "";
          const isFromFamily = familyAbilityNames.has(abilityName);

          return (
            <div key={ability.id}>
              <PrefixedFormattedText
                prefix={
                  <>
                    {isFromFamily && (
                      <Users className="w-4 pb-1 inline-block text-flame" />
                    )}
                    <strong>{maybePeriod(abilityName)}</strong>
                  </>
                }
                content={ability.description || ""}
                conditions={conditions}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
