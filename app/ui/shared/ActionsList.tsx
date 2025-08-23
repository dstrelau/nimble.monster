import type React from "react";
import { WithConditionsTooltips } from "@/components/WithConditionsTooltips";
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
        <strong className="font-condensed">{actionPreface}</strong>
      </div>
      <ul className="text-base list-disc pl-4">
        {actions?.map(
          (action) =>
            action && (
              <li key={action.name}>
                <strong className="pr-1">{maybePeriod(action.name)}</strong>
                {action.damage && (
                  <span className="damage">{action.damage} </span>
                )}
                {action.description && (
                  <span className="description">
                    <WithConditionsTooltips
                      text={action.description}
                      conditions={conditions}
                    />
                  </span>
                )}
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
