import type React from "react";
import { PrefixedFormattedText } from "@/components/FormattedText";
import { maybePeriod } from "@/lib/text";
import type { Action, Condition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StrongCondensed } from "./StyledComponents";

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
        <StrongCondensed>{actionPreface}</StrongCondensed>
      </div>
      <ul className={cn("text-base", actions.length > 1 && "pl-4 list-disc")}>
        {actions?.map(
          (action) =>
            action && (
              <li key={action.name}>
                {action.description && (
                  <PrefixedFormattedText
                    content={action.description}
                    conditions={conditions}
                    prefix={
                      <>
                        <strong>{maybePeriod(action.name)}</strong>
                        {action.damage && (
                          <span className="damage">{action.damage} </span>
                        )}
                      </>
                    }
                  />
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
