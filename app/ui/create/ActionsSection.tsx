import { cn, condensed } from "lib/utils";
import { CircleSlash2, Plus, Sword, Trash } from "lucide-react";
import { useMemo } from "react";
import { FormInput, FormTextarea } from "@/components/app/Form";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateAverageDamageOnHit,
  calculateProbabilityDistribution,
  parseDiceNotation,
} from "@/lib/dice";
import type { Action } from "@/lib/types";

interface ActionRowProps {
  action: Action;
  showDamage?: boolean;
  onChange: (action: Action) => void;
  onRemove: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  action,
  showDamage = true,
  onChange,
  onRemove,
}) => {
  const distribution = useMemo(() => {
    if (!action.damage || !showDamage) return null;
    const diceRoll = parseDiceNotation(action.damage);
    if (!diceRoll) return null;
    const distribution = calculateProbabilityDistribution(diceRoll);
    return distribution;
  }, [action.damage, showDamage]);

  let avgDamage: number | undefined;
  let missPercent: number | undefined;
  if (distribution) {
    avgDamage = calculateAverageDamageOnHit(distribution);
    missPercent = 100 * (distribution.get(0) || 0);
  }

  return (
    <div className="flex flex-row items-center">
      <div className="flex flex-col w-full gap-2 mb-2 pl-4">
        <div className="flex flex-col md:flex-row mb-2 gap-x-4">
          <FormInput
            label="Name"
            name="action-name"
            className="grow-3"
            value={action.name}
            onChange={(name) => onChange({ ...action, name })}
          />
          {showDamage && (
            <FormInput
              name="action-damage"
              value={action.damage || ""}
              onChange={(damage) => onChange({ ...action, damage })}
              label={
                <TooltipProvider>
                  <span className="flex-1">Damage</span>{" "}
                  {missPercent && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center leading-4">
                          <CircleSlash2 className="h-4" />
                          {missPercent.toFixed(0)}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Miss Chance: {missPercent.toFixed(0)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {avgDamage && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center leading-4">
                          <Sword className="h-4" />
                          {avgDamage.toFixed(1)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Avg. Damage on Hit: {avgDamage.toFixed(1)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              }
            />
          )}
        </div>
        <FormTextarea
          label={
            <div className="flex items-center gap-2">
              Description
              <ConditionValidationIcon text={action.description || ""} />
            </div>
          }
          name="action-description"
          value={action.description || ""}
          rows={2}
          onChange={(description: string) =>
            onChange({ ...action, description })
          }
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="m-2"
      >
        <Trash className="h-6 w-6 text-muted-foreground" />
      </Button>
    </div>
  );
};

interface ActionsSectionProps {
  actions: Action[];
  actionPreface: string;
  showDamage?: boolean;
  onChange: (actions: Action[]) => void;
  onPrefaceChange: (preface: string) => void;
}

export const ActionsSection: React.FC<ActionsSectionProps> = ({
  actions,
  actionPreface,
  showDamage = true,
  onChange,
  onPrefaceChange,
}) => (
  <fieldset className="flex flex-col gap-4">
    <legend className={cn(condensed.className, "mb-4 font-bold")}>
      Actions
    </legend>
    <div className="flex flex-col gap-4">
      <FormInput
        label="Preface"
        name="actionPreface"
        value={actionPreface}
        onChange={onPrefaceChange}
      />
      {actions.map((action, index) => (
        <ActionRow
          key={action.id}
          action={action}
          showDamage={showDamage}
          onChange={(newAction) => {
            const newActions = [...actions];
            newActions[index] = newAction;
            onChange(newActions);
          }}
          onRemove={() => {
            const newActions = actions.filter((_, i) => i !== index);
            onChange(newActions);
          }}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        className="text-muted-foreground"
        onClick={() =>
          onChange([
            ...actions,
            { id: crypto.randomUUID(), name: "", damage: "", description: "" },
          ])
        }
      >
        <Plus className="w-6 h-6" />
        Add
      </Button>
    </div>
  </fieldset>
);
