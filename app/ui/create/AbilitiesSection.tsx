import { Plus, Trash } from "lucide-react";
import { FormInput, FormTextarea } from "@/components/app/Form";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Button } from "@/components/ui/button";
import type { Ability } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AbilityRowProps {
  ability: Ability;
  onChange: (ability: Ability) => void;
  onRemove: () => void;
}

const AbilityRow: React.FC<AbilityRowProps> = ({
  ability,
  onChange,
  onRemove,
}) => (
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

interface AbilitiesSectionProps {
  abilities: Ability[];
  onChange: (abilities: Ability[]) => void;
}

export const AbilitiesSection: React.FC<AbilitiesSectionProps> = ({
  abilities,
  onChange,
}) => (
  <fieldset className="flex flex-col">
    <legend className={cn("font-sans mb-4 font-bold")}>Abilities</legend>
    {abilities.map((ability, index) => (
      <AbilityRow
        key={ability.id}
        ability={ability}
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
          { id: crypto.randomUUID(), name: "", description: "" },
        ])
      }
    >
      <Plus className="w-6 h-6" />
      Add
    </Button>
  </fieldset>
);
