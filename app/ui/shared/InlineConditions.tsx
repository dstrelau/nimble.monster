import type React from "react";
import type { MonsterCondition } from "@/lib/types";
import { InlineConditionsBox, StrongCondensed } from "./StyledComponents";

interface InlineConditionsProps {
  conditions: MonsterCondition[];
}

export const InlineConditions: React.FC<InlineConditionsProps> = ({
  conditions,
}) => {
  const inlineConditions = conditions.filter((c) => c.inline);

  if (inlineConditions.length === 0) return null;

  return (
    <InlineConditionsBox>
      {inlineConditions.map(
        (c) =>
          c && (
            <p key={c.name}>
              <StrongCondensed>{c.name}:</StrongCondensed> {c.description}
            </p>
          )
      )}
    </InlineConditionsBox>
  );
};
