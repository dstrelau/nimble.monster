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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  ARMORS,
  MONSTER_LEVELS,
  MONSTER_ROLES,
  type MonsterFormState,
  SIZES,
} from "@/lib/services/monsters";
import {
  CREATURE_KINDS,
  CREATURE_TYPES,
  MONSTER_ENVIRONMENTS,
} from "@/lib/services/monsters/classifications";
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
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <MultiSelect
        className="w-full min-w-0"
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
    </fieldset>
  );
}

interface SectionProps {
  title: string;
  summary?: string;
  children: ReactNode;
}

function Section({ title, summary, children }: SectionProps) {
  return (
    <Collapsible className="border-t">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="group h-auto min-h-12 w-full justify-start whitespace-normal px-2 text-left"
        >
          <ChevronRight className="shrink-0 group-data-[state=open]:rotate-90" />
          <span className="shrink-0">{title}</span>
          {summary && (
            <span className="truncate font-normal text-muted-foreground">
              {summary}
            </span>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-2 pb-5 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface StatblockEditorProps {
  monster: MonsterFormState;
  setMonster: (monster: MonsterFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onVisibilityChange: (visible: boolean) => void;
  pending: boolean;
  canSave: boolean;
  error?: string;
  hpInput: ReactNode;
  families: ReactNode;
  source: ReactNode;
  encounterNotes: ReactNode;
  examples: ReactNode;
  onClear: () => void;
  visibilityConfirmation: ReactNode;
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
  setMonster,
  onSubmit,
  onVisibilityChange,
  pending,
  canSave,
  error,
  hpInput,
  families,
  source,
  encounterNotes,
  examples,
  onClear,
  visibilityConfirmation,
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
    {
      id: "basics",
      label: "Basics",
      icon: FileText,
      title: "What are you making?",
      summary: `Level ${monster.level || "—"}, ${type}`,
    },
    {
      id: "defenses",
      label: "Defenses",
      icon: Shield,
      title: team
        ? "How does the team get around?"
        : monster.minion
          ? "How does it get around?"
          : "How tough is it?",
      summary: team
        ? "Shared movement"
        : monster.minion
          ? `Speed ${monster.speed}`
          : `${monster.hpPerHero != null ? `${monster.hpPerHero} HP / hero` : `${monster.hp} HP`}, ${monster.armor} armor`,
    },
    {
      id: "actions",
      label: team ? "Members" : "Actions",
      icon: team ? Users : Swords,
      title: team ? "Who makes up the team?" : "What does it do on its turn?",
      summary: team
        ? `${monster.members?.length} members`
        : `${monster.actions.length} ${monster.actions.length === 1 ? "action" : "actions"}`,
    },
    {
      id: "traits",
      label: "Traits",
      icon: Sparkles,
      title: "What makes it distinctive?",
      summary: `${monster.abilities.length} ${monster.abilities.length === 1 ? "ability" : "abilities"}`,
    },
    {
      id: "finishing",
      label: "Finishing touches",
      icon: Settings,
      title: "How will others find and use it?",
      summary: "Optional",
    },
  ];
  const activeIndex = tasks.findIndex((item) => item.id === task);
  const activeTask = tasks[activeIndex];
  const navigate = (id: string) => {
    setTask(id);
    setPreview(false);
  };
  const levelInput = (
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
  );
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
      className="mx-auto max-w-[1600px] space-y-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="min-w-0">
          <h1 className="break-words font-slab text-2xl font-bold">
            {monster.name || "New monster"}
          </h1>
          <p className="text-sm capitalize text-muted-foreground">
            Level {monster.level || "—"} · {monster.size} · {type}
          </p>
        </div>
        {canSave && (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save monster"}
          </Button>
        )}
      </header>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[11rem_minmax(0,1fr)] xl:grid-cols-[11rem_minmax(0,1fr)_minmax(0,0.9fr)]">
        <nav
          aria-label="Monster build tasks"
          className="grid grid-cols-5 gap-1 pb-2 lg:sticky lg:top-4 lg:flex lg:flex-col lg:gap-2"
        >
          {tasks.map(({ id, label, icon: Icon, summary }) => (
            <Button
              key={id}
              type="button"
              variant={task === id ? "secondary" : "ghost"}
              aria-current={task === id ? "step" : undefined}
              aria-controls="monster-build-task"
              onClick={() => navigate(id)}
              className="h-auto min-w-0 flex-col gap-2 whitespace-normal px-1 py-3 text-center text-xs lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-left lg:text-sm"
            >
              <Icon className="size-4 shrink-0" />
              <span>
                <span className="block">{label}</span>
                <span className="hidden whitespace-normal text-xs font-normal text-muted-foreground lg:block">
                  {summary}
                </span>
              </span>
            </Button>
          ))}
        </nav>
        <section
          id="monster-build-task"
          aria-labelledby="monster-task-title"
          className={cn("min-w-0 space-y-6 xl:block", preview && "hidden")}
        >
          <h2 id="monster-task-title" className="font-slab text-2xl font-bold">
            {activeTask.title}
          </h2>
          {task === "basics" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="statblock-name">Name</Label>
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
                  <p
                    id="monster-name-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    Give your monster a name before saving.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Monster type"
                  name="monster-type"
                  selected={type}
                  choices={[
                    { value: "minion", label: "Minion", icon: PersonStanding },
                    { value: "standard", label: "Standard", icon: User },
                    { value: "legendary", label: "Legendary", icon: Crown },
                    { value: "team", label: "Team", icon: Users },
                  ]}
                  onChange={(value) => {
                    if (team && value !== "team") setNextType(value);
                    else changeType(value);
                  }}
                />
                {levelInput}
                <FormSelect
                  label="Size"
                  name="statblock-size"
                  choices={SIZES}
                  selected={monster.size}
                  onChange={(size) => patch({ size })}
                />
                <FormInput
                  label="Descriptor"
                  name="statblock-kind"
                  value={monster.kind || ""}
                  onChange={(kind) => patch({ kind })}
                />
              </div>
              <MonsterImageSelect
                value={monster.paperforgeId}
                customArtwork={monster.customArtwork}
                onChange={({ paperforgeId, customArtwork }) =>
                  patch({ paperforgeId, customArtwork })
                }
              />
              <Section title="Start from an example">
                {examples}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      Clear
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="duration-0 [animation-duration:0s]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear form?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all fields. Any unsaved changes will be
                        lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onClear}>
                        Clear
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Section>
            </div>
          )}
          <div hidden={task !== "defenses"} className="space-y-6">
            {!team && !monster.minion && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {task === "defenses" && levelInput}
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
              <p className="text-sm text-muted-foreground">
                Set each member’s HP, armor, and saves in Members.
              </p>
            )}
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
                showDamage={!monster.legendary && !monster.minion}
                onChange={(actions) => patch({ actions })}
                onPrefaceChange={(actionPreface) => patch({ actionPreface })}
              />
            ))}
          {task === "traits" && (
            <div className="space-y-6">
              {team && (
                <p className="text-sm text-muted-foreground">
                  These abilities apply to the whole team. Add individual
                  abilities in Members.
                </p>
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
                title="Family & source"
                summary={[
                  ...monster.families.map((family) => family.name),
                  monster.source?.name,
                ]
                  .filter(Boolean)
                  .join(", ")}
              >
                {families}
                {source}
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
          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="size-4" />
            Preview updates live
          </p>
          <Card
            monster={{ ...monster, name: monster.name || "New monster" }}
            link={false}
            noInteractive
            hideActions
            showEncounterGuidelines
          />
        </aside>
      </div>
      <footer className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t bg-background py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
        <AlertDialogContent>
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
