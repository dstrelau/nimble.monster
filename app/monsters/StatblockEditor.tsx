import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Crown,
  Eye,
  FileText,
  Pencil,
  PersonStanding,
  Settings,
  Shield,
  Sparkles,
  Swords,
  User,
  Users,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { AbilitiesSection } from "@/components/create/AbilitiesSection";
import { ActionsSection } from "@/components/create/ActionsSection";
import {
  emptyMember,
  MembersSection,
} from "@/components/create/MembersSection";
import { Card } from "@/components/monster/Card";
import { MonsterImageSelect } from "@/components/monster/MonsterImageSelect";
import {
  ArmorIcon,
  BurrowIcon,
  ClimbIcon,
  FlyIcon,
  SavesIcon,
  SpeedIcon,
  SwimIcon,
  TeleportIcon,
} from "@/components/monster/Stat";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  IconFormInput,
  IconFormSelect,
} from "@/components/shared/Form";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ARMORS,
  MONSTER_LEVELS,
  MONSTER_ROLES,
  type MonsterFormState,
  type MonsterSize,
  type MonsterTeamMember,
  SIZES,
} from "@/lib/services/monsters";
import {
  CREATURE_KINDS,
  CREATURE_TYPES,
  MONSTER_ENVIRONMENTS,
} from "@/lib/services/monsters/classifications";
import { DAMAGE_TYPES } from "@/lib/services/monsters/damage-types";
import type { User as UserType } from "@/lib/types";
import { cn, levelIntToDisplay } from "@/lib/utils";

interface ClassificationFieldProps<T extends string> {
  label: string;
  values: readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

function ClassificationField<T extends string>({
  label,
  values,
  selected,
  onChange,
}: ClassificationFieldProps<T>) {
  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      <MultiSelect
        options={values.map((value) => ({
          value,
          label: value
            .replaceAll("-", " ")
            .replace(/^./, (first) => first.toUpperCase()),
        }))}
        selected={selected}
        onChange={(selection) =>
          onChange(values.filter((value) => selection.includes(value)))
        }
        placeholder={`Select ${label.toLowerCase()}`}
      />
    </FieldSet>
  );
}

const MONSTER_TYPES = [
  { value: "minion", label: "Minion", icon: PersonStanding },
  { value: "standard", label: "Standard", icon: User },
  { value: "legendary", label: "Legendary", icon: Crown },
  { value: "team", label: "Team", icon: Users },
];

/** Whether a team member holds anything beyond the blank defaults of a newly added member. */
function memberHasContent(member: MonsterTeamMember) {
  return !!(
    member.name.trim() ||
    member.paperforgeId ||
    member.customArtwork ||
    member.hp > 0 ||
    member.hpPerHero != null ||
    member.armor !== "none" ||
    member.size !== "medium" ||
    member.saves?.trim() ||
    member.actionPreface?.trim() ||
    member.abilities.length ||
    member.actions.length
  );
}

/** Squares per side of the creature's footprint on a 4×4 grid of spaces. */
const SIZE_FOOTPRINTS: Record<MonsterSize, number> = {
  tiny: 0.35,
  small: 0.7,
  medium: 1,
  large: 2,
  huge: 3,
  gargantuan: 4,
};

/** The creature's footprint drawn on a grid of spaces; smaller-than-a-space creatures sit centered in one space. */
function SizeFootprint({ size }: { size: MonsterSize }) {
  const side = SIZE_FOOTPRINTS[size];
  const offset = side < 1 ? (1 - side) / 2 : 0;
  return (
    <svg viewBox="0 0 4 4" aria-hidden className="size-14 overflow-visible">
      {[0, 1, 2, 3, 4].map((line) => (
        <g key={line} className="stroke-current opacity-25">
          <line x1={line} y1={0} x2={line} y2={4} strokeWidth={0.04} />
          <line x1={0} y1={line} x2={4} y2={line} strokeWidth={0.04} />
        </g>
      ))}
      <rect
        x={offset}
        y={offset}
        width={side}
        height={side}
        rx={0.1}
        className="fill-current"
      />
    </svg>
  );
}

interface SectionProps {
  title: string;
  summary?: string;
  children: ReactNode;
}

function Section({ title, summary, children }: SectionProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="group w-full justify-start"
        >
          <ChevronRight className="group-data-[state=open]:rotate-90" />
          {title}
          {summary && (
            <span className="truncate font-normal text-muted-foreground">
              {summary}
            </span>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface StatblockEditorProps {
  monster: MonsterFormState;
  creator: UserType;
  setMonster: (monster: MonsterFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onVisibilityChange: (visible: boolean) => void;
  pending: boolean;
  canSave: boolean;
  error?: string;
  hpInput: ReactNode;
  families: ReactNode;
  encounterNotes: ReactNode;
  visibilityConfirmation: ReactNode;
  draftBanner?: ReactNode;
  lastSavedAt?: Date | null;
}

const MOVEMENTS: {
  key: "swim" | "fly" | "climb" | "burrow" | "teleport";
  label: string;
  icon: typeof SwimIcon;
}[] = [
  { key: "swim", label: "Swim", icon: SwimIcon },
  { key: "fly", label: "Fly", icon: FlyIcon },
  { key: "climb", label: "Climb", icon: ClimbIcon },
  { key: "burrow", label: "Burrow", icon: BurrowIcon },
  { key: "teleport", label: "Teleport", icon: TeleportIcon },
];

export function StatblockEditor({
  monster,
  creator,
  setMonster,
  onSubmit,
  onVisibilityChange,
  pending,
  canSave,
  error,
  hpInput,
  families,
  encounterNotes,
  visibilityConfirmation,
  draftBanner,
  lastSavedAt,
}: StatblockEditorProps) {
  const [task, setTask] = useState("basics");
  const [preview, setPreview] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [nextType, setNextType] = useState<string>();
  const team = (monster.members?.length ?? 0) > 0;
  const type = team
    ? "team"
    : monster.legendary
      ? "legendary"
      : monster.minion
        ? "minion"
        : "standard";
  const patch = (fields: Partial<MonsterFormState>) =>
    setMonster({ ...monster, ...fields });
  const tasks = [
    { id: "basics", label: "Basics", icon: FileText },
    {
      id: "defenses",
      label: "Stats",
      icon: Shield,
    },
    {
      id: "actions",
      label: team ? "Members" : "Actions",
      icon: team ? Users : Swords,
    },
    {
      id: "traits",
      label: "Traits",
      icon: Sparkles,
    },
    {
      id: "finishing",
      label: "Finishing touches",
      icon: Settings,
    },
  ];
  const activeIndex = tasks.findIndex((item) => item.id === task);
  const navigate = (id: string) => {
    setTask(id);
    setPreview(false);
  };
  const changeType = (value: string) => {
    patch({
      legendary: value === "legendary",
      minion: value === "minion",
      members:
        value === "team"
          ? monster.members?.length
            ? monster.members
            : [emptyMember(), emptyMember()]
          : [],
    });
    setNextType(undefined);
  };

  return (
    <form
      id="statblock-editor"
      noValidate
      onSubmit={(event) => {
        if (!monster.name.trim()) {
          event.preventDefault();
          setNameError(true);
          navigate("basics");
          requestAnimationFrame(() =>
            document.getElementById("statblock-name")?.focus()
          );
          return;
        }
        onSubmit(event);
      }}
      className="space-y-5"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {monster.name || "New monster"}
          </h1>
          <FieldDescription>
            Level {monster.level || "—"} ·{" "}
            {!team &&
              `${SIZES.find((option) => option.value === monster.size)?.label} · `}
            {MONSTER_TYPES.find((option) => option.value === type)?.label}
          </FieldDescription>
        </div>
        {canSave && (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save monster"}
          </Button>
        )}
      </header>
      {draftBanner}
      {error && <FieldError>{error}</FieldError>}
      <Tabs value={task} onValueChange={navigate}>
        <div className="overflow-x-auto">
          <TabsList aria-label="Monster build tasks">
            {tasks.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id}>
                <Icon />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <section
            id="monster-build-task"
            aria-label={tasks[activeIndex].label}
            className={cn("min-w-0 space-y-6 xl:block", preview && "hidden")}
          >
            {task === "basics" && (
              <div className="space-y-5">
                <Field>
                  <FieldLabel id="statblock-type-label">
                    Monster type
                  </FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    aria-labelledby="statblock-type-label"
                    value={type}
                    onValueChange={(value) => {
                      if (!value) return;
                      if (
                        value !== "team" &&
                        monster.members?.some(memberHasContent)
                      )
                        setNextType(value);
                      else changeType(value);
                    }}
                    className="grid grid-cols-2 gap-3 md:grid-cols-4"
                  >
                    {MONSTER_TYPES.map(({ value, label, icon: Icon }) => (
                      <ToggleGroupItem
                        key={value}
                        value={value}
                        className="h-auto flex-col py-6"
                      >
                        <Icon />
                        {label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="statblock-name">Name</FieldLabel>
                  <Input
                    id="statblock-name"
                    required
                    value={monster.name}
                    aria-invalid={nameError && !monster.name.trim()}
                    aria-describedby={
                      nameError && !monster.name.trim()
                        ? "monster-name-error"
                        : undefined
                    }
                    onChange={(event) => patch({ name: event.target.value })}
                  />
                  {nameError && !monster.name.trim() && (
                    <FieldError id="monster-name-error">
                      Give your monster a name before saving.
                    </FieldError>
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="Level"
                    name="statblock-level"
                    choices={MONSTER_LEVELS.map((level) => ({
                      value: String(level.value),
                      label: level.label,
                    }))}
                    selected={String(monster.levelInt)}
                    onChange={(value) =>
                      patch({
                        levelInt: Number(value),
                        level: levelIntToDisplay(Number(value)),
                      })
                    }
                  />
                  <FormInput
                    label="Descriptor"
                    name="statblock-kind"
                    value={monster.kind || ""}
                    onChange={(kind) => patch({ kind })}
                  />
                </div>
                {!team && (
                  <>
                    <Field>
                      <FieldLabel id="statblock-size-label">Size</FieldLabel>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        aria-labelledby="statblock-size-label"
                        value={monster.size}
                        onValueChange={(size) => {
                          const next = SIZES.find(
                            (option) => option.value === size
                          );
                          if (next) patch({ size: next.value });
                        }}
                        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
                      >
                        {SIZES.map(({ value, label }) => (
                          <ToggleGroupItem
                            key={value}
                            value={value}
                            className="h-auto flex-col py-3"
                          >
                            <SizeFootprint size={value} />
                            {label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      <FieldDescription>
                        {
                          SIZES.find((option) => option.value === monster.size)
                            ?.description
                        }
                      </FieldDescription>
                    </Field>
                    <MonsterImageSelect
                      value={monster.paperforgeId}
                      customArtwork={monster.customArtwork}
                      onChange={({ paperforgeId, customArtwork }) =>
                        patch({ paperforgeId, customArtwork })
                      }
                    />
                  </>
                )}
              </div>
            )}
            <div hidden={task !== "defenses"} className="space-y-6">
              {!team && !monster.minion && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <IconFormSelect
                      icon={ArmorIcon}
                      text="Armor"
                      name="statblock-armor"
                      choices={ARMORS}
                      selected={monster.armor}
                      onChange={(armor) => patch({ armor })}
                    />
                  </div>
                  {hpInput}
                </>
              )}
              <div className="space-y-4 border-t pt-5">
                <h3 className="font-medium">
                  {monster.legendary ? "Saves" : "Movement"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {!team && !monster.legendary && (
                    <IconFormInput
                      icon={SpeedIcon}
                      text="Speed"
                      name="statblock-speed"
                      value={monster.speed}
                      onChange={(speed) => patch({ speed: Math.max(0, speed) })}
                    />
                  )}
                  {monster.legendary && (
                    <IconFormInput
                      icon={SavesIcon}
                      text="Saves"
                      name="statblock-saves"
                      value={monster.saves || ""}
                      onChange={(saves) => patch({ saves })}
                    />
                  )}
                </div>
                {!monster.legendary && (
                  <Section
                    title="Movement types"
                    summary={MOVEMENTS.filter(({ key }) => monster[key] > 0)
                      .map(({ key, label }) => `${label} ${monster[key]}`)
                      .join(", ")}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {MOVEMENTS.map(({ key, label, icon }) => (
                        <IconFormInput
                          key={key}
                          icon={icon}
                          text={label}
                          name={`statblock-${key}`}
                          value={monster[key]}
                          onChange={(value) =>
                            patch({ [key]: Math.max(0, value) })
                          }
                        />
                      ))}
                    </div>
                  </Section>
                )}
              </div>
              {team && (
                <FieldDescription>
                  Set each member’s HP, armor, and saves in Members.
                </FieldDescription>
              )}
              <Section
                title="Damage interactions"
                summary={[
                  monster.vulnerabilities?.length &&
                    `Vulnerable: ${monster.vulnerabilities.join(", ")}`,
                  monster.resistances?.length &&
                    `Resistant: ${monster.resistances.join(", ")}`,
                  monster.immunities?.length &&
                    `Immune: ${monster.immunities.join(", ")}`,
                ]
                  .filter(Boolean)
                  .join("; ")}
              >
                <ClassificationField
                  label="Vulnerabilities"
                  values={DAMAGE_TYPES.filter(
                    (type) =>
                      !monster.resistances?.includes(type) &&
                      !monster.immunities?.includes(type)
                  )}
                  selected={monster.vulnerabilities ?? []}
                  onChange={(vulnerabilities) => patch({ vulnerabilities })}
                />
                <ClassificationField
                  label="Resistances"
                  values={DAMAGE_TYPES.filter(
                    (type) =>
                      !monster.vulnerabilities?.includes(type) &&
                      !monster.immunities?.includes(type)
                  )}
                  selected={monster.resistances ?? []}
                  onChange={(resistances) => patch({ resistances })}
                />
                <ClassificationField
                  label="Immunities"
                  values={DAMAGE_TYPES.filter(
                    (type) =>
                      !monster.vulnerabilities?.includes(type) &&
                      !monster.resistances?.includes(type)
                  )}
                  selected={monster.immunities ?? []}
                  onChange={(immunities) => patch({ immunities })}
                />
              </Section>
            </div>
            {task === "actions" &&
              (team ? (
                <MembersSection
                  compact
                  members={monster.members ?? []}
                  onChange={(members) => patch({ members })}
                />
              ) : (
                <ActionsSection
                  compact
                  actions={monster.actions}
                  actionPreface={monster.actionPreface}
                  showDamage={!monster.legendary}
                  onChange={(actions) => patch({ actions })}
                  onPrefaceChange={(actionPreface) => patch({ actionPreface })}
                />
              ))}
            {task === "traits" && (
              <div className="space-y-6">
                {team && (
                  <FieldDescription>
                    These abilities apply to the whole team. Add individual
                    abilities in Members.
                  </FieldDescription>
                )}
                <AbilitiesSection
                  compact
                  abilities={monster.abilities}
                  onChange={(abilities) => patch({ abilities })}
                />
                {(!monster.minion || monster.bloodied) && (
                  <Section title="Bloodied" summary={monster.bloodied}>
                    <FormTextarea
                      label={
                        <span className="flex items-center gap-2">
                          Bloodied effect{" "}
                          <ConditionValidationIcon text={monster.bloodied} />
                        </span>
                      }
                      name="statblock-bloodied"
                      value={monster.bloodied || ""}
                      onChange={(bloodied) => patch({ bloodied })}
                    />
                  </Section>
                )}
                {(monster.legendary || team || monster.lastStand) && (
                  <Section title="Last stand" summary={monster.lastStand}>
                    <FormTextarea
                      label="Last stand effect"
                      name="statblock-last-stand"
                      value={monster.lastStand || ""}
                      onChange={(lastStand) => patch({ lastStand })}
                    />
                  </Section>
                )}
              </div>
            )}
            {task === "finishing" && (
              <div className="space-y-5">
                <FormTextarea
                  label={
                    <span className="flex items-center gap-2">
                      Description{" "}
                      <ConditionValidationIcon text={monster.moreInfo} />
                    </span>
                  }
                  name="statblock-description"
                  value={monster.moreInfo || ""}
                  rows={3}
                  onChange={(moreInfo) => patch({ moreInfo })}
                />
                <Section
                  title="Encounter notes"
                  summary={
                    monster.mild_encounter || monster.spicy_encounter
                      ? "Notes added"
                      : undefined
                  }
                >
                  {encounterNotes}
                </Section>
                <Section
                  title="Classification"
                  summary={[
                    MONSTER_ROLES.find((role) => role.value === monster.role)
                      ?.label,
                    ...(monster.creatureTypes ?? []),
                    ...(monster.creatureKinds ?? []),
                    ...(monster.environments ?? []),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                >
                  <FormSelect
                    label="Combat role"
                    name="statblock-role"
                    selected={monster.role || "none"}
                    choices={[
                      { value: "none", label: "Not specified" },
                      ...MONSTER_ROLES,
                    ]}
                    onChange={(role) =>
                      patch({
                        role:
                          MONSTER_ROLES.find((option) => option.value === role)
                            ?.value ?? null,
                      })
                    }
                  />
                  <ClassificationField
                    label="Creature types"
                    values={CREATURE_TYPES}
                    selected={monster.creatureTypes ?? []}
                    onChange={(creatureTypes) => patch({ creatureTypes })}
                  />
                  <ClassificationField
                    label="Creature kinds"
                    values={CREATURE_KINDS}
                    selected={monster.creatureKinds ?? []}
                    onChange={(creatureKinds) => patch({ creatureKinds })}
                  />
                  <ClassificationField
                    label="Environments"
                    values={MONSTER_ENVIRONMENTS}
                    selected={monster.environments ?? []}
                    onChange={(environments) => patch({ environments })}
                  />
                </Section>
                <Section
                  title="Family"
                  summary={monster.families
                    .map((family) => family.name)
                    .join(", ")}
                >
                  {families}
                </Section>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
              {activeIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(tasks[activeIndex - 1].id)}
                >
                  <ArrowLeft />
                  {tasks[activeIndex - 1].label}
                </Button>
              ) : (
                <span />
              )}
              {activeIndex < tasks.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(tasks[activeIndex + 1].id)}
                >
                  Next: {tasks[activeIndex + 1].label}
                  <ArrowRight />
                </Button>
              )}
            </div>
          </section>
          <aside
            aria-label="Monster preview"
            className={cn(
              "min-w-0 xl:sticky xl:top-4 xl:block",
              !preview && "hidden"
            )}
          >
            <Card
              monster={{ ...monster, name: monster.name || "New monster" }}
              creator={creator}
              link={false}
              noInteractive
              showEncounterGuidelines
            />
          </aside>
        </div>
      </Tabs>
      <footer className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t bg-background py-3">
        {canSave && (
          <VisibilityToggle
            id="statblock-visibility"
            checked={monster.visibility === "public"}
            onCheckedChange={onVisibilityChange}
          />
        )}
        <Button
          type="button"
          variant="outline"
          className="ml-auto xl:hidden"
          onClick={() => setPreview(!preview)}
        >
          {preview ? <Pencil /> : <Eye />}
          {preview ? "Back to editing" : "Preview"}
        </Button>
        {canSave && lastSavedAt && (
          <FieldDescription>
            Draft saved at{" "}
            {lastSavedAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </FieldDescription>
        )}
        {canSave && (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save monster"}
          </Button>
        )}
      </footer>
      {visibilityConfirmation}
      <AlertDialog
        open={!!nextType}
        onOpenChange={(open) => {
          if (!open) setNextType(undefined);
        }}
      >
        <AlertDialogContent className="duration-0 [animation-duration:0s]">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the team format?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing away from Team removes its member blocks from this draft.
              Other monster fields are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (nextType) changeType(nextType);
              }}
            >
              Change type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
