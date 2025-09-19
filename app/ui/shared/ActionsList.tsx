import type React from "react";
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
        <strong className="font-stretch-ultra-condensed">
          {actionPreface}
        </strong>
      </div>
      <ul className="text-base">
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
                      {action.damage && (
                        <span className="damage">{action.damage} </span>
                      )}
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
