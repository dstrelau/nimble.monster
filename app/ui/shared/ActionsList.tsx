import type React from "react";
import { DiceNotation } from "@/components/DiceNotation";
import { PrefixedFormattedText } from "@/components/FormattedText";
import { maybePeriod } from "@/lib/text";
import type { Action, Condition } from "@/lib/types";

interface ActionsListProps {
  actions: Action[];
  conditions: Condition[];
  actionPreface?: string;
}

export const ActionsList: React.FC<ActionsListProps> = ({
  actions,
  conditions,
  actionPreface = "ACTIONS:",
}) => {
  if (actions.length === 0) return null;

  return (
    <div>
      <div>
        <strong>{actionPreface}</strong>
      </div>
      <ul className="text-base leading-5.5 space-y-1">
        {actions?.map(
          (action) =>
            action && (
              <li key={action.id}>
                <PrefixedFormattedText
                  content={action.description || ""}
                  conditions={conditions}
                  prefix={
                    <>
                      {actions.length > 1 && (
                        <span className="text-foreground">•</span>
                      )}
                      <strong>{maybePeriod(action.name)}</strong>
                      {action.damage && <DiceNotation text={action.damage} />}
                      {action.damage && action.description && ". "}
                    </>
                  }
                />
                {action.range && (
                  <span className="range">({action.range} ft)</span>
                )}
              </li>
            )
        )}
      </ul>
    </div>
  );
};
