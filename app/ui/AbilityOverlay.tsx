import { Users } from "lucide-react";
import { Link } from "@/components/app/Link";
import { PrefixedFormattedText } from "@/components/FormattedText";
import { maybePeriod } from "@/lib/text";
import type { Ability, Condition, FamilyOverview } from "@/lib/types";
import { getFamilyUrl } from "@/lib/utils/url";

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

  const abilityToFamily = new Map<string, FamilyOverview>();
  for (const family of families) {
    for (const ability of family.abilities) {
      if (ability.name) {
        abilityToFamily.set(ability.name, family);
      }
    }
  }

  return (
    <div className="font-stretch-extra-condensed relative p-2 w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem] bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-sm">
      <div className="flex flex-col gap-3 leading-5.5">
        {abilities?.map((ability) => {
          const abilityName = ability.name || "";
          const family = abilityToFamily.get(abilityName);

          return (
            <div key={ability.id}>
              <PrefixedFormattedText
                prefix={
                  <span className="inline-flex items-baseline font-bold">
                    {family && (
                      <>
                        <span className="inline-flex items-baseline gap-1 font-bold">
                          <Users className="size-3.5 text-flame" />
                          {family.id ? (
                            <Link
                              href={getFamilyUrl(family)}
                              className="inline-flex items-baseline gap-0.5"
                            >
                              {family.name}
                            </Link>
                          ) : (
                            <span>{family.name}</span>
                          )}
                        </span>
                        :{" "}
                      </>
                    )}
                    {maybePeriod(abilityName)}
                  </span>
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
