import { useContext, useState } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  Monster,
  Ability,
  Action,
  MonsterSize,
  MonsterArmor,
} from "../lib/types";
import MonsterCard from "../components/MonsterCard";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import { AuthContext } from "../lib/auth";

const SIZES: { value: MonsterSize; label: string }[] = [
  { value: "tiny", label: "Tiny" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "gargantuan", label: "Gargantuan" },
];

const ARMORS: { value: MonsterArmor; label: string }[] = [
  { value: "none", label: "None" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

const EXAMPLE_MONSTERS = {
  kobold: {
    name: "Kobold",
    level: "1/3",
    size: "small" as MonsterSize,
    armor: "none" as MonsterArmor,
    swim: 0,
    fly: 0,
    speed: 6,
    hp: 12,
    abilities: [
      {
        name: "Nooooo!",
        description: "When an ally within 2 spaces dies, attack once for free.",
      },
    ],
    actions: [
      { name: "Stab", damage: "1d4+2", description: "(or Sling, Range 8)" },
    ],
  },
};

interface FormInputTextProps {
  label: string;
  name: string;
  value: string;
  className?: string;
  onChange: (value: string) => void;
}

const FormInputText: React.FC<FormInputTextProps> = ({
  label,
  name,
  value,
  className = "",
  onChange,
}) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm/6 font-medium text-gray-900">
      {label}
    </label>
    <div>
      <input
        type="text"
        name={name}
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-1.5 text-gray-900 focus:ring-0 sm:text-sm/6"
      />
    </div>
  </div>
);

interface FormInputNumberProps {
  label: string;
  name: string;
  value: number;
  className?: string;
  onChange: (value: number) => void;
}

const FormInputNumber: React.FC<FormInputNumberProps> = ({
  label,
  name,
  value,
  className = "",
  onChange,
}) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm/6 font-medium text-gray-900">
      {label}
    </label>
    <div>
      <input
        type="number"
        name={name}
        id={name}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full py-1.5 text-gray-900 focus:ring-0 sm:text-sm/6"
      />
    </div>
  </div>
);
interface FormSelectProps<T extends string> {
  label: string;
  name: string;
  choices: { value: T; label: string }[];
  selected: T;
  className?: string;
  onChange: (value: T) => void;
}

function FormSelect<T extends string>({
  label,
  name,
  choices,
  selected,
  className = "",
  onChange,
}: FormSelectProps<T>) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm/6 font-medium text-gray-900"
      >
        {label}
      </label>
      <div>
        <select
          name={name}
          id={name}
          value={selected}
          onChange={(e) => onChange(e.target.value as T)}
          className="py-1.5 text-gray-900 focus:ring-0 sm:text-sm/6"
        >
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

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
  <div className="grid grid-cols-12 gap-x-6 mb-2 items-end">
    <FormInputText
      label="Name"
      name="ability-name"
      value={ability.name}
      className="col-span-4"
      onChange={(name) => onChange({ ...ability, name })}
    />
    <FormInputText
      label="Description"
      name="ability-description"
      value={ability.description}
      className="col-span-7"
      onChange={(description) => onChange({ ...ability, description })}
    />
    <button type="button" onClick={onRemove} className="col-span-1">
      <TrashIcon className="w-6 h-6 mb-2 text-slate-500" />
    </button>
  </div>
);

interface ActionRowProps {
  action: Action;
  onChange: (action: Action) => void;
  onRemove: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  action,
  onChange,
  onRemove,
}) => (
  <div className="grid grid-cols-12 gap-x-6 mb-2 items-end">
    <FormInputText
      label="Name"
      name="action-name"
      value={action.name}
      className="col-span-4"
      onChange={(name) => onChange({ ...action, name })}
    />
    <FormInputText
      label="Damage"
      name="action-damage"
      value={action.damage || ""}
      className="col-span-2"
      onChange={(damage) => onChange({ ...action, damage })}
    />
    <FormInputText
      label="Description"
      name="action-description"
      value={action.description || ""}
      className="col-span-5"
      onChange={(description) => onChange({ ...action, description })}
    />
    <button type="button" onClick={onRemove} className="col-span-1">
      <TrashIcon className="w-6 h-6 mb-2 text-slate-500" />
    </button>
  </div>
);

interface BuildMonsterProps {
  existingMonster?: Monster;
}

const BuildMonster: React.FC<BuildMonsterProps> = ({ existingMonster }) => {
  const navigate = useNavigate();

  const currentUser = useContext(AuthContext);

  const [monster, setMonster] = useState<Monster>(() => ({
    id: existingMonster?.id || "",
    name: existingMonster?.name || "",
    level: existingMonster?.level || "",
    size: existingMonster?.size || "medium",
    armor: existingMonster?.armor || "none",
    swim: existingMonster?.swim || 0,
    fly: existingMonster?.fly || 0,
    speed: existingMonster?.speed || 6,
    hp: existingMonster?.hp || 0,
    abilities: existingMonster?.abilities || [],
    actions: existingMonster?.actions || [],
  }));

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Monster) => {
      const endpoint = data.id ? `/api/monsters/${data.id}` : "/api/monsters";
      const method = data.id ? "PUT" : "POST";

      return fetchApi<Monster>(endpoint, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monsters"] });
      navigate("/my/monsters");
    },
    onError: (error) => {
      console.error("Failed to save monster:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(monster);
  };

  const loadExample = (type: keyof typeof EXAMPLE_MONSTERS) => {
    setMonster({ ...EXAMPLE_MONSTERS[type], id: "" });
  };

  return (
    <div className="grid grid-cols-6 gap-x-8">
      <div className="col-span-6 mb-6">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-900">
            Load Example:
          </span>
          {Object.keys(EXAMPLE_MONSTERS).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => loadExample(type as keyof typeof EXAMPLE_MONSTERS)}
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-x-6">
              <FormInputText
                label="Name"
                name="name"
                value={monster.name}
                className="col-span-3"
                onChange={(name) => setMonster({ ...monster, name })}
              />
              <FormInputText
                label="Lvl"
                name="level"
                value={monster.level}
                className="col-span-1"
                onChange={(level) => setMonster({ ...monster, level })}
              />
              <FormSelect
                label="Size"
                name="size"
                choices={SIZES}
                selected={monster.size}
                className="col-span-1"
                onChange={(size) => setMonster({ ...monster, size })}
              />
            </div>

            <div className="grid grid-cols-6 gap-2">
              <FormSelect
                label="Armor"
                name="armor"
                choices={ARMORS}
                selected={monster.armor}
                onChange={(armor) => setMonster({ ...monster, armor })}
              />
              <FormInputNumber
                label="Swim"
                name="swim"
                value={monster.swim}
                onChange={(swim) => setMonster({ ...monster, swim })}
              />
              <FormInputNumber
                label="Fly"
                name="fly"
                value={monster.fly}
                onChange={(fly) => setMonster({ ...monster, fly })}
              />
              <FormInputNumber
                label="Speed"
                name="speed"
                value={monster.speed}
                onChange={(speed) => setMonster({ ...monster, speed })}
              />
              <FormInputNumber
                label="HP"
                name="hp"
                value={monster.hp}
                onChange={(hp) => setMonster({ ...monster, hp })}
              />
            </div>

            {/* Abilities Section */}
            <fieldset>
              <div className="header flex">
                <legend>Abilities</legend>
                <button
                  type="button"
                  className="ml-2"
                  onClick={() =>
                    setMonster({
                      ...monster,
                      abilities: [
                        ...monster.abilities,
                        { name: "", description: "" },
                      ],
                    })
                  }
                >
                  <PlusIcon className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              {monster.abilities.map((ability, index) => (
                <AbilityRow
                  key={index}
                  ability={ability}
                  onChange={(newAbility) => {
                    const newAbilities = [...monster.abilities];
                    newAbilities[index] = newAbility;
                    setMonster({ ...monster, abilities: newAbilities });
                  }}
                  onRemove={() => {
                    const newAbilities = monster.abilities.filter(
                      (_, i) => i !== index,
                    );
                    setMonster({ ...monster, abilities: newAbilities });
                  }}
                />
              ))}
            </fieldset>

            {/* Actions Section */}
            <fieldset>
              <div className="header flex">
                <legend>Actions</legend>
                <button
                  type="button"
                  className="ml-2"
                  onClick={() =>
                    setMonster({
                      ...monster,
                      actions: [
                        ...monster.actions,
                        { name: "", damage: "", description: "" },
                      ],
                    })
                  }
                >
                  <PlusIcon className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              {monster.actions.map((action, index) => (
                <ActionRow
                  key={index}
                  action={action}
                  onChange={(newAction) => {
                    const newActions = [...monster.actions];
                    newActions[index] = newAction;
                    setMonster({ ...monster, actions: newActions });
                  }}
                  onRemove={() => {
                    const newActions = monster.actions.filter(
                      (_, i) => i !== index,
                    );
                    setMonster({ ...monster, actions: newActions });
                  }}
                />
              ))}
            </fieldset>
          </div>

          {currentUser.data && (
            <div className="mt-3">
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="col-span-2">
        <MonsterCard monster={monster} />
      </div>
    </div>
  );
};

export default BuildMonster;
