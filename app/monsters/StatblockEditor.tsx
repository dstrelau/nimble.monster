import {
  ChevronRight,
  Crown,
  Eye,
  Pencil,
  PersonStanding,
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
import { PaperforgeImageSelect } from "@/components/paperforge/PaperforgeImageSelect";
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
import { CardContent, Card as FormCard } from "@/components/ui/card";
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
  const [preview, setPreview] = useState(false);
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
  const togglePreview = () => {
    setPreview(!preview);
    document
      .getElementById("statblock-editor")
      ?.scrollIntoView({ block: "start" });
  };
  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11"
        onClick={togglePreview}
      >
        {preview ? <Pencil /> : <Eye />}
        {preview ? "Back to editing" : "Preview"}
      </Button>
      {canSave && (
        <Button type="submit" disabled={pending} className="h-11">
          {pending ? "Saving…" : "Save monster"}
        </Button>
      )}
    </>
  );

  return (
    <form
      id="statblock-editor"
      onSubmit={onSubmit}
      className={cn(
        "mx-auto scroll-mt-4 space-y-5",
        team || monster.legendary ? "max-w-4xl" : "max-w-3xl"
      )}
    >
      <div className="flex items-end justify-between gap-2 pb-5">
        <FormSelect
          label="Monster type"
          name="monster-type"
          className="[&>button]:mb-0"
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
        {!preview && (
          <div className="flex items-end gap-2">
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
                  <AlertDialogAction onClick={onClear}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {preview ? (
        <div
          className={cn(
            "mx-auto py-4",
            !team && !monster.legendary && "max-w-xl"
          )}
        >
          <Card
            monster={monster}
            link={false}
            hideActions
            showEncounterGuidelines
          />
        </div>
      ) : (
        <FormCard>
          <div className="px-4">
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-4 md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,18rem)]">
              <div className="relative h-22">
                <PaperforgeImageSelect
                  portrait
                  className="absolute -left-7 -top-8 z-10"
                  value={monster.paperforgeId}
                  onChange={(paperforgeId) => patch({ paperforgeId })}
                />
              </div>
              <div className="min-w-0 space-y-3">
                <Label htmlFor="statblock-name">Name</Label>
                <Input
                  id="statblock-name"
                  required
                  placeholder="Monster name"
                  value={monster.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  className={cn(
                    "h-auto py-2 font-slab font-bold",
                    monster.legendary
                      ? "text-3xl md:text-3xl"
                      : "small-caps text-2xl md:text-2xl"
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
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
                  <FormSelect
                    label="Size"
                    name="statblock-size"
                    choices={SIZES}
                    selected={monster.size}
                    onChange={(size) => patch({ size })}
                  />
                </div>
                <FormInput
                  label="Descriptor"
                  name="statblock-kind"
                  value={monster.kind || ""}
                  onChange={(kind) => patch({ kind })}
                />
              </div>
              <div className="col-span-2 min-w-0 space-y-3 md:col-span-1">
                {!team && (
                  <div
                    className={cn(
                      "grid gap-3",
                      monster.minion
                        ? "grid-cols-1"
                        : "grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]"
                    )}
                  >
                    {!monster.minion && (
                      <>
                        <IconFormSelect
                          icon={ArmorIcon}
                          text="Armor"
                          name="statblock-armor"
                          choices={ARMORS}
                          selected={monster.armor}
                          onChange={(armor) => patch({ armor })}
                        />
                        {hpInput}
                      </>
                    )}
                    {!monster.legendary && (
                      <IconFormInput
                        icon={SpeedIcon}
                        text="Speed"
                        name="statblock-speed"
                        value={monster.speed}
                        onChange={(speed) =>
                          patch({ speed: Math.max(0, speed) })
                        }
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
                )}
                {!monster.legendary && (
                  <Section
                    title="Movement types"
                    summary={MOVEMENTS.filter(({ key }) => monster[key] > 0)
                      .map(({ key, label }) => `${label} ${monster[key]}`)
                      .join(", ")}
                  >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            </div>
          </div>
          <div className="bg-muted px-4 py-3 text-foreground dark:shadow-sm">
            <AbilitiesSection
              compact
              abilities={monster.abilities}
              onChange={(abilities) => patch({ abilities })}
            />
          </div>
          <CardContent className="space-y-5">
            {team ? (
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
                onChange={(newActions) => patch({ actions: newActions })}
                onPrefaceChange={(actionPreface) => patch({ actionPreface })}
              />
            )}
            <div>
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
            <FormTextarea
              label={
                <span className="flex items-center gap-2">
                  Description{" "}
                  <ConditionValidationIcon text={monster.moreInfo} />
                </span>
              }
              name="statblock-description"
              value={monster.moreInfo || ""}
              rows={2}
              className="[&_textarea]:italic"
              onChange={(moreInfo) => patch({ moreInfo })}
            />
            <div>
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
            </div>
          </CardContent>
          <div className="border-t px-4 pt-2 [&>div:first-child]:border-t-0">
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
        </FormCard>
      )}
      <div
        className={cn(
          "sticky bottom-0 z-30 mx-auto flex w-full flex-wrap items-center justify-between gap-2 border-t bg-background py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          preview && !team && !monster.legendary && "max-w-xl"
        )}
      >
        {canSave && (
          <VisibilityToggle
            id="statblock-visibility"
            checked={monster.visibility === "public"}
            onCheckedChange={onVisibilityChange}
          />
        )}
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
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
