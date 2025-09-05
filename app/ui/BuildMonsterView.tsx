"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import {
  CircleAlert,
  CircleCheck,
  Crown,
  PersonStanding,
  Target,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useId, useMemo, useState } from "react";
import { Card } from "@/app/ui/monster/Card";
import {
  ArmorIcon,
  BurrowIcon,
  ClimbIcon,
  FlyIcon,
  HPIcon,
  SavesIcon,
  SpeedIcon,
  SwimIcon,
  TeleportIcon,
} from "@/app/ui/monster/Stat";
import { BuildView } from "@/components/app/BuildView";
import { ExampleLoader } from "@/components/app/ExampleLoader";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  IconFormInput,
  IconFormSelect,
} from "@/components/app/Form";
import { VisibilityToggle } from "@/components/app/VisibilityToggle";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchApi } from "@/lib/api";
import type { Monster, MonsterArmor, MonsterSize } from "@/lib/types";
import { ARMORS, SIZES } from "@/lib/types";
import { getUserFamilies } from "../families/actions";
import { AbilitiesSection } from "./shared/AbilitiesSection";
import { ActionsSection } from "./shared/ActionsSection";

const EXAMPLE_MONSTERS: Record<string, Omit<Monster, "creator">> = {
  goblin: {
    visibility: "public",
    id: "",
    legendary: false,
    minion: false,
    name: "Goblin Taskmaster",
    level: "2",
    size: "small" as MonsterSize,
    armor: "medium" as MonsterArmor,
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
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
        id: crypto.randomUUID(),
        name: "Stab",
        damage: "1d6+2",
        description: "(or Shoot, Range 8).",
      },
      {
        id: crypto.randomUUID(),
        name: "Get in here!",
        damage: "",
        description: "Call a goblin minion to the fight.",
      },
    ],
    actionPreface: "Do both.",
    moreInfo: "It's called meat shield for a reason. Use those minions!",
    updatedAt: new Date().toISOString(),
  },
  manticore: {
    visibility: "public",
    id: "",
    legendary: true,
    minion: false,
    name: "Ravager of the Lowlands",
    kind: "Manticore",
    size: "large" as MonsterSize,
    armor: "medium" as MonsterArmor,
    level: "5",
    hp: 130,
    speed: 0,
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    saves: "STR+, DEX+",
    abilities: [
      {
        name: "Feral Instinct",
        description: "Whenever Ravager is crit, he can fly 10.",
      },
    ],
    actions: [
      {
        id: crypto.randomUUID(),
        name: "Venomous Stinger",
        description: "(1 use) Reach:3, 5d12 damage.",
      },
      {
        id: crypto.randomUUID(),
        name: "Ravage",
        description: "Attack for 1d12+20 damage.",
      },
      {
        id: crypto.randomUUID(),
        name: "Move & Claw",
        description: "Fly 10, attack for 1d12+6 damage.",
      },
    ],
    bloodied: "At 65 HP, his Venomous Stinger recharges.",
    lastStand:
      "The Ravager is dying! 40 more damage and he dies. Until then, the first time each turn he takes damage, he uses Move & Claw.",
    actionPreface: "After each hero's turn, choose one.",
    moreInfo:
      "A mythical beast with the body of a lion, the wings of a dragon, and the face of a human. Known for their deadly tail spikes.",
    updatedAt: new Date().toISOString(),
  },
  kobold: {
    visibility: "public",
    id: "",
    legendary: false,
    minion: true,
    name: "Kobold Minion",
    level: "1/4",
    size: "small" as MonsterSize,
    armor: "none" as MonsterArmor,
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    speed: 6,
    hp: 0,
    abilities: [],
    actions: [
      {
        id: crypto.randomUUID(),
        name: "Slash",
        description: "1d6 (follows minion rules)",
      },
    ],
    actionPreface: "",
    moreInfo: "",
    updatedAt: new Date().toISOString(),
  },
  empty: {
    visibility: "private",
    id: "",
    legendary: false,
    minion: false,
    name: "",
    level: "",
    size: "medium",
    armor: "none",
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    speed: 6,
    hp: 0,
    abilities: [],
    actions: [],
    actionPreface: "Choose one.",
    moreInfo: "",
    updatedAt: new Date().toISOString(),
  },
};

const FamilySection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => {
  const { data: session } = useSession();
  const userFamilies = useQuery({
    queryKey: ["userFamilies"],
    queryFn: async () => {
      const result = await getUserFamilies();
      return result.success ? result.families : [];
    },
    enabled: !!session?.user,
  });

  const handleSelectFamily = (familyId: string) => {
    if (familyId === "none") {
      setMonster({ ...monster, family: undefined });
    } else {
      const family = userFamilies.data?.find((f) => f.id === familyId);
      setMonster({ ...monster, family: family });
    }
  };

  const familyChoices = [
    { value: "none", label: "None" },
    ...(userFamilies.data?.map((f) => ({ value: f.id, label: f.name })) || []),
  ];

  return (
    <FormSelect
      label="Family"
      name="family"
      choices={familyChoices}
      selected={monster?.family?.id || "none"}
      onChange={handleSelectFamily}
    />
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
      <div className="grid grid-cols-14 gap-x-6">
        <HPInput
          monster={monster}
          className="col-span-3"
          onChange={(hp) => setMonster({ ...monster, hp: Math.max(0, hp) })}
        />
        <IconFormSelect
          icon={ArmorIcon}
          text="Armor"
          name="armor"
          choices={ARMORS}
          selected={monster.armor}
          className="col-span-4"
          onChange={(armor) => setMonster({ ...monster, armor })}
        />
        <div className="col-span-7">
          <IconFormInput
            name="saves"
            text="Saves"
            icon={SavesIcon}
            value={monster.saves || ""}
            onChange={(e) => setMonster({ ...monster, saves: e })}
          />
        </div>
      </div>
    </div>
    <FamilySection monster={monster} setMonster={setMonster} />
    <AbilitiesSection
      abilities={monster.abilities}
      onChange={(abilities) => setMonster({ ...monster, abilities })}
    />
    <ActionsSection
      actions={monster.actions}
      actionPreface={monster.actionPreface}
      showDamage={!monster.legendary}
      onChange={(actions) => setMonster({ ...monster, actions })}
      onPrefaceChange={(actionPreface) =>
        setMonster({ ...monster, actionPreface })
      }
    />
    <div className="space-y-6">
      <FormTextarea
        label={
          <div className="flex items-center gap-2">
            Bloodied
            <ConditionValidationIcon text={monster.bloodied || ""} />
          </div>
        }
        name="bloodied"
        value={monster.bloodied || ""}
        rows={2}
        onChange={(bloodied: string) => setMonster({ ...monster, bloodied })}
      />
      <FormTextarea
        label={
          <div className="flex items-center gap-2">
            Last Stand
            <ConditionValidationIcon text={monster.lastStand || ""} />
          </div>
        }
        name="lastStand"
        value={monster.lastStand || ""}
        rows={2}
        onChange={(lastStand: string) => setMonster({ ...monster, lastStand })}
      />
      <FormTextarea
        label={
          <div className="flex items-center gap-2">
            More Information
            <ConditionValidationIcon text={monster.moreInfo || ""} />
          </div>
        }
        name="moreInfo"
        value={monster.moreInfo || ""}
        rows={4}
        onChange={(moreInfo: string) => setMonster({ ...monster, moreInfo })}
      />
    </div>
  </div>
);

const MinionForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => {
  return (
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
      <div className="grid grid-cols-6 gap-2">
        <IconFormInput
          icon={SpeedIcon}
          text="Speed"
          name="speed"
          value={monster.speed}
          onChange={(speed) =>
            setMonster({ ...monster, speed: Math.max(0, speed) })
          }
        />
        <IconFormInput
          icon={SwimIcon}
          text="Swim"
          name="swim"
          value={monster.swim}
          onChange={(swim) =>
            setMonster({ ...monster, swim: Math.max(0, swim) })
          }
        />
        <IconFormInput
          icon={FlyIcon}
          text="Fly"
          name="fly"
          value={monster.fly}
          onChange={(fly) => setMonster({ ...monster, fly: Math.max(0, fly) })}
        />
        <IconFormInput
          icon={ClimbIcon}
          text="Climb"
          name="climb"
          value={monster.climb}
          onChange={(climb) =>
            setMonster({ ...monster, climb: Math.max(0, climb) })
          }
        />
        <IconFormInput
          icon={BurrowIcon}
          text="Burrow"
          name="burrow"
          value={monster.burrow}
          onChange={(burrow) =>
            setMonster({ ...monster, burrow: Math.max(0, burrow) })
          }
        />
        <IconFormInput
          icon={TeleportIcon}
          text="Teleport"
          name="teleport"
          value={monster.teleport}
          onChange={(teleport) =>
            setMonster({ ...monster, teleport: Math.max(0, teleport) })
          }
        />
      </div>
      <FamilySection monster={monster} setMonster={setMonster} />
      <AbilitiesSection
        abilities={monster.abilities}
        onChange={(abilities) => setMonster({ ...monster, abilities })}
      />
      <ActionsSection
        actions={monster.actions}
        actionPreface={monster.actionPreface}
        showDamage={false}
        onChange={(actions) => setMonster({ ...monster, actions })}
        onPrefaceChange={(actionPreface) =>
          setMonster({ ...monster, actionPreface })
        }
      />
      <FormTextarea
        label={
          <div className="flex items-center gap-2">
            More Information
            <ConditionValidationIcon text={monster.moreInfo || ""} />
          </div>
        }
        name="moreInfo"
        value={monster.moreInfo || ""}
        rows={4}
        onChange={(moreInfo: string) => setMonster({ ...monster, moreInfo })}
      />
    </div>
  );
};

const StandardForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => {
  return (
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
      <div className="grid grid-cols-3 gap-2">
        <IconFormSelect
          icon={ArmorIcon}
          text="Armor"
          name="armor"
          choices={ARMORS}
          selected={monster.armor}
          onChange={(armor) => setMonster({ ...monster, armor })}
        />
        <IconFormInput
          icon={SpeedIcon}
          text="Speed"
          name="speed"
          value={monster.speed}
          onChange={(speed) =>
            setMonster({ ...monster, speed: Math.max(0, speed) })
          }
        />
        <HPInput
          monster={monster}
          onChange={(hp) => setMonster({ ...monster, hp: Math.max(0, hp) })}
        />
      </div>

      <div className="grid grid-cols-5 gap-2">
        <IconFormInput
          icon={SwimIcon}
          text="Swim"
          name="swim"
          value={monster.swim}
          onChange={(swim) =>
            setMonster({ ...monster, swim: Math.max(0, swim) })
          }
        />
        <IconFormInput
          icon={FlyIcon}
          text="Fly"
          name="fly"
          value={monster.fly}
          onChange={(fly) => setMonster({ ...monster, fly: Math.max(0, fly) })}
        />
        <IconFormInput
          icon={ClimbIcon}
          text="Climb"
          name="climb"
          value={monster.climb}
          onChange={(climb) =>
            setMonster({ ...monster, climb: Math.max(0, climb) })
          }
        />
        <IconFormInput
          icon={BurrowIcon}
          text="Burrow"
          name="burrow"
          value={monster.burrow}
          onChange={(burrow) =>
            setMonster({ ...monster, burrow: Math.max(0, burrow) })
          }
        />
        <IconFormInput
          icon={TeleportIcon}
          text="Teleport"
          name="teleport"
          value={monster.teleport}
          onChange={(teleport) =>
            setMonster({ ...monster, teleport: Math.max(0, teleport) })
          }
        />
      </div>
      <FamilySection monster={monster} setMonster={setMonster} />
      <AbilitiesSection
        abilities={monster.abilities}
        onChange={(abilities) => setMonster({ ...monster, abilities })}
      />
      <ActionsSection
        actions={monster.actions}
        actionPreface={monster.actionPreface}
        showDamage={!monster.legendary}
        onChange={(actions) => setMonster({ ...monster, actions })}
        onPrefaceChange={(actionPreface) =>
          setMonster({ ...monster, actionPreface })
        }
      />
      <FormTextarea
        label={
          <div className="flex items-center gap-2">
            More Information
            <ConditionValidationIcon text={monster.moreInfo || ""} />
          </div>
        }
        name="moreInfo"
        value={monster.moreInfo || ""}
        rows={4}
        onChange={(moreInfo: string) => setMonster({ ...monster, moreInfo })}
      />
    </div>
  );
};

export const MonsterVisibilityEnum = ["private", "public"] as const;

const HP_RECOMMENDATION_STANDARD: Record<
  string,
  Record<MonsterArmor, number>
> = {
  "1/4": { none: 12, medium: 9, heavy: 7 },
  "1/3": { none: 15, medium: 11, heavy: 8 },
  "1/2": { none: 18, medium: 15, heavy: 11 },
  "1": { none: 26, medium: 20, heavy: 16 },
  "2": { none: 34, medium: 27, heavy: 20 },
  "3": { none: 41, medium: 33, heavy: 25 },
  "4": { none: 49, medium: 39, heavy: 29 },
  "5": { none: 58, medium: 46, heavy: 35 },
  "6": { none: 68, medium: 54, heavy: 41 },
  "7": { none: 79, medium: 63, heavy: 47 },
  "8": { none: 91, medium: 73, heavy: 55 },
  "9": { none: 104, medium: 83, heavy: 62 },
  "10": { none: 118, medium: 94, heavy: 71 },
  "11": { none: 133, medium: 106, heavy: 80 },
  "12": { none: 149, medium: 119, heavy: 89 },
  "13": { none: 166, medium: 132, heavy: 100 },
  "14": { none: 184, medium: 147, heavy: 110 },
  "15": { none: 203, medium: 162, heavy: 122 },
  "16": { none: 223, medium: 178, heavy: 134 },
  "17": { none: 244, medium: 195, heavy: 146 },
  "18": { none: 266, medium: 213, heavy: 160 },
  "19": { none: 289, medium: 231, heavy: 173 },
  "20": { none: 313, medium: 250, heavy: 189 },
};

const HP_RECOMMENDATION_LEGENDARY: Record<string, Record<string, number>> = {
  "1": { none: 50, medium: 50, heavy: 35, lastStand: 10 },
  "2": { none: 75, medium: 75, heavy: 55, lastStand: 20 },
  "3": { none: 100, medium: 100, heavy: 75, lastStand: 30 },
  "4": { none: 125, medium: 125, heavy: 95, lastStand: 40 },
  "5": { none: 150, medium: 150, heavy: 115, lastStand: 50 },
  "6": { none: 175, medium: 175, heavy: 135, lastStand: 60 },
  "7": { none: 200, medium: 200, heavy: 155, lastStand: 70 },
  "8": { none: 225, medium: 225, heavy: 175, lastStand: 80 },
  "9": { none: 250, medium: 250, heavy: 195, lastStand: 90 },
  "10": { none: 275, medium: 275, heavy: 215, lastStand: 100 },
  "11": { none: 300, medium: 300, heavy: 235, lastStand: 110 },
  "12": { none: 325, medium: 325, heavy: 255, lastStand: 120 },
  "13": { none: 350, medium: 350, heavy: 275, lastStand: 130 },
  "14": { none: 375, medium: 375, heavy: 295, lastStand: 140 },
  "15": { none: 400, medium: 400, heavy: 315, lastStand: 150 },
  "16": { none: 425, medium: 425, heavy: 335, lastStand: 160 },
  "17": { none: 450, medium: 450, heavy: 355, lastStand: 170 },
  "18": { none: 475, medium: 475, heavy: 375, lastStand: 180 },
  "19": { none: 500, medium: 500, heavy: 395, lastStand: 190 },
  "20": { none: 525, medium: 525, heavy: 415, lastStand: 200 },
};

const getRecommendedHPStandard = (
  level: string,
  armor: MonsterArmor
): number | null => {
  if (!level || !HP_RECOMMENDATION_STANDARD[level]) return null;
  return HP_RECOMMENDATION_STANDARD[level][armor] || null;
};

const getRecommendedHPLegendary = (
  level: string,
  armor: MonsterArmor
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
        <TooltipProvider>
          <span className="flex-1">
            <HPIcon className="h-4 w-4 mr-0.5 inline stroke-hp" />
            HP
          </span>{" "}
          {recommendedHP && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center leading-4 mr-[1px]">
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
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {monster.hp === 0
                    ? "GM Guide Recommended HP"
                    : warning
                      ? ">20% from recommended"
                      : critical
                        ? ">40% from recommended"
                        : "Within 20% of recommended"}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      }
    />
  );
};

interface BuildMonsterProps {
  existingMonster?: Monster;
}

const BuildMonster: React.FC<BuildMonsterProps> = ({ existingMonster }) => {
  const id = useId();
  const router = useRouter();

  const { data: session } = useSession();
  const creator = {
    discordId: session?.user.id || "",
    avatar: session?.user.image || "",
    username: session?.user.name || "",
  };

  const [monster, setMonster] = useState<Monster>(
    () => existingMonster || { ...EXAMPLE_MONSTERS.empty, creator }
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Monster) => {
      const endpoint = data.id ? `/api/monsters/${data.id}` : "/api/monsters";
      const method = data.id ? "PUT" : "POST";

      return fetchApi<Monster>(endpoint, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: (newMonster) => {
      queryClient.invalidateQueries({ queryKey: ["monsters"] });
      queryClient.invalidateQueries({ queryKey: ["monster", newMonster.id] });
      router.push(`/m/${newMonster.id}`);
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
      creator: creator,
    });
  };

  return (
    <BuildView
      entityName={monster.name}
      previewTitle="Monster Preview"
      formClassName={clsx(
        "col-span-6",
        monster.legendary
          ? "md:col-span-3"
          : monster.minion
            ? "md:col-span-4"
            : "md:col-span-4"
      )}
      previewClassName={clsx(
        "hidden md:block",
        monster.legendary
          ? "md:col-span-3"
          : monster.minion
            ? "md:col-span-2"
            : "md:col-span-2"
      )}
      previewContent={<Card monster={monster} />}
      formContent={
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="mb-6 flex justify-center">
            <Tabs
              value={
                monster.legendary
                  ? "legendary"
                  : monster.minion
                    ? "minion"
                    : "standard"
              }
              onValueChange={(value: string) =>
                setMonster({
                  ...monster,
                  legendary: value === "legendary",
                  minion: value === "minion",
                })
              }
            >
              <TabsList>
                <TabsTrigger value="minion" className="px-3">
                  <PersonStanding className="h-4 w-4" />
                  Minion
                </TabsTrigger>
                <TabsTrigger value="standard" className="px-3">
                  <UserIcon className="h-4 w-4" />
                  Standard
                </TabsTrigger>
                <TabsTrigger value="legendary" className="px-3">
                  <Crown className="h-4 w-4" />
                  Legendary
                </TabsTrigger>
              </TabsList>
              <TabsContent value="standard" className="mt-6">
                <StandardForm monster={monster} setMonster={setMonster} />
              </TabsContent>
              <TabsContent value="legendary" className="mt-6">
                <LegendaryForm monster={monster} setMonster={setMonster} />
              </TabsContent>
              <TabsContent value="minion" className="mt-6">
                <MinionForm monster={monster} setMonster={setMonster} />
              </TabsContent>
            </Tabs>
          </div>

          {/*{hasInvalidConditions && (
            <MissingConditionsForm
              conditionNames={allInvalidConditions}
              onConditionsChange={setNewConditions}
            />
          )}*/}

          {session?.user && (
            <div className="flex flex-row justify-between items-center my-4">
              <Button type="submit">Save</Button>
              <fieldset className="space-y-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <VisibilityToggle
                      id={`public-toggle-${id}`}
                      checked={monster.visibility === "public"}
                      onCheckedChange={(checked) => {
                        setMonster({
                          ...monster,
                          visibility: checked ? "public" : "private",
                        });
                      }}
                      entityType="Monster"
                    />
                  </div>
                </div>
              </fieldset>
            </div>
          )}
        </form>
      }
      desktopPreviewContent={
        <>
          <ExampleLoader
            examples={EXAMPLE_MONSTERS}
            onLoadExample={(type) =>
              loadExample(type as keyof typeof EXAMPLE_MONSTERS)
            }
            getIcon={(monster) => {
              if (monster.legendary) return Crown;
              if (monster.minion) return PersonStanding;
              if (monster.name) return UserIcon;
            }}
          />
          <div className="overflow-auto max-h-[calc(100vh-120px)] px-4">
            <Card monster={monster} creator={creator} hideActions={true} />
          </div>
        </>
      }
    />
  );
};

export default BuildMonster;
