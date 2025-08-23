import type React from "react";
import type { MonsterCondition } from "@/lib/types";

interface InlineConditionsProps {
  conditions: MonsterCondition[];
}

export const InlineConditions: React.FC<InlineConditionsProps> = ({
  conditions,
}) => {
  const inlineConditions = conditions.filter((c) => c.inline);

  if (inlineConditions.length === 0) return null;

  return (
    <div className="font-condensed p-2 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-sm">
      {inlineConditions.map(
        (c) =>
          c && (
            <p key={c.name}>
              <strong className="font-condensed">{c.name}:</strong>{" "}
              {c.description}
            </p>
          )
      )}
    </div>
  );
};