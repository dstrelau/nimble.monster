import { maybePeriod } from "@/lib/text";
import type { Ability, Family } from "@/lib/types";
import { Users } from "lucide-react";
import React from "react";

export const AbilityOverlay = ({
  abilities,
  family,
}: {
  abilities: Ability[];
  family?: Family;
}) => {
  if (abilities.length === 0) return null;
  return (
    <div className="ability relative font-condensed p-2 leading-5 bg-base-300 shadow-sm  w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem]">
      {abilities.length > 1 && family ? (
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center">
            <Users className="w-4 pb-1 mr-1 inline-block align-middle" />
            <strong className="pr-1 font-condensed">{family.name}</strong>
          </div>
          <ul className="flex flex-col gap-y-1">
            {abilities?.map((ability) => (
              <li key={ability.name}>
                <strong className="pr-1 font-condensed">
                  {maybePeriod(ability.name || ability.Name || "")}
                </strong>
                {ability.description || ability.Description || ""}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <React.Fragment>
          {family && (
            <>
              <Users className="w-4 pb-1 mr-1 inline-block align-middle" />
              <strong className="pr-1 font-condensed">{family.name}:</strong>
            </>
          )}
          <strong className="pr-1 font-condensed">
            {maybePeriod(abilities[0].name || abilities[0].Name || "")}
          </strong>
          {abilities[0].description || abilities[0].Description || ""}
          <br />
        </React.Fragment>
      )}
    </div>
  );
};
