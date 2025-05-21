"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleSlash2,
  Eye,
  Plus,
  Sword,
  Target,
  Trash,
  TriangleAlert,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import clsx from "clsx";
import { Card } from "@/ui/monster/Card";
import { fetchApi } from "@/lib/api";
import type {
  Ability,
  Action,
  Monster,
  MonsterArmor,
  MonsterSize,
} from "@/lib/types";
import { ARMORS, SIZES } from "@/lib/types";
import { Textarea } from "@/ui/Form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  parseDiceNotation,
  calculateProbabilityDistribution,
  calculateAverageDamageOnHit,
} from "@/lib/dice";

const EXAMPLE_MONSTERS: Record<string, Monster> = {
  goblin: {
    visibility: "public",
    id: "",
    legendary: false,
    name: "Goblin Taskmaster",
    level: "2",
    size: "small" as MonsterSize,
    armor: "medium" as MonsterArmor,
    swim: 0,
    fly: 0,
    speed: 6,
    hp: 30,
    abilities: [
      {
        name: "Meat Shield",
        description: "Can force other goblins to Interpose for him.",
      },
    ],
    actions: [
      {
        name: "Stab",
        damage: "1d6+2",
        description: "(or Shoot, Range 8).",
      },
      {
        name: "Get in here!",
        damage: "",
        description: "Call a goblin minion to the fight.",
      },
    ],
    actionPreface: "Do both.",
    moreInfo: "It's called meat shield for a reason. Use those minions!",
    updatedAt: new Date(),
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
    actionPreface: "After each hero's turn, choose one.",
    moreInfo:
      "A mythical beast with the body of a lion, the wings of a dragon, and the face of a human. Known for their deadly tail spikes.",
    updatedAt: new Date(),
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
    actionPreface: "Choose one.",
    moreInfo: "",
    updatedAt: new Date(),
  },
};

interface FormInputProps<T extends string | number> {
  label: React.ReactNode;
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
      <label htmlFor={name} className="d-fieldset-label flex flex-row">
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
    queryFn: async () => {
      const { getUserFamilies } = await import("@/actions/family");
      const result = await getUserFamilies();
      return result.success ? result.families : [];
    },
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
    <div className="flex flex-col w-full gap-2 mb-2 border-l pl-4">
      <FormInput
        label="Name"
        name="ability-name"
        value={ability.name}
        onChange={(name) => onChange({ ...ability, name })}
      />
      <Textarea
        label="Description"
        name="ability-description"
        value={ability.description}
        rows={1}
        onChange={(description) => onChange({ ...ability, description })}
      />
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="d-btn d-btn-ghost d-btn-square m-2"
    >
      <Trash className="h-6 w-6 text-base-content/50" />
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
}) => {
  const distribution = useMemo(() => {
    if (!action.damage) return null;
    const diceRoll = parseDiceNotation(action.damage);
    if (!diceRoll) return null;
    const distribution = calculateProbabilityDistribution(diceRoll);
    return distribution;
  }, [action.damage]);

  let avgDamage;
  let missPercent;
  if (distribution) {
    avgDamage = calculateAverageDamageOnHit(distribution);
    missPercent = 100 * (distribution.get(0) || 0);
  }
  return (
    <div className="flex flex-row items-center">
      <div className="flex flex-col w-full gap-2 mb-2 border-l pl-4">
        <div className="flex flex-col md:flex-row mb-2 gap-x-4">
          <FormInput
            label="Name"
            name="action-name"
            className="grow-3"
            value={action.name}
            onChange={(name) => onChange({ ...action, name })}
          />
          {legendary || (
            <FormInput
              name="action-damage"
              value={action.damage || ""}
              onChange={(damage) => onChange({ ...action, damage })}
              label={
                <>
                  <span className="flex-1">Damage</span>{" "}
                  {missPercent && (
                    <span
                      className="d-tooltip flex items-center leading-4"
                      data-tip={`Miss Chance: ${missPercent.toFixed(0)}%`}
                    >
                      <CircleSlash2 className="h-4" />
                      {missPercent.toFixed(0)}%
                    </span>
                  )}
                  {avgDamage && (
                    <span
                      className="d-tooltip flex items-center leading-4"
                      data-tip={`Avg. Damage on Hit: ${avgDamage.toFixed(1)}`}
                    >
                      <Sword className="h-4" />
                      {avgDamage.toFixed(1)}
                    </span>
                  )}
                </>
              }
            />
          )}
        </div>
        <Textarea
          label="Description"
          name="action-description"
          value={action.description || ""}
          rows={2}
          onChange={(description) => onChange({ ...action, description })}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="d-btn d-btn-ghost d-btn-square m-2"
      >
        <Trash className="h-6 w-6 text-base-content/50" />
      </button>
    </div>
  );
};

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
        <HPInput
          monster={monster}
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
      <Textarea
        label="Bloodied"
        name="bloodied"
        value={monster.bloodied || ""}
        rows={2}
        onChange={(bloodied) => setMonster({ ...monster, bloodied })}
      />
      <Textarea
        label="Last Stand"
        name="lastStand"
        value={monster.lastStand || ""}
        rows={2}
        onChange={(lastStand) => setMonster({ ...monster, lastStand })}
      />
      <Textarea
        label="More Information"
        name="moreInfo"
        value={monster.moreInfo || ""}
        rows={4}
        onChange={(moreInfo) => setMonster({ ...monster, moreInfo })}
      />
    </div>
  </div>
);

const StandardForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-x-6">
      <FormInput
        label="Name"
        name="name"
        value={monster.name}
        className="col-span-2"
        onChange={(name) => setMonster({ ...monster, name })}
      />
    </div>
    <div className="grid grid-cols-5 gap-x-6">
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
      <FormInput
        label="Kind"
        name="kind"
        value={monster.kind || ""}
        className="col-span-3"
        onChange={(kind) => setMonster({ ...monster, kind })}
      />
    </div>
    <div className="grid grid-cols-5 gap-2">
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
      <HPInput
        monster={monster}
        onChange={(hp) => setMonster({ ...monster, hp })}
      />
    </div>
    <FamilySection monster={monster} setMonster={setMonster} />
    <AbilitiesSection monster={monster} setMonster={setMonster} />
    <ActionsSection monster={monster} setMonster={setMonster} />
    <Textarea
      label="More Information"
      name="moreInfo"
      value={monster.moreInfo || ""}
      rows={4}
      onChange={(moreInfo) => setMonster({ ...monster, moreInfo })}
    />
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
      <Plus className="w-6 h-6" />
      Add
    </button>
  </fieldset>
);

const ActionsSection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <fieldset className="d-fieldset gap-y-4">
    <legend className="d-fieldset-legend text-base">Actions</legend>
    <FormInput
      label="Preface"
      name="actionPreface"
      value={monster.actionPreface}
      onChange={(actionPreface) => setMonster({ ...monster, actionPreface })}
    />
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
      <Plus className="w-6 h-6" />
      Add
    </button>
  </fieldset>
);

export const MonsterVisibilityEnum = ["private", "public"] as const;

const HP_RECOMMENDATION_STANDARD: Record<
  string,
  Record<MonsterArmor, number>
> = {
  "1/4": { "": 12, medium: 9, heavy: 7 },
  "1/3": { "": 15, medium: 11, heavy: 8 },
  "1/2": { "": 18, medium: 15, heavy: 11 },
  "1": { "": 26, medium: 20, heavy: 16 },
  "2": { "": 34, medium: 27, heavy: 20 },
  "3": { "": 41, medium: 33, heavy: 25 },
  "4": { "": 49, medium: 39, heavy: 29 },
  "5": { "": 58, medium: 46, heavy: 35 },
  "6": { "": 68, medium: 54, heavy: 41 },
  "7": { "": 79, medium: 63, heavy: 47 },
  "8": { "": 91, medium: 73, heavy: 55 },
  "9": { "": 104, medium: 83, heavy: 62 },
  "10": { "": 118, medium: 94, heavy: 71 },
  "11": { "": 133, medium: 106, heavy: 80 },
  "12": { "": 149, medium: 119, heavy: 89 },
  "13": { "": 166, medium: 132, heavy: 100 },
  "14": { "": 184, medium: 147, heavy: 110 },
  "15": { "": 203, medium: 162, heavy: 122 },
  "16": { "": 223, medium: 178, heavy: 134 },
  "17": { "": 244, medium: 195, heavy: 146 },
  "18": { "": 266, medium: 213, heavy: 160 },
  "19": { "": 289, medium: 231, heavy: 173 },
  "20": { "": 313, medium: 250, heavy: 189 },
};

const HP_RECOMMENDATION_LEGENDARY: Record<string, Record<string, number>> = {
  "1": { "": 50, medium: 50, heavy: 35, lastStand: 10 },
  "2": { "": 75, medium: 75, heavy: 55, lastStand: 20 },
  "3": { "": 100, medium: 100, heavy: 75, lastStand: 30 },
  "4": { "": 125, medium: 125, heavy: 95, lastStand: 40 },
  "5": { "": 150, medium: 150, heavy: 115, lastStand: 50 },
  "6": { "": 175, medium: 175, heavy: 135, lastStand: 60 },
  "7": { "": 200, medium: 200, heavy: 155, lastStand: 70 },
  "8": { "": 225, medium: 225, heavy: 175, lastStand: 80 },
  "9": { "": 250, medium: 250, heavy: 195, lastStand: 90 },
  "10": { "": 275, medium: 275, heavy: 215, lastStand: 100 },
  "11": { "": 300, medium: 300, heavy: 235, lastStand: 110 },
  "12": { "": 325, medium: 325, heavy: 255, lastStand: 120 },
  "13": { "": 350, medium: 350, heavy: 275, lastStand: 130 },
  "14": { "": 375, medium: 375, heavy: 295, lastStand: 140 },
  "15": { "": 400, medium: 400, heavy: 315, lastStand: 150 },
  "16": { "": 425, medium: 425, heavy: 335, lastStand: 160 },
  "17": { "": 450, medium: 450, heavy: 355, lastStand: 170 },
  "18": { "": 475, medium: 475, heavy: 375, lastStand: 180 },
  "19": { "": 500, medium: 500, heavy: 395, lastStand: 190 },
  "20": { "": 525, medium: 525, heavy: 415, lastStand: 200 },
};

const getRecommendedHPStandard = (
  level: string,
  armor: MonsterArmor,
): number | null => {
  if (!level || !HP_RECOMMENDATION_STANDARD[level]) return null;
  return HP_RECOMMENDATION_STANDARD[level][armor] || null;
};

const getRecommendedHPLegendary = (
  level: string,
  armor: MonsterArmor,
): number | null => {
  if (!level || !HP_RECOMMENDATION_LEGENDARY[level]) return null;
  return HP_RECOMMENDATION_LEGENDARY[level][armor] || null;
};

const HPInput: React.FC<{
  monster: Monster;
  onChange: (hp: number) => void;
  className?: string;
}> = ({ monster, onChange, className }) => {
  const recommendedHP = useMemo(() => {
    return monster.legendary
      ? getRecommendedHPLegendary(monster.level, monster.armor)
      : getRecommendedHPStandard(monster.level, monster.armor);
  }, [monster.legendary, monster.level, monster.armor]);

  const percentDiff = useMemo(() => {
    if (!recommendedHP || monster.hp === 0) return 0;
    const diff = monster.hp - recommendedHP;
    return Math.abs(diff) / recommendedHP;
  }, [recommendedHP, monster.hp]);

  const warning = percentDiff > 0.2 && percentDiff < 0.4;
  const critical = percentDiff > 0.4;

  return (
    <FormInput
      name="hp"
      className={className}
      value={monster.hp}
      onChange={onChange}
      label={
        <>
          <span className="flex-1">HP</span>{" "}
          {recommendedHP && (
            <span
              className="d-tooltip flex items-center leading-4"
              data-tip={
                monster.hp === 0
                  ? "GM Guide Recommended HP"
                  : warning
                    ? ">20% from recommended"
                    : critical
                      ? ">40% from recommended"
                      : "Within 20% of recommended"
              }
            >
              {monster.hp === 0 ? (
                <Target className="h-4" />
              ) : warning ? (
                <TriangleAlert className="h-4 text-warning" />
              ) : critical ? (
                <CircleAlert className="h-4 text-error" />
              ) : (
                <CircleCheck className="h-4 text-success" />
              )}
              {recommendedHP}
            </span>
          )}
        </>
      }
    />
  );
};

interface BuildMonsterProps {
  existingMonster?: Monster;
}

const BuildMonster: React.FC<BuildMonsterProps> = ({ existingMonster }) => {
  const typeOptions = [
    { value: false, label: "Standard" },
    { value: true, label: "Legendary" },
  ];
  const router = useRouter();

  const { data: session } = useSession();

  const [showMobilePreview, setShowMobilePreview] = useState(false);
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
      router.push("/my/monsters");
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
    <>
      <div
        className={clsx(
          showMobilePreview || "hidden",
          "md:hidden fixed h-full left-0 top-0 inset-0 z-1 bg-base-200",
        )}
      >
        <div className="d-navbar w-full justify-center sticky bg-neutral text-neutral-content">
          <h3 className="font-bold">Monster Preview</h3>
          <button
            type="button"
            className="d-btn d-btn-ghost d-btn-circle"
            onClick={() => setShowMobilePreview(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          <Card monster={monster} />
        </div>
      </div>

      <div
        className={clsx(
          "md:hidden fixed bottom-0 left-0 right-0 z-1 w-full bg-base-100 flex p-2 justify-between",
          showMobilePreview && "hidden",
        )}
        onClick={() => setShowMobilePreview(true)}
      >
        <span className="font-slab font-black font-small-caps italic text-2xl">
          {monster.name}
        </span>
        <div className="flex gap-2 items-center text-sm text-base-content/70">
          <Eye className="h-6 w-6" /> Preview
        </div>
      </div>

      <div
        className={clsx(
          "grid grid-cols-6 gap-x-8 mb-10 md:mb-0",
          showMobilePreview && "hidden",
        )}
      >
        <div
          className={clsx(
            "col-span-6",
            monster.legendary ? "md:col-span-3" : "md:col-span-4",
          )}
        >
          <form className="d-fieldset" onSubmit={handleSubmit}>
            <div className="mb-6 flex justify-between items-start">
              <div className="d-join" role="group">
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
                    className={clsx(
                      "d-btn d-join-item",
                      monster.legendary === option.value && "d-btn-primary",
                    )}
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

            {session?.user && (
              <div className="flex flex-row justify-between items-center my-4">
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
                        checked={monster.visibility === "public"}
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
            )}
          </form>
        </div>

        <div
          className={clsx(
            "hidden md:block",
            monster.legendary ? "md:col-span-3" : "md:col-span-2",
          )}
        >
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
              <Card monster={monster} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuildMonster;
