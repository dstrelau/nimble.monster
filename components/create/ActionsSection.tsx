import { CircleSlash2, LoaderCircle, Plus, Sword, Trash } from "lucide-react";
import { useId } from "react";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { AttackDetailsDialog } from "@/components/create/AttackDetailsDialog";
import { FormInput, FormTextarea } from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDiceStatistics } from "@/lib/hooks/useDiceStatistics";
import { formatAttackDetails } from "@/lib/text";
import type { Action } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActionRowProps {
  action: Action;
  showDamage?: boolean;
  compact?: boolean;
  onChange: (action: Action) => void;
  onRemove: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  action,
  showDamage = true,
  compact = false,
  onChange,
  onRemove,
}) => {
  const id = useId();
  const { stats, showLoading, error } = useDiceStatistics(
    showDamage ? (action.damage ?? null) : null
  );
  const avgDamage = stats?.averageRoll;
  const missPercent = stats ? 100 * stats.missProbability : undefined;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div
            className={cn(
              "grid min-w-0 gap-3",
              showDamage && "grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
            )}
          >
            <FormInput
              label="Action name"
              name={`${id}-name`}
              className="[&_input]:font-bold"
              value={action.name}
              onChange={(name) => onChange({ ...action, name })}
            />
            {showDamage && (
              <FormInput
                label="Damage"
                name={`${id}-damage`}
                value={action.damage || ""}
                onChange={(damage) => onChange({ ...action, damage })}
              />
            )}
          </div>
          <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
            <AttackDetailsDialog
              name={action.name}
              value={action}
              onChange={(details) => onChange({ ...action, ...details })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove action ${action.name || "untitled"}`}
            onClick={onRemove}
          >
            <Trash />
          </Button>
        </div>
        {(action.attackCount || formatAttackDetails(action)) && (
          <p className="text-sm text-muted-foreground">
            {action.attackCount ? `${action.attackCount}× ` : ""}
            {formatAttackDetails(action)}
          </p>
        )}
        {showDamage && (error || showLoading || stats) && (
          <p
            className="text-xs text-muted-foreground"
            role={error ? "alert" : undefined}
          >
            {error ||
              (showLoading
                ? "Calculating damage…"
                : `Average hit ${avgDamage?.toFixed(1)} · Miss ${missPercent?.toFixed(0)}%`)}
          </p>
        )}
        <FormTextarea
          label={
            <span className="flex items-center gap-2">
              Effect <ConditionValidationIcon text={action.description} />
            </span>
          }
          name={`${id}-effect`}
          value={action.description || ""}
          rows={1}
          className="[&_textarea]:min-h-9"
          onChange={(description) => onChange({ ...action, description })}
        />
      </div>
    );
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
                  {showLoading && (
                    <output className="inline-flex items-center">
                      <LoaderCircle
                        className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Loading dice statistics</span>
                    </output>
                  )}
                  {error && <span role="alert">{error}</span>}
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
              <ConditionValidationIcon text={action.description} />
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
  compact?: boolean;
  onChange: (actions: Action[]) => void;
  onPrefaceChange: (preface: string) => void;
}

export const ActionsSection: React.FC<ActionsSectionProps> = ({
  actions,
  actionPreface,
  showDamage = true,
  compact = false,
  onChange,
  onPrefaceChange,
}) => {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className={cn("font-sans mb-4 font-bold", compact && "sr-only")}>
        Actions
      </legend>
      <div className="flex flex-col gap-4">
        <FormInput
          label="Preface"
          name={compact ? `${id}-preface` : "actionPreface"}
          className={cn(compact && "[&_input]:font-bold")}
          value={actionPreface}
          onChange={onPrefaceChange}
        />
        {actions.map((action, index) => (
          <ActionRow
            key={action.id}
            action={action}
            showDamage={showDamage}
            compact={compact}
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
              {
                id: Math.random().toString(36).slice(2),
                name: "",
                damage: "",
                description: "",
              },
            ])
          }
        >
          <Plus className="w-6 h-6" />
          {compact ? "Add action" : "Add"}
        </Button>
      </div>
    </fieldset>
  );
};
