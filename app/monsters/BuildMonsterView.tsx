"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import {
  Bird,
  CircleAlert,
  CircleCheck,
  Crown,
  PersonStanding,
  Skull,
  Target,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useId, useMemo, useRef, useState } from "react";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { AbilitiesSection } from "@/components/create/AbilitiesSection";
import { ActionsSection } from "@/components/create/ActionsSection";
import { SourceSelect } from "@/components/create/SourceSelect";
import { Card } from "@/components/monster/Card";
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
} from "@/components/monster/Stat";
import { PaperforgeImageSelect } from "@/components/paperforge/PaperforgeImageSelect";
import { BuildView } from "@/components/shared/BuildView";
import { ExampleLoader } from "@/components/shared/ExampleLoader";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  IconFormInput,
  IconFormSelect,
} from "@/components/shared/Form";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchApi } from "@/lib/api";
import type {
  Monster,
  MonsterArmor,
  MonsterSize,
} from "@/lib/services/monsters";
import {
  ARMORS,
  LEGENDARY_MONSTER_LEVELS,
  MONSTER_LEVELS,
  MONSTER_ROLES,
  SIZES,
} from "@/lib/services/monsters";
import { UNKNOWN_USER } from "@/lib/types";
import { cn, levelIntToDisplay } from "@/lib/utils";
import { getMonsterUrl } from "@/lib/utils/url";
import { useUserFamiliesQuery } from "../families/hooks";
import { updateMonster as updateMonsterAction } from "./actions";

const EXAMPLE_MONSTERS: Record<string, Omit<Monster, "creator">> = {
  goblin: {
    visibility: "public",
    id: "",
    legendary: false,
    minion: false,
    name: "Goblin Taskmaster",
    paperforgeId: "5",
    level: "2",
    levelInt: 2,
    size: "small" as MonsterSize,
    armor: "medium" as MonsterArmor,
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    speed: 6,
    hp: 30,
    families: [],
    abilities: [
      {
        id: Math.random().toString(36).slice(2),
        name: "Meat Shield",
        description: "Can force other goblins to Interpose for him.",
      },
    ],
    actions: [
      {
        id: Math.random().toString(36).slice(2),
        name: "Stab",
        damage: "1d6+2",
        description: "(or Shoot, Range 8).",
      },
      {
        id: Math.random().toString(36).slice(2),
        name: "Get in here!",
        damage: "",
        description: "Call a goblin minion to the fight.",
      },
    ],
    actionPreface: "Do both.",
    moreInfo: "It's called meat shield for a reason. Use those minions!",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  manticore: {
    visibility: "public",
    id: "",
    legendary: true,
    minion: false,
    name: "Ravager of the Lowlands",
    paperforgeId: "143",
    kind: "Manticore",
    size: "large" as MonsterSize,
    armor: "medium" as MonsterArmor,
    level: "5",
    levelInt: 5,
    hp: 130,
    speed: 0,
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    saves: "STR+, DEX+",
    families: [],
    abilities: [
      {
        id: Math.random().toString(36).slice(2),
        name: "Feral Instinct",
        description: "Whenever Ravager is crit, he can fly 10.",
      },
    ],
    actions: [
      {
        name: "Venomous Stinger",
        description: "(1 use) Reach:3, 5d12 damage.",
      },
      {
        name: "Ravage",
        description: "Attack for 1d12+20 damage.",
      },
      {
        name: "Move & Claw",
        description: "Fly 10, attack for 1d12+6 damage.",
      },
    ].map((a) => ({ ...a, id: Math.random().toString(36).slice(2) })),
    bloodied: "At 65 HP, his Venomous Stinger recharges.",
    lastStand:
      "The Ravager is dying! 40 more damage and he dies. Until then, the first time each turn he takes damage, he uses Move & Claw.",
    actionPreface: "After each hero's turn, choose one.",
    moreInfo:
      "A mythical beast with the body of a lion, the wings of a dragon, and the face of a human. Known for their deadly tail spikes.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  kobold: {
    visibility: "public",
    id: "",
    legendary: false,
    minion: true,
    name: "Kobold Minion",
    paperforgeId: "9",
    level: "1/4",
    levelInt: -4,
    size: "small" as MonsterSize,
    armor: "none" as MonsterArmor,
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    speed: 6,
    hp: 0,
    families: [],
    abilities: [],
    actions: [
      {
        id: Math.random().toString(36).slice(2),
        name: "Slash",
        description: "1d6 (follows minion rules)",
      },
    ],
    actionPreface: "",
    moreInfo: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  empty: {
    visibility: "public",
    id: "",
    legendary: false,
    minion: false,
    name: "",
    level: "",
    levelInt: 0,
    size: "medium",
    armor: "none",
    swim: 0,
    fly: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    speed: 6,
    hp: 0,
    families: [],
    abilities: [],
    actions: [],
    actionPreface: "Choose one.",
    moreInfo: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const FamilySection: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => {
  const { data: session } = useSession();
  const userFamilies = useUserFamiliesQuery({
    enabled: !!session?.user,
  });

  const handleSelectFamilies = (familyIds: string[]) => {
    const selectedFamilies =
      userFamilies.data?.filter((f) => familyIds.includes(f.id)) || [];
    setMonster({ ...monster, families: selectedFamilies });
  };

  const familyOptions =
    userFamilies.data?.map((f) => ({ value: f.id, label: f.name })) || [];

  return (
    <fieldset className="flex flex-col">
      <legend className="font-sans mb-4 font-bold">Families</legend>
      <MultiSelect
        options={familyOptions}
        selected={monster.families.map((f) => f.id)}
        onChange={handleSelectFamilies}
        placeholder="Select..."
        emptyText="No families found."
      />
    </fieldset>
  );
};

const EncounterGuidelinesFields: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <>
    <FormTextarea
      label={
        <div className="flex items-center gap-2">
          <Bird className="size-4" />
          Mild Encounter
          <ConditionValidationIcon text={monster.mild_encounter} />
        </div>
      }
      name="mild_encounter"
      value={monster.mild_encounter || ""}
      rows={3}
      onChange={(mild_encounter: string) =>
        setMonster({ ...monster, mild_encounter })
      }
    />
    <FormTextarea
      label={
        <div className="flex items-center gap-2">
          <Skull className="size-4" />
          Spicy Encounter
          <ConditionValidationIcon text={monster.spicy_encounter} />
        </div>
      }
      name="spicy_encounter"
      value={monster.spicy_encounter || ""}
      rows={3}
      onChange={(spicy_encounter: string) =>
        setMonster({ ...monster, spicy_encounter })
      }
    />
  </>
);

const LegendaryForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-7 gap-x-6">
      <FormSelect
        label="Lvl"
        name="level"
        choices={LEGENDARY_MONSTER_LEVELS.map((l) => ({
          value: l.value.toString(),
          label: l.label,
        }))}
        selected={monster.levelInt.toString()}
        className="col-span-1"
        onChange={(levelStr) => {
          const levelInt = parseInt(levelStr, 10);
          const level = levelIntToDisplay(levelInt);
          setMonster({ ...monster, level, levelInt });
        }}
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
    <div className="grid grid-cols-3 gap-x-6">
      <FormInput
        label="Name"
        name="name"
        value={monster.name}
        className="col-span-2"
        onChange={(name) => setMonster({ ...monster, name })}
      />
      <PaperforgeImageSelect
        value={monster.paperforgeId}
        onChange={(paperforgeId) => setMonster({ ...monster, paperforgeId })}
        className="col-span-1"
      />
    </div>
    <div>
      <div className="grid grid-cols-14 gap-x-6">
        <HPInput
          monster={monster}
          className="col-span-5"
          onChange={(hp) => setMonster({ ...monster, hp: Math.max(0, hp) })}
          onPerHeroChange={(hpPerHero) => setMonster({ ...monster, hpPerHero })}
        />
        <IconFormSelect
          icon={ArmorIcon}
          text="Armor"
          name="armor"
          choices={ARMORS}
          selected={monster.armor}
          className="col-span-4"
          labelClassName="h-8"
          onChange={(armor) => setMonster({ ...monster, armor })}
        />
        <div className="col-span-5">
          <IconFormInput
            name="saves"
            text="Saves"
            icon={SavesIcon}
            value={monster.saves || ""}
            labelClassName="h-8"
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
            <ConditionValidationIcon text={monster.bloodied} />
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
            <ConditionValidationIcon text={monster.lastStand} />
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
            <ConditionValidationIcon text={monster.moreInfo} />
          </div>
        }
        name="moreInfo"
        value={monster.moreInfo || ""}
        rows={4}
        onChange={(moreInfo: string) => setMonster({ ...monster, moreInfo })}
      />
      <EncounterGuidelinesFields monster={monster} setMonster={setMonster} />
    </div>
  </div>
);

const MinionForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-x-6">
        <FormInput
          label="Name"
          name="name"
          value={monster.name}
          className="col-span-2"
          onChange={(name) => setMonster({ ...monster, name })}
        />
        <PaperforgeImageSelect
          value={monster.paperforgeId}
          onChange={(paperforgeId) => setMonster({ ...monster, paperforgeId })}
          className="col-span-1"
        />
      </div>
      <div className="grid grid-cols-5 gap-x-6">
        <FormSelect
          label="Lvl"
          name="level"
          choices={MONSTER_LEVELS.map((l) => ({
            value: l.value.toString(),
            label: l.label,
          }))}
          selected={monster.levelInt.toString()}
          className="col-span-1"
          onChange={(levelStr) => {
            const levelInt = parseInt(levelStr, 10);
            const level = levelIntToDisplay(levelInt);
            setMonster({ ...monster, level, levelInt });
          }}
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
            <ConditionValidationIcon text={monster.moreInfo} />
          </div>
        }
        name="moreInfo"
        value={monster.moreInfo || ""}
        rows={4}
        onChange={(moreInfo: string) => setMonster({ ...monster, moreInfo })}
      />
      <EncounterGuidelinesFields monster={monster} setMonster={setMonster} />
    </div>
  );
};

const StandardForm: React.FC<{
  monster: Monster;
  setMonster: (m: Monster) => void;
}> = ({ monster, setMonster }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-x-6">
        <FormInput
          label="Name"
          name="name"
          value={monster.name}
          className="col-span-2"
          onChange={(name) => setMonster({ ...monster, name })}
        />
        <PaperforgeImageSelect
          value={monster.paperforgeId}
          onChange={(paperforgeId) => setMonster({ ...monster, paperforgeId })}
          className="col-span-1"
        />
      </div>
      <div className="grid grid-cols-5 gap-x-6">
        <FormSelect
          label="Lvl"
          name="level"
          choices={MONSTER_LEVELS.map((l) => ({
            value: l.value.toString(),
            label: l.label,
          }))}
          selected={monster.levelInt.toString()}
          className="col-span-1"
          onChange={(levelStr) => {
            const levelInt = parseInt(levelStr, 10);
            const level = levelIntToDisplay(levelInt);
            setMonster({ ...monster, level, levelInt });
          }}
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
          className="col-span-2"
          onChange={(kind) => setMonster({ ...monster, kind })}
        />
        <FormSelect
          label="Role"
          name="role"
          choices={[
            { value: "none", label: "None" },
            ...MONSTER_ROLES.map((r) => ({
              value: r.value,
              label: r.label,
            })),
          ]}
          selected={monster.role || "none"}
          className="col-span-1"
          onChange={(role) =>
            setMonster({ ...monster, role: role === "none" ? null : role })
          }
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <IconFormSelect
          icon={ArmorIcon}
          text="Armor"
          name="armor"
          choices={ARMORS}
          selected={monster.armor}
          labelClassName="h-8"
          onChange={(armor) => setMonster({ ...monster, armor })}
        />
        <IconFormInput
          icon={SpeedIcon}
          text="Speed"
          name="speed"
          value={monster.speed}
          labelClassName="h-8"
          onChange={(speed) =>
            setMonster({ ...monster, speed: Math.max(0, speed) })
          }
        />
        <HPInput
          monster={monster}
          onChange={(hp) => setMonster({ ...monster, hp: Math.max(0, hp) })}
          onPerHeroChange={(hpPerHero) => setMonster({ ...monster, hpPerHero })}
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
            <ConditionValidationIcon text={monster.moreInfo} />
          </div>
        }
        name="moreInfo"
        value={monster.moreInfo || ""}
        rows={4}
        onChange={(moreInfo: string) => setMonster({ ...monster, moreInfo })}
      />
      <EncounterGuidelinesFields monster={monster} setMonster={setMonster} />
    </div>
  );
};

export const MonsterVisibilityEnum = ["private", "public"] as const;

const HP_RECOMMENDATION_STANDARD: Record<
  number,
  Record<MonsterArmor, number>
> = {
  [-4]: { none: 12, medium: 9, heavy: 7 }, // 1/4
  [-3]: { none: 15, medium: 11, heavy: 8 }, // 1/3
  [-2]: { none: 18, medium: 15, heavy: 11 }, // 1/2
  1: { none: 26, medium: 20, heavy: 16 },
  2: { none: 34, medium: 27, heavy: 20 },
  3: { none: 41, medium: 33, heavy: 25 },
  4: { none: 49, medium: 39, heavy: 29 },
  5: { none: 58, medium: 46, heavy: 35 },
  6: { none: 68, medium: 54, heavy: 41 },
  7: { none: 79, medium: 63, heavy: 47 },
  8: { none: 91, medium: 73, heavy: 55 },
  9: { none: 104, medium: 83, heavy: 62 },
  10: { none: 118, medium: 94, heavy: 71 },
  11: { none: 133, medium: 106, heavy: 80 },
  12: { none: 149, medium: 119, heavy: 89 },
  13: { none: 166, medium: 132, heavy: 100 },
  14: { none: 184, medium: 147, heavy: 110 },
  15: { none: 203, medium: 162, heavy: 122 },
  16: { none: 223, medium: 178, heavy: 134 },
  17: { none: 244, medium: 195, heavy: 146 },
  18: { none: 266, medium: 213, heavy: 160 },
  19: { none: 289, medium: 231, heavy: 173 },
  20: { none: 313, medium: 250, heavy: 189 },
};

const HP_RECOMMENDATION_LEGENDARY: Record<number, Record<string, number>> = {
  1: { none: 50, medium: 50, heavy: 35, lastStand: 10 },
  2: { none: 75, medium: 75, heavy: 55, lastStand: 20 },
  3: { none: 100, medium: 100, heavy: 75, lastStand: 30 },
  4: { none: 125, medium: 125, heavy: 95, lastStand: 40 },
  5: { none: 150, medium: 150, heavy: 115, lastStand: 50 },
  6: { none: 175, medium: 175, heavy: 135, lastStand: 60 },
  7: { none: 200, medium: 200, heavy: 155, lastStand: 70 },
  8: { none: 225, medium: 225, heavy: 175, lastStand: 80 },
  9: { none: 250, medium: 250, heavy: 195, lastStand: 90 },
  10: { none: 275, medium: 275, heavy: 215, lastStand: 100 },
  11: { none: 300, medium: 300, heavy: 235, lastStand: 110 },
  12: { none: 325, medium: 325, heavy: 255, lastStand: 120 },
  13: { none: 350, medium: 350, heavy: 275, lastStand: 130 },
  14: { none: 375, medium: 375, heavy: 295, lastStand: 140 },
  15: { none: 400, medium: 400, heavy: 315, lastStand: 150 },
  16: { none: 425, medium: 425, heavy: 335, lastStand: 160 },
  17: { none: 450, medium: 450, heavy: 355, lastStand: 170 },
  18: { none: 475, medium: 475, heavy: 375, lastStand: 180 },
  19: { none: 500, medium: 500, heavy: 395, lastStand: 190 },
  20: { none: 525, medium: 525, heavy: 415, lastStand: 200 },
};

// Recommended HP per hero for legendary monsters, keyed by monster level
// (player level == monster level for legendary monsters). A null entry means
// that armor type has no recommendation at that level.
const HP_PER_HERO_RECOMMENDATION_LEGENDARY: Record<
  number,
  Partial<Record<MonsterArmor, number>>
> = {
  1: { none: 22 },
  2: { none: 28, medium: 20 },
  3: { none: 40, medium: 28, heavy: 18 },
  4: { none: 44, medium: 31, heavy: 20 },
  5: { none: 48, medium: 34, heavy: 22 },
  6: { none: 56, medium: 39, heavy: 25 },
  7: { none: 64, medium: 44, heavy: 29 },
  8: { none: 71, medium: 50, heavy: 32 },
  9: { none: 79, medium: 55, heavy: 35 },
  10: { none: 86, medium: 60, heavy: 39 },
  11: { none: 94, medium: 67, heavy: 44 },
  12: { none: 102, medium: 74, heavy: 50 },
  13: { none: 109, medium: 82, heavy: 56 },
  14: { none: 117, medium: 89, heavy: 63 },
  15: { none: 125, medium: 97, heavy: 70 },
  16: { none: 132, medium: 104, heavy: 77 },
  17: { none: 140, medium: 111, heavy: 84 },
  18: { none: 147, medium: 118, heavy: 91 },
  19: { none: 155, medium: 126, heavy: 99 },
  20: { none: 166, medium: 136, heavy: 110 },
};

const getRecommendedHPStandard = (
  levelInt: number,
  armor: MonsterArmor
): number | null => {
  if (levelInt === 0 || !HP_RECOMMENDATION_STANDARD[levelInt]) return null;
  return HP_RECOMMENDATION_STANDARD[levelInt][armor] || null;
};

const getRecommendedHPLegendary = (
  levelInt: number,
  armor: MonsterArmor
): number | null => {
  if (levelInt === 0 || !HP_RECOMMENDATION_LEGENDARY[levelInt]) return null;
  return HP_RECOMMENDATION_LEGENDARY[levelInt][armor] || null;
};

const getRecommendedHPPerHeroLegendary = (
  levelInt: number,
  armor: MonsterArmor
): number | null => {
  if (levelInt === 0 || !HP_PER_HERO_RECOMMENDATION_LEGENDARY[levelInt])
    return null;
  return HP_PER_HERO_RECOMMENDATION_LEGENDARY[levelInt][armor] ?? null;
};

const HPInput: React.FC<{
  monster: Monster;
  onChange: (hp: number) => void;
  onPerHeroChange: (hpPerHero: number | null) => void;
  className?: string;
}> = ({ monster, onChange, onPerHeroChange, className }) => {
  const perHeroId = useId();
  const perHeroEnabled = monster.hpPerHero != null;

  // Remember the last per-hero value so toggling off and back on restores it
  // instead of resetting to 0 (the value lives in monster.hpPerHero, which is
  // cleared to null while the toggle is off).
  const lastPerHeroValue = useRef(monster.hpPerHero ?? 0);
  if (monster.hpPerHero != null) {
    lastPerHeroValue.current = monster.hpPerHero;
  }

  // When per-hero HP is used:
  //  - legendary monsters use the per-hero recommendation table
  //  - regular monsters have no recommendation (tooltip disabled completely)
  // Otherwise the total-HP recommendation tables are used.
  const recommended = useMemo(() => {
    if (perHeroEnabled) {
      return monster.legendary
        ? getRecommendedHPPerHeroLegendary(monster.levelInt, monster.armor)
        : null;
    }
    return monster.legendary
      ? getRecommendedHPLegendary(monster.levelInt, monster.armor)
      : getRecommendedHPStandard(monster.levelInt, monster.armor);
  }, [perHeroEnabled, monster.legendary, monster.levelInt, monster.armor]);

  const currentValue = perHeroEnabled ? (monster.hpPerHero ?? 0) : monster.hp;

  const percentDiff = useMemo(() => {
    if (!recommended || currentValue === 0) return 0;
    return Math.abs(currentValue - recommended) / recommended;
  }, [recommended, currentValue]);

  const warning = percentDiff > 0.2 && percentDiff < 0.4;
  const critical = percentDiff > 0.4;

  const perHeroToggle = (
    <Toggle
      id={`hp-per-hero-${perHeroId}`}
      variant="outline"
      size="sm"
      pressed={perHeroEnabled}
      onPressedChange={(pressed) =>
        onPerHeroChange(pressed ? lastPerHeroValue.current : null)
      }
    >
      per hero
    </Toggle>
  );

  const recommendationIndicator = recommended ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center leading-4 mr-[1px]">
            {currentValue === 0 ? (
              <Target className="h-4" />
            ) : warning ? (
              <TriangleAlert className="h-4 text-warning" />
            ) : critical ? (
              <CircleAlert className="h-4 text-error" />
            ) : (
              <CircleCheck className="h-4 text-success" />
            )}
            {recommended}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {currentValue === 0
              ? "GM Guide Recommended HP"
              : warning
                ? ">20% from recommended"
                : critical
                  ? ">40% from recommended"
                  : "Within 20% of recommended"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  return (
    <div className={cn("space-y-2", className)}>
      {!perHeroEnabled && (
        <FormInput
          name="hp"
          value={monster.hp}
          onChange={onChange}
          labelClassName="h-8"
          label={
            <>
              <span>
                <HPIcon className="h-4 w-4 mr-0.5 inline stroke-hp" />
                HP
              </span>
              {perHeroToggle}
              <span className="flex-1" />
              {recommendationIndicator}
            </>
          }
        />
      )}
      {perHeroEnabled && (
        <FormInput
          name="hpPerHero"
          value={monster.hpPerHero ?? 0}
          onChange={(value) => onPerHeroChange(Math.max(0, value))}
          labelClassName="h-8"
          label={
            <>
              <span>
                <HPIcon className="h-4 w-4 mr-0.5 inline stroke-hp" />
                HP
              </span>
              {perHeroToggle}
              <span className="flex-1" />
              {recommendationIndicator}
            </>
          }
        />
      )}
    </div>
  );
};

interface BuildMonsterProps {
  existingMonster?: Monster;
  remixedFromId?: string;
}

const BuildMonster: React.FC<BuildMonsterProps> = ({
  existingMonster,
  remixedFromId,
}) => {
  const id = useId();
  const router = useRouter();

  const { data: session } = useSession();
  const creator = session?.user || UNKNOWN_USER;

  const [monster, setMonster] = useState<Monster>(() => {
    if (existingMonster) {
      const baseMonster = {
        ...existingMonster,
        creator,
      };

      if (remixedFromId) {
        const { source: _, ...baseWithoutSource } = baseMonster;
        return {
          ...baseWithoutSource,
          id: "",
          visibility: "public",
          remixedFrom: {
            id: existingMonster.id,
            name: existingMonster.name,
            creator: existingMonster.creator,
          },
        };
      }

      return baseMonster;
    }
    return { ...EXAMPLE_MONSTERS.empty, creator };
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Monster) => {
      if (data.id) {
        return updateMonsterAction({
          id: data.id,
          name: data.name,
          level: data.level,
          levelInt: data.levelInt,
          hp: data.hpPerHero != null ? 0 : data.hp,
          hpPerHero: data.hpPerHero ?? null,
          armor: data.armor,
          size: data.size,
          speed: data.speed,
          fly: data.fly,
          swim: data.swim,
          climb: data.climb,
          teleport: data.teleport,
          burrow: data.burrow,
          actions: data.actions,
          abilities: data.abilities,
          legendary: data.legendary,
          minion: data.minion,
          bloodied: data.bloodied || "",
          lastStand: data.lastStand || "",
          saves: data.saves
            ? Array.isArray(data.saves)
              ? data.saves
              : [data.saves]
            : [],
          kind: data.kind || "",
          visibility: data.visibility,
          actionPreface: data.actionPreface || "",
          moreInfo: data.moreInfo || "",
          mild_encounter: data.mild_encounter || "",
          spicy_encounter: data.spicy_encounter || "",
          families: data.families || [],
          sourceId: data.source?.id ?? null,
          role: data.role || null,
          paperforgeId: data.paperforgeId ?? null,
        });
      }

      return fetchApi<Monster>("/api/monsters", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          hp: data.hpPerHero != null ? 0 : data.hp,
          hpPerHero: data.hpPerHero ?? null,
          remixedFromId,
        }),
      });
    },
    onSuccess: (newMonster) => {
      queryClient.invalidateQueries({ queryKey: ["monsters"] });
      queryClient.invalidateQueries({ queryKey: ["monster", newMonster.id] });
      router.push(getMonsterUrl(newMonster));
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
      previewContent={
        <Card link={false} monster={monster} showEncounterGuidelines />
      }
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

          <SourceSelect
            source={monster.source}
            onChange={(sourceOption) => {
              if (sourceOption) {
                setMonster({
                  ...monster,
                  source: {
                    ...sourceOption,
                    license: "",
                    link: "",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });
              } else {
                const { source: _, ...rest } = monster;
                setMonster(rest);
              }
            }}
          />

          {session?.user && (
            <div className="flex flex-row justify-between items-center my-4">
              <Button type="submit" disabled={mutation.isPending}>
                Save
              </Button>
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
          <div className="overflow-auto max-h-[calc(100vh-120px)] px-4 pt-7">
            <Card
              link={false}
              monster={monster}
              creator={creator}
              hideActions={true}
              showEncounterGuidelines
            />
          </div>
        </>
      }
    />
  );
};

export default BuildMonster;
