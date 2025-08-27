import type React from "react";
import { FormattedText } from "@/components/FormattedText";
import { maybePeriod } from "@/lib/text";
import type { Action, MonsterCondition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StrongCondensed } from "./StyledComponents";

interface ActionsListProps {
  actions: Action[];
  conditions: MonsterCondition[];
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
        <StrongCondensed>{actionPreface}</StrongCondensed>
      </div>
      <ul className={cn("text-base", actions.length > 1 && "pl-4 list-disc")}>
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
                    <FormattedText
                      content={action.description}
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
