import { maybePeriod } from "@/lib/text";
import type { Ability, Family } from "@/lib/types";
import { Users } from "lucide-react";

export const AbilityOverlay = ({
  ability,
  family,
}: {
  ability: Ability;
  family?: Family;
}) => (
  <p
    className={
      `ability relative font-condensed p-2 leading-5 bg-base-300 shadow-sm ` +
      `w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem] `
    }
  >
    {family && (
      <>
        <Users className="w-4 pb-1 mr-1 inline-block align-middle" />
        <strong className="pr-1 font-condensed">{family.name}:</strong>
      </>
    )}
    <strong className="pr-1 font-condensed">
      {maybePeriod(ability.name || ability.Name || "")}
    </strong>
    {ability.description || ability.Description || ""}
  </p>
);
