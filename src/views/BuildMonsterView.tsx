import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MonsterCard } from "../components/MonsterCard";
import { fetchApi } from "../lib/api";
import { AuthContext } from "../lib/auth";
import type {
  Ability,
  Action,
  Family,
  Monster,
  MonsterArmor,
  MonsterSize,
} from "../lib/types";
import { ARMORS, SIZES } from "../lib/types";

const EXAMPLE_MONSTERS: Record<string, Monster> = {
  kobold: {
    visibility: "public",
    id: "",
    legendary: false,
    name: "Kobold",
    level: "1/3",
    size: "small" as MonsterSize,
    armor: "" as MonsterArmor,
    swim: 0,
    fly: 0,
    speed: 6,
    hp: 12,
    abilities: [],
    actions: [
      { name: "Stab", damage: "1d4+2", description: "(or Sling, Range 8)" },
    ],
  },
  manticore: {
    visibility: "public",
    id: "",
    legendary: true,
    name: "Ravager of the Lowlands",
    kind: "Manticore",
    size: "large" as MonsterSize,
    armor: "medium" as MonsterArmor,
    level: "5",
    hp: 130,
    speed: 0,
    swim: 0,
    fly: 0,
    saves: "STR+, DEX+",
    abilities: [
      {
        name: "Feral Instinct",
        description: "Whenever Ravager is crit, he can fly 10.",
      },
    ],
    actions: [
      {
        name: "Venomous Stinger",
        description: "(1 use) Reach:3, 5d12 damage.",
      },
      { name: "Ravage", description: "Attack for 1d12+20 damage." },
      { name: "Move & Claw", description: "Fly 10, attack for 1d12+6 damage." },
    ],
    bloodied: "At 65 HP, his Venomous Stinger recharges.",
    lastStand:
      "The Ravager is dying! 40 more damage and he dies. Until then, the first time each turn he takes damage, he uses Move & Claw.",
  },
  empty: {
    visibility: "private",
    id: "",
    legendary: false,
    name: "",
    level: "",
    size: "medium",
    armor: "",
    swim: 0,
    fly: 0,
    speed: 6,
    hp: 0,
    abilities: [],
    actions: [],
  },
};

interface FormInputProps<T extends string | number> {
  label: string;
  name: string;
  value: T;
  className?: string;
  onChange: (value: T) => void;
}

const FormInput = <T extends string | number>({
  label,
  name,
  value,
  className = "",
  onChange,
}: FormInputProps<T>) => {
  const inputType = typeof value === "number" ? "number" : "text";
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      inputType === "number"
        ? (Number(e.target.value) as T)
        : (e.target.value as T);
    onChange(newValue);
  };
  return (
    <div className={className}>
      <label htmlFor={name} className="d-fieldset-label">
        {label}
      </label>
      <div>
        <input
          type={inputType}
          name={name}
          id={name}
          value={value}
          onChange={handleChange}
          className="d-input w-full"
        />
      </div>
    </div>
  );
};

interface FormSelectProps<T extends string> {
  label: string;
  name: string;
  choices: ReadonlyArray<{ readonly value: T; readonly label: string }>;
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
      <label htmlFor={name} className="d-fieldset-label">
        {label}
      </label>
      <select
        name={name}
        id={name}
        value={selected}
        onChange={(e) => onChange(e.target.value as T)}
        className="d-select w-full"
      >
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const FamilySection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => {
  const userFamilies = useQuery({
    queryKey: ["userFamilies"],
    queryFn: () => fetchApi<{ families: Family[] }>("/api/users/me/families"),
    select: (data) => data.families,
  });

  const handleSelectFamily = (familyId: string) => {
    const family = userFamilies.data?.find((f) => f.id === familyId);
    setMonster({ ...monster, family: family });
  };

  const familyChoices = [
    { value: "", label: "None" },
    ...(userFamilies.data?.map((f) => ({ value: f.id, label: f.name })) || []),
  ];

  return (
    <FormSelect
      label="Family"
      name="family"
      choices={familyChoices}
      selected={monster?.family?.id || ""}
      onChange={handleSelectFamily}
    />
  );
};

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
  <div className="flex flex-row items-center">
    <div className="flex flex-wrap gap-x-4 mb-2 items-end flex-grow">
      <FormInput
        label="Name"
        name="ability-name"
        value={ability.name}
        className="grow-1 min-w-32"
        onChange={(name) => onChange({ ...ability, name })}
      />
      <FormInput
        label="Description"
        name="ability-description"
        value={ability.description}
        className="grow-4 min-w-96"
        onChange={(description) => onChange({ ...ability, description })}
      />
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="d-btn d-btn-ghost d-btn-square m-2"
    >
      <TrashIcon className="h-6 text-base-content/50" />
    </button>
  </div>
);

interface ActionRowProps {
  action: Action;
  legendary: boolean;
  onChange: (action: Action) => void;
  onRemove: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  action,
  legendary,
  onChange,
  onRemove,
}) => (
  <div className="flex flex-row items-center">
    <div className="flex flex-wrap gap-x-4 mb-2 items-end flex-grow">
      <FormInput
        label="Name"
        name="action-name"
        value={action.name}
        className="grow-1 min-w-32"
        onChange={(name) => onChange({ ...action, name })}
      />
      {legendary || (
        <FormInput
          label="Damage"
          name="action-damage"
          value={action.damage || ""}
          className="w-24"
          onChange={(damage) => onChange({ ...action, damage })}
        />
      )}
      <FormInput
        label="Description"
        name="action-description"
        value={action.description || ""}
        className="grow-4 min-w-96"
        onChange={(description) => onChange({ ...action, description })}
      />
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="d-btn d-btn-ghost d-btn-square m-2"
    >
      <TrashIcon className="h-6 text-base-content/50" />
    </button>
  </div>
);

const LegendaryForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-7 gap-x-6">
      <FormInput
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
        className="col-span-2"
        onChange={(size) => setMonster({ ...monster, size })}
      />
      <FormInput
        label="Kind"
        name="kind"
        value={monster.kind || ""}
        className="col-span-4"
        onChange={(kind) => setMonster({ ...monster, kind })}
      />
    </div>
    <div>
      <FormInput
        label="Name"
        name="name"
        value={monster.name}
        className="col-span-7"
        onChange={(name) => setMonster({ ...monster, name })}
      />
    </div>
    <div>
      <div className="grid grid-cols-12 gap-x-6">
        <FormInput
          label="HP"
          name="hp"
          value={monster.hp}
          className="col-span-2"
          onChange={(hp) => setMonster({ ...monster, hp })}
        />
        <FormSelect
          label="Armor"
          name="armor"
          choices={ARMORS}
          selected={monster.armor}
          className="col-span-3"
          onChange={(armor) => setMonster({ ...monster, armor })}
        />
        <div className="col-span-7">
          <label className="d-fieldset-label">Saves</label>
          <div className="flex gap-2">
            <FormInput
              label=""
              name="saves"
              value={monster.saves || ""}
              onChange={(saves) => setMonster({ ...monster, saves: saves })}
            />
          </div>
        </div>
      </div>
    </div>
    <FamilySection monster={monster} setMonster={setMonster} />
    <AbilitiesSection monster={monster} setMonster={setMonster} />
    <ActionsSection monster={monster} setMonster={setMonster} />
    <div className="space-y-6">
      <FormInput
        label="Bloodied"
        name="bloodied"
        value={monster.bloodied || ""}
        onChange={(bloodied) => setMonster({ ...monster, bloodied })}
      />
      <FormInput
        label="Last Stand"
        name="lastStand"
        value={monster.lastStand || ""}
        onChange={(lastStand) => setMonster({ ...monster, lastStand })}
      />
    </div>
  </div>
);

const StandardForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-5 gap-x-6">
      <FormInput
        label="Name"
        name="name"
        value={monster.name}
        className="col-span-3"
        onChange={(name) => setMonster({ ...monster, name })}
      />
      <FormInput
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
      <FormInput
        label="Swim"
        name="swim"
        value={monster.swim}
        onChange={(swim) => setMonster({ ...monster, swim })}
      />
      <FormInput
        label="Fly"
        name="fly"
        value={monster.fly}
        onChange={(fly) => setMonster({ ...monster, fly })}
      />
      <FormInput
        label="Speed"
        name="speed"
        value={monster.speed}
        onChange={(speed) => setMonster({ ...monster, speed })}
      />
      <FormInput
        label="HP"
        name="hp"
        value={monster.hp}
        onChange={(hp) => setMonster({ ...monster, hp })}
      />
    </div>
    <FamilySection monster={monster} setMonster={setMonster} />
    <AbilitiesSection monster={monster} setMonster={setMonster} />
    <ActionsSection monster={monster} setMonster={setMonster} />
  </div>
);

const AbilitiesSection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <fieldset className="d-fieldset">
    <legend className="d-fieldset-legend text-base">Abilities</legend>
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
          const newAbilities = monster.abilities.filter((_, i) => i !== index);
          setMonster({ ...monster, abilities: newAbilities });
        }}
      />
    ))}
    <button
      type="button"
      className="d-btn d-btn-ghost text-base-content/50"
      onClick={() =>
        setMonster({
          ...monster,
          abilities: [...monster.abilities, { name: "", description: "" }],
        })
      }
    >
      <PlusIcon className="w-6 h-6" />
      Add
    </button>
  </fieldset>
);

const ActionsSection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <fieldset className="d-fieldset">
    <legend className="d-fieldset-legend text-base">Actions</legend>
    {monster.actions.map((action, index) => (
      <ActionRow
        key={index}
        action={action}
        legendary={monster.legendary}
        onChange={(newAction) => {
          const newActions = [...monster.actions];
          newActions[index] = newAction;
          setMonster({ ...monster, actions: newActions });
        }}
        onRemove={() => {
          const newActions = monster.actions.filter((_, i) => i !== index);
          setMonster({ ...monster, actions: newActions });
        }}
      />
    ))}
    <button
      type="button"
      className="d-btn d-btn-ghost text-base-content/50"
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
      <PlusIcon className="w-6 h-6" />
      Add
    </button>
  </fieldset>
);

export const MonsterVisibilityEnum = ["private", "public"] as const;

interface BuildMonsterProps {
  existingMonster?: Monster;
}

const BuildMonster: React.FC<BuildMonsterProps> = ({ existingMonster }) => {
  const typeOptions = [
    { value: false, label: "Standard" },
    { value: true, label: "Legendary" },
  ];
  const navigate = useNavigate();

  const currentUser = useContext(AuthContext);

  const [monster, setMonster] = useState<Monster>(
    () => existingMonster ?? EXAMPLE_MONSTERS.empty,
  );

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
      queryClient.invalidateQueries({ queryKey: ["monster", monster.id] });
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
    setMonster({
      ...EXAMPLE_MONSTERS[type],
      kind: EXAMPLE_MONSTERS[type].kind || undefined,
      saves: EXAMPLE_MONSTERS[type].saves || undefined,
      bloodied: EXAMPLE_MONSTERS[type].bloodied || undefined,
      lastStand: EXAMPLE_MONSTERS[type].lastStand || undefined,
    });
  };

  return (
    <div className="grid grid-cols-6 gap-x-8">
      <div className={monster.legendary ? "col-span-3" : "col-span-4"}>
        <form className="d-fieldset" onSubmit={handleSubmit}>
          <div className="mb-6 flex justify-between items-start">
            <div className="d-tabs d-tabs-box" role="group">
              {typeOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() =>
                    setMonster({
                      ...monster,
                      legendary: option.value,
                    })
                  }
                  className={`d-tab  ${monster.legendary === option.value && "d-tab-active"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {monster.legendary ? (
            <LegendaryForm monster={monster} setMonster={setMonster} />
          ) : (
            <StandardForm monster={monster} setMonster={setMonster} />
          )}

          {currentUser.data && (
            <>
              <div className="d-divider"></div>
              <div className="flex flex-row justify-between items-center">
                <button type="submit" className="d-btn d-btn-primary">
                  Save
                </button>
                <fieldset className="fieldset">
                  <div>
                    <label className="d-fieldset-label text-sm">
                      Publish to Public Monsters
                      <input
                        name="public"
                        type="checkbox"
                        className="d-toggle d-toggle-lg mr-2 d-toggle-primary"
                        onChange={(e) => {
                          setMonster({
                            ...monster,
                            visibility: e.target.checked ? "public" : "private",
                          });
                        }}
                      />
                    </label>
                  </div>
                </fieldset>
              </div>
            </>
          )}
        </form>
      </div>

      <div className={monster.legendary ? "col-span-3" : "col-span-2"}>
        <div className="sticky top-4">
          <div className="flex mb-6 mr-5 justify-end">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-gray-900">
                Load Example:
              </span>
              {Object.keys(EXAMPLE_MONSTERS).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    loadExample(type as keyof typeof EXAMPLE_MONSTERS)
                  }
                  className="d-btn"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-auto max-h-[calc(100vh-120px)] px-4">
            <MonsterCard monster={monster} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildMonster;
