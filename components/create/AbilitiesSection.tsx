import { Plus, Trash } from "lucide-react";
import { useId } from "react";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { AttackDetailsDialog } from "@/components/create/AttackDetailsDialog";
import { FormInput, FormTextarea } from "@/components/shared/Form";
import { Button } from "@/components/ui/button";
import { formatAttackDetails } from "@/lib/text";
import type { Ability } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AbilityRowProps {
  ability: Ability;
  compact?: boolean;
  onChange: (ability: Ability) => void;
  onRemove: () => void;
}

const AbilityRow: React.FC<AbilityRowProps> = ({
  ability,
  compact = false,
  onChange,
  onRemove,
}) => {
  const id = useId();
  if (compact) {
    return (
      <div className="space-y-2 pb-2">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <FormInput
            label="Ability name"
            name={`${id}-name`}
            className="[&_input]:font-bold"
            value={ability.name}
            onChange={(name) => onChange({ ...ability, name })}
          />
          <FormTextarea
            label={
              <span className="flex items-center gap-2">
                Effect <ConditionValidationIcon text={ability.description} />
              </span>
            }
            name={`${id}-effect`}
            value={ability.description}
            rows={1}
            className="[&_textarea]:min-h-9"
            onChange={(description) => onChange({ ...ability, description })}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AttackDetailsDialog
            ability
            name={ability.name}
            value={ability}
            onChange={(details) => onChange({ ...ability, ...details })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ability ${ability.name || "untitled"}`}
            onClick={onRemove}
          >
            <Trash />
          </Button>
        </div>
        {(ability.attackCount || formatAttackDetails(ability)) && (
          <p className="text-sm text-muted-foreground">
            {ability.attackCount ? `${ability.attackCount}× ` : ""}
            {formatAttackDetails(ability)}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-row items-center px-4">
      <div className="flex flex-col w-full gap-2 mb-2">
        <FormInput
          label="Name"
          name="ability-name"
          value={ability.name}
          onChange={(name) => onChange({ ...ability, name })}
        />
        <FormTextarea
          label={
            <div className="flex items-center gap-2">
              Description
              <ConditionValidationIcon text={ability.description} />
            </div>
          }
          name="ability-description"
          value={ability.description}
          rows={1}
          onChange={(description: string) =>
            onChange({ ...ability, description })
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

interface AbilitiesSectionProps {
  abilities: Ability[];
  compact?: boolean;
  onChange: (abilities: Ability[]) => void;
}

export const AbilitiesSection: React.FC<AbilitiesSectionProps> = ({
  abilities,
  compact = false,
  onChange,
}) => (
  <fieldset className="flex flex-col">
    <legend className={cn("font-sans mb-4 font-bold", compact && "sr-only")}>
      Abilities
    </legend>
    {abilities.map((ability, index) => (
      <AbilityRow
        key={ability.id}
        ability={ability}
        compact={compact}
        onChange={(newAbility) => {
          const newAbilities = [...abilities];
          newAbilities[index] = newAbility;
          onChange(newAbilities);
        }}
        onRemove={() => {
          const newAbilities = abilities.filter((_, i) => i !== index);
          onChange(newAbilities);
        }}
      />
    ))}
    <Button
      type="button"
      variant="ghost"
      className="text-muted-foreground"
      onClick={() =>
        onChange([
          ...abilities,
          {
            id: Math.random().toString(36).slice(2),
            name: "",
            description: "",
          },
        ])
      }
    >
      <Plus className="w-6 h-6" />
      {compact ? "Add ability" : "Add"}
    </Button>
  </fieldset>
);
