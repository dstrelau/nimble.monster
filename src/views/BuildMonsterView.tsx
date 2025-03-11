import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import MonsterCard from "../components/MonsterCard";
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
    family: {
      id: "",
      name: "Kobolds",
      visibility: "public",
      monsterCount: 0,
      abilities: [
        {
          name: "Nooooo!",
          description:
            "When an ally within 2 spaces dies, attack once for free.",
        },
      ],
    },
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
          className="w-full py-1.5 text-gray-900 focus:ring-0 sm:text-sm/6"
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

  return (
    <fieldset>
      <div className="header flex items-center gap-x-1 mt-5 mb-2">
        <legend className="font-bold inline-block">Family</legend>
      </div>

      <div className="flex">
        <div className="flex-1 pr-4">
          <select
            className="text-sm/6 w-full p-2 border rounded"
            value={monster?.family?.id || ""}
            onChange={(e) => handleSelectFamily(e.target.value)}
          >
            <option value="">None</option>
            {userFamilies.data?.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
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
  <div className="grid grid-cols-12 gap-x-6 mb-2 items-end">
    <FormInputText
      label="Name"
      name="action-name"
      value={action.name}
      className="col-span-4"
      onChange={(name) => onChange({ ...action, name })}
    />
    {legendary || (
      <FormInputText
        label="Damage"
        name="action-damage"
        value={action.damage || ""}
        className="col-span-2"
        onChange={(damage) => onChange({ ...action, damage })}
      />
    )}
    <FormInputText
      label="Description"
      name="action-description"
      value={action.description || ""}
      className={legendary ? "col-span-7" : "col-span-5"}
      onChange={(description) => onChange({ ...action, description })}
    />
    <button type="button" onClick={onRemove} className="col-span-1">
      <TrashIcon className="w-6 h-6 mb-2 text-slate-500" />
    </button>
  </div>
);

const LegendaryForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-7 gap-x-6">
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
        className="col-span-2"
        onChange={(size) => setMonster({ ...monster, size })}
      />
      <FormInputText
        label="Kind"
        name="kind"
        value={monster.kind || ""}
        className="col-span-4"
        onChange={(kind) => setMonster({ ...monster, kind })}
      />
    </div>
    <div>
      <FormInputText
        label="Name"
        name="name"
        value={monster.name}
        className="col-span-7"
        onChange={(name) => setMonster({ ...monster, name })}
      />
    </div>
    <div>
      <div className="grid grid-cols-12 gap-x-6">
        <FormInputNumber
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
          <label className="block text-sm/6 font-medium text-gray-900">
            Saves
          </label>
          <div className="flex gap-2">
            <FormInputText
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
      <FormInputText
        label="Bloodied"
        name="bloodied"
        value={monster.bloodied || ""}
        onChange={(bloodied) => setMonster({ ...monster, bloodied })}
      />
      <FormInputText
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
    <FamilySection monster={monster} setMonster={setMonster} />
    <AbilitiesSection monster={monster} setMonster={setMonster} />
    <ActionsSection monster={monster} setMonster={setMonster} />
  </div>
);

const AbilitiesSection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <fieldset>
    <div className="header grid grid-cols-12 gap-x-6 mt-5 mb-2 items-end">
      <legend className="col-span-11 font-bold">Abilities</legend>
      <button
        type="button"
        className="w-6 h-6"
        onClick={() =>
          setMonster({
            ...monster,
            abilities: [...monster.abilities, { name: "", description: "" }],
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
          const newAbilities = monster.abilities.filter((_, i) => i !== index);
          setMonster({ ...monster, abilities: newAbilities });
        }}
      />
    ))}
  </fieldset>
);

const ActionsSection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <fieldset>
    <div className="header grid grid-cols-12 gap-x-6 mt-5 mb-2 items-end">
      <legend className="col-span-11 font-bold">Actions</legend>
      <button
        type="button"
        className="w-6 h-6"
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
        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex justify-between items-start">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              {typeOptions.map((option, idx) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() =>
                    setMonster({
                      ...monster,
                      legendary: option.value,
                    })
                  }
                  className={`
                            ${idx === 0 ? "rounded-l-lg" : ""}
                            ${idx === 1 ? "rounded-r-lg" : ""}
                            px-4 py-2 text-sm font-medium
                            ${
                              monster.legendary === option.value
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-white text-gray-900 hover:bg-gray-50"
                            }
                            border border-gray-200
                            ${idx > 0 ? "border-l-0" : ""}
                          `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {currentUser.data && (
              <div className="flex flex-col items-end">
                <div className="inline-flex rounded-lg p-1 bg-gray-100">
                  <label
                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer w-[80px] text-center justify-center ${
                      (monster.visibility || "private") === "private"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={(monster.visibility || "private") === "private"}
                      onChange={() =>
                        setMonster({ ...monster, visibility: "private" })
                      }
                      className="hidden"
                    />
                    <span
                      className={`text-sm font-medium ${
                        (monster.visibility || "private") === "private"
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      Private
                    </span>
                  </label>
                  <label
                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer w-[80px] text-center justify-center ${
                      (monster.visibility || "private") === "public"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={(monster.visibility || "private") === "public"}
                      onChange={() =>
                        setMonster({ ...monster, visibility: "public" })
                      }
                      className="hidden"
                    />
                    <span
                      className={`text-sm font-medium ${
                        (monster.visibility || "private") === "public"
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      Public
                    </span>
                  </label>
                </div>
                <div className="h-5 text-xs text-gray-600 text-center w-[170px]">
                  {(monster.visibility || "private") === "private"
                    ? "Only you can see this monster."
                    : "This monster is visible in the public Monsters list."}
                </div>
              </div>
            )}
          </div>

          {monster.legendary ? (
            <LegendaryForm monster={monster} setMonster={setMonster} />
          ) : (
            <StandardForm monster={monster} setMonster={setMonster} />
          )}

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

      <div className={monster.legendary ? "col-span-3" : "col-span-2"}>
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
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <MonsterCard monster={monster} />
      </div>
    </div>
  );
};

export default BuildMonster;
