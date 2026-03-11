"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowBigDown,
  ArrowBigUp,
  Eye,
  Heart,
  Plus,
  Shield,
  Star,
  Swords,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  type Control,
  type FieldArrayWithId,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import { ClassDetailView } from "@/app/ui/class/ClassDetailView";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
import { EditableLevelAbilities } from "@/components/app/EditableLevelAbilities";
import { VisibilityToggle } from "@/components/app/VisibilityToggle";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { DieFromNotation } from "@/components/icons/PolyhedralDice";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupPrefix } from "@/components/ui/input-group";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagsInput } from "@/components/ui/tags-input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { useClassDraft } from "@/lib/hooks/useClassDraft";
import {
  ARMOR_TYPES,
  type ArmorType,
  type Class,
  HIT_DIE_SIZES,
  STAT_TYPES,
  UNKNOWN_USER,
} from "@/lib/types";
import { cn, randomUUID } from "@/lib/utils";
import { getClassUrl } from "@/lib/utils/url";
import { createClass, updateClass } from "../actions/class";

const weaponSpecSchema = z.union([
  z.object({ kind: z.enum(["blade", "stave", "wand"]) }),
  z.object({ type: z.enum(["STR", "DEX"]) }),
  z.object({ range: z.enum(["melee", "ranged"]) }),
]);

const abilitySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string(),
  })
  .superRefine((a, ctx) => {
    const nameEmpty = !a.name.trim();
    const descEmpty = !a.description.trim();
    if (!nameEmpty || !descEmpty) {
      if (nameEmpty)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ability name is required",
          path: ["name"],
        });
      if (descEmpty)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ability description is required",
          path: ["description"],
        });
    }
  });

const levelSchema = z.object({
  level: z.number(),
  abilities: z.array(abilitySchema),
});

const classOptionItemSchema = z.object({
  name: z.string().min(1, "Option name is required"),
  description: z.string().optional(),
});

const classOptionListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  items: z
    .array(classOptionItemSchema)
    .min(1, "At least one option is required"),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  keyStats: z
    .array(z.enum(STAT_TYPES))
    .length(2, "Must select exactly 2 stats"),
  hitDie: z.enum(HIT_DIE_SIZES),
  startingHp: z.number().min(1),
  saves: z
    .object({
      STR: z.number(),
      DEX: z.number(),
      INT: z.number(),
      WIL: z.number(),
    })
    .refine((saves) => Object.values(saves).some((v) => v === 1), {
      message: "Must select an advantage save",
    })
    .refine((saves) => Object.values(saves).some((v) => v === -1), {
      message: "Must select a disadvantage save",
    }),
  armor: z.array(z.enum(ARMOR_TYPES)),
  weapons: z.array(weaponSpecSchema),
  startingGear: z.array(z.string()),
  levels: z.array(levelSchema),
  abilityLists: z.array(classOptionListSchema),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;
type EditorMode = "preview" | "edit";

interface BuildClassViewProps {
  classEntity?: Class;
}

export default function BuildClassView({ classEntity }: BuildClassViewProps) {
  const id = useId();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<EditorMode>("edit");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: classEntity?.name || "",
      description: classEntity?.description || "",
      keyStats: classEntity?.keyStats || ["STR", "DEX"],
      hitDie: classEntity?.hitDie || "d8",
      startingHp: classEntity?.startingHp || 8,
      saves: classEntity?.saves || { STR: 1, DEX: -1, INT: 0, WIL: 0 },
      armor: classEntity?.armor || [],
      weapons: classEntity?.weapons || [],
      startingGear: classEntity?.startingGear || [],
      levels: Array.from({ length: 20 }, (_, i) => {
        const existing = classEntity?.levels?.find((l) => l.level === i + 1);
        return (
          existing ?? {
            level: i + 1,
            abilities: [{ id: randomUUID(), name: "", description: "" }],
          }
        );
      }),
      abilityLists:
        classEntity?.abilityLists?.map((l) => ({
          name: l.name,
          description: l.description || "",
          items: l.items.map((i) => ({
            name: i.name,
            description: i.description || "",
          })),
        })) || [],
      visibility: classEntity?.visibility || "public",
    },
  });

  const {
    draftState,
    draftData,
    lastSavedAt,
    restoreDraft,
    discardDraft,
    onFormChange,
    deleteDraftOnSave,
  } = useClassDraft<FormData>({
    classId: classEntity?.id ?? null,
    classUpdatedAt: classEntity?.updatedAt,
    isLoggedIn: !!session?.user?.id,
    enabled: process.env.NEXT_PUBLIC_FEATURE_CLASS_AUTOSAVE === "true",
  });

  // Watch form changes and auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      onFormChange(data);
    });
    return () => subscription.unsubscribe();
  }, [onFormChange, form.watch]);

  const handleRestoreDraft = () => {
    if (draftData) form.reset(draftData);
    restoreDraft();
  };

  const { fields: levelFields } = useFieldArray({
    control: form.control,
    name: "levels",
  });

  const watchedValues = form.watch() as FormData;

  const creator = session?.user || UNKNOWN_USER;
  const previewClass = useMemo<Class>(() => {
    return {
      id: classEntity?.id || "",
      name: watchedValues.name || "",
      subclassNamePreface: classEntity?.subclassNamePreface || "",
      description: watchedValues.description || "",
      keyStats: watchedValues.keyStats || [],
      hitDie: watchedValues.hitDie || "d8",
      startingHp: watchedValues.startingHp || 0,
      saves: watchedValues.saves || { STR: 0, DEX: 0, INT: 0, WIL: 0 },
      armor: watchedValues.armor || [],
      weapons: watchedValues.weapons || [],
      startingGear: watchedValues.startingGear || [],
      levels: (watchedValues.levels || [])
        .map((l) => ({
          ...l,
          abilities: l.abilities.filter(
            (a) => a.name.trim() || a.description.trim()
          ),
        }))
        .filter((l) => l.abilities.length > 0),
      abilityLists: (watchedValues.abilityLists || []).map((l) => ({
        id: randomUUID(),
        name: l.name,
        description: l.description || "",
        items: (l.items || []).map((item) => ({
          id: randomUUID(),
          name: item.name,
          description: item.description || "",
        })),
        creator,
        createdAt: classEntity?.createdAt || new Date(),
        updatedAt: new Date(),
      })),
      visibility: watchedValues.visibility,
      creator,
      createdAt: classEntity?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }, [
    watchedValues,
    creator,
    classEntity?.id,
    classEntity?.createdAt,
    classEntity?.subclassNamePreface,
  ]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!classEntity?.id;

      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        keyStats: data.keyStats,
        hitDie: data.hitDie,
        startingHp: data.startingHp,
        saves: data.saves,
        armor: data.armor,
        weapons: data.weapons,
        startingGear: data.startingGear,
        levels: data.levels
          .map((l) => ({
            ...l,
            abilities: l.abilities.filter(
              (a) => a.name.trim() || a.description.trim()
            ),
          }))
          .filter((l) => l.abilities.length > 0),
        abilityLists: data.abilityLists.map((l) => ({
          name: l.name.trim(),
          description: l.description?.trim() || "",
          items: l.items.map((i) => ({
            name: i.name.trim(),
            description: i.description?.trim() || "",
          })),
        })),
        visibility: data.visibility,
      };

      const result = isEditing
        ? await updateClass(classEntity.id, payload)
        : await createClass(payload);

      if (result.success && result.class) {
        await deleteDraftOnSave();
        router.push(getClassUrl(result.class));
      } else {
        form.setError("root", {
          message:
            result.error ||
            `Failed to ${isEditing ? "update" : "create"} class`,
        });
      }
    } catch (error) {
      form.setError("root", {
        message: `Error ${classEntity?.id ? "updating" : "creating"} class: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, () => setMode("edit"))}
        className="space-y-4 pb-10"
      >
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <Toggle
              variant="outline"
              pressed={mode === "preview"}
              onPressedChange={(pressed) =>
                setMode(pressed ? "preview" : "edit")
              }
              aria-label="Toggle preview"
            >
              <Eye />
              Preview
            </Toggle>
            {mode === "edit" && (
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
                    <AlertDialogAction onClick={() => form.reset()}>
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          {(draftState === "available" || draftState === "stale") && (
            <div className="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
              <span className="flex-1">
                {draftState === "stale"
                  ? "An older draft was found. Restore it?"
                  : "You have an unsaved draft. Restore it?"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => discardDraft()}
              >
                Discard
              </Button>
              <Button type="button" size="sm" onClick={handleRestoreDraft}>
                Restore
              </Button>
            </div>
          )}
          {mode === "preview" ? (
            <ClassDetailView classEntity={previewClass} creator={creator} />
          ) : (
            <EditableClassCard
              control={form.control}
              levelFields={levelFields}
            />
          )}
          <div className="flex items-center gap-3">
            <fieldset>
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <VisibilityToggle
                    id={`class-visibility-toggle-${id}`}
                    checked={field.value === "public"}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? "public" : "private")
                    }
                  />
                )}
              />
            </fieldset>
            {session?.user.id && (
              <div className="flex items-center gap-3 ml-auto">
                {lastSavedAt && (
                  <span className="text-xs text-muted-foreground">
                    Draft saved at{" "}
                    {lastSavedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : classEntity?.id
                      ? "Update"
                      : "Save"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        {!session?.user && mode === "edit" && (
          <div className="flex items-center gap-2 py-2">
            <DiscordLoginButton className="px-2 py-1" />
            {" to save"}
          </div>
        )}
      </form>
    </Form>
  );
}

interface EditableClassCardProps {
  control: Control<FormData>;
  levelFields: FieldArrayWithId<FormData, "levels">[];
}

function EditableClassCard({ control, levelFields }: EditableClassCardProps) {
  const mutedIconClass = "stroke-neutral-400 dark:stroke-neutral-500";

  return (
    <Card>
      <CardHeader className="text-center space-y-3">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-auto text-center font-slab text-4xl md:text-4xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description
                <ConditionValidationIcon text={field.value} />
              </FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-18 text-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="relative w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem] py-3 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-sm space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full justify-center flex-wrap gap-y-6 gap-x-8">
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-bold">Key Stats</span>
                <FormField
                  control={control}
                  name="keyStats"
                  render={({ field }) => {
                    const [stat1 = "STR", stat2 = "DEX"] = field.value;
                    return (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Select
                              value={stat1}
                              onValueChange={(v) => field.onChange([v, stat2])}
                            >
                              <SelectTrigger className="w-28 text-lg font-bold">
                                <div className="flex items-center gap-1.5">
                                  <Star
                                    className={cn(
                                      "size-5 shrink-0",
                                      mutedIconClass
                                    )}
                                  />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="text-lg">
                                {STAT_TYPES.map((s) => (
                                  <SelectItem
                                    className="text-lg font-bold"
                                    key={s}
                                    value={s}
                                    disabled={s === stat2}
                                  >
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={stat2}
                              onValueChange={(v) => field.onChange([stat1, v])}
                            >
                              <SelectTrigger className="w-28 text-lg font-bold">
                                <div className="flex items-center gap-1.5">
                                  <Star
                                    className={cn(
                                      "size-5 shrink-0",
                                      mutedIconClass
                                    )}
                                  />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="text-lg">
                                {STAT_TYPES.map((s) => (
                                  <SelectItem
                                    className="text-lg font-bold"
                                    key={s}
                                    value={s}
                                    disabled={s === stat1}
                                  >
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <span className="font-bold">Hit Die</span>
                <div className="flex items-center gap-2">
                  <FormField
                    control={control}
                    name="hitDie"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-28 text-lg font-bold">
                              <div className="flex items-center gap-1">
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="text-lg">
                            {HIT_DIE_SIZES.map((die) => (
                              <SelectItem key={die} value={die}>
                                <div className="flex items-center gap-2">
                                  <DieFromNotation
                                    className="size-5 stroke-neutral-400 fill-none dark:stroke-neutral-500"
                                    die={die}
                                  />
                                  <span className="text-lg font-bold">
                                    {die}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <span className="font-bold">Starting HP</span>
                <FormField
                  control={control}
                  name="startingHp"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputGroup>
                          <InputGroupPrefix>
                            <Heart className={cn("size-5", mutedIconClass)} />
                          </InputGroupPrefix>
                          <Input
                            type="number"
                            min={1}
                            value={field.value}
                            onChange={(event) => {
                              const next = Number.parseInt(
                                event.target.value,
                                10
                              );
                              field.onChange(Number.isNaN(next) ? 0 : next);
                            }}
                            className="w-28 pl-8 text-center text-lg md:text-lg font-bold shadow-none focus-visible:ring-0"
                          />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-y-6 gap-x-8">
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-bold">Saves</span>
                <FormField
                  control={control}
                  name="saves"
                  render={({ field }) => {
                    const advStat =
                      STAT_TYPES.find((k) => field.value[k] === 1) ?? "none";
                    const disStat =
                      STAT_TYPES.find((k) => field.value[k] === -1) ?? "none";

                    const handleAdvChange = (newStat: string) => {
                      const newSaves = { ...field.value };
                      if (advStat !== "none") newSaves[advStat] = 0;
                      const matched = STAT_TYPES.find((s) => s === newStat);
                      if (matched) {
                        if (disStat === newStat) newSaves[matched] = 0;
                        newSaves[matched] = 1;
                      }
                      field.onChange(newSaves);
                    };

                    const handleDisChange = (newStat: string) => {
                      const newSaves = { ...field.value };
                      if (disStat !== "none") newSaves[disStat] = 0;
                      const matched = STAT_TYPES.find((s) => s === newStat);
                      if (matched) {
                        if (advStat === newStat) newSaves[matched] = 0;
                        newSaves[matched] = -1;
                      }
                      field.onChange(newSaves);
                    };

                    return (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Select
                                value={advStat}
                                onValueChange={handleAdvChange}
                              >
                                <SelectTrigger className="w-30 text-lg font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <ArrowBigUp
                                      className={cn(
                                        "size-5 shrink-0",
                                        mutedIconClass
                                      )}
                                    />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="text-lg">
                                  <SelectItem
                                    className="text-lg font-bold"
                                    value="none"
                                  >
                                    —
                                  </SelectItem>
                                  {STAT_TYPES.map((s) => (
                                    <SelectItem
                                      className="text-lg font-bold"
                                      key={s}
                                      value={s}
                                    >
                                      {s}+
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Select
                                value={disStat}
                                onValueChange={handleDisChange}
                              >
                                <SelectTrigger className="w-30 text-lg font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <ArrowBigDown
                                      className={cn(
                                        "size-5 shrink-0",
                                        mutedIconClass
                                      )}
                                    />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="text-lg">
                                  <SelectItem
                                    className="text-lg font-bold"
                                    value="none"
                                  >
                                    —
                                  </SelectItem>
                                  {STAT_TYPES.map((s) => (
                                    <SelectItem
                                      className="text-lg font-bold"
                                      key={s}
                                      value={s}
                                    >
                                      {s}–
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <span className="font-bold">Armor</span>
                <FormField
                  control={control}
                  name="armor"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormControl>
                        <MultiSelect
                          showSearch={false}
                          icon={
                            <Shield
                              className={cn("size-5 shrink-0", mutedIconClass)}
                            />
                          }
                          options={ARMOR_TYPES.map((armor) => ({
                            value: armor,
                            label:
                              armor.charAt(0).toUpperCase() + armor.slice(1),
                          }))}
                          selected={field.value}
                          displayValue={
                            field.value.length === 0
                              ? "None"
                              : ARMOR_TYPES.every((t) =>
                                    field.value.includes(t)
                                  )
                                ? "All"
                                : undefined
                          }
                          onChange={(values) =>
                            field.onChange(values as ArmorType[])
                          }
                          popoverClassName="w-52"
                          className="font-bold w-52"
                          itemClassName="text-lg font-bold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <span className="font-bold">Weapons</span>
                <FormField
                  control={control}
                  name="weapons"
                  render={({ field }) => {
                    const selected = field.value.map((spec) =>
                      "kind" in spec
                        ? spec.kind
                        : "type" in spec
                          ? spec.type
                          : spec.range
                    );
                    return (
                      <FormItem className="w-full">
                        <FormControl>
                          <MultiSelect
                            showSearch={false}
                            icon={
                              <Swords
                                className={cn(
                                  "size-5 shrink-0",
                                  mutedIconClass
                                )}
                              />
                            }
                            groups={[
                              {
                                label: "Kind",
                                options: [
                                  { value: "blade", label: "Blades" },
                                  { value: "stave", label: "Staves" },
                                  { value: "wand", label: "Wands" },
                                ],
                              },
                              {
                                label: "Type",
                                options: [
                                  { value: "STR", label: "STR" },
                                  { value: "DEX", label: "DEX" },
                                ],
                              },
                              {
                                label: "Range",
                                options: [
                                  { value: "melee", label: "Melee" },
                                  { value: "ranged", label: "Ranged" },
                                ],
                              },
                            ]}
                            selected={selected}
                            onChange={(values) =>
                              field.onChange(
                                values.flatMap(
                                  (v): z.infer<typeof weaponSpecSchema>[] => {
                                    if (
                                      v === "blade" ||
                                      v === "stave" ||
                                      v === "wand"
                                    )
                                      return [{ kind: v }];
                                    if (v === "STR" || v === "DEX")
                                      return [{ type: v }];
                                    if (v === "melee" || v === "ranged")
                                      return [{ range: v }];
                                    return [];
                                  }
                                )
                              )
                            }
                            placeholder="None"
                            popoverClassName="w-52"
                            className="text-lg font-bold w-52"
                            itemClassName="text-lg font-bold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 w-full">
            <span className="font-bold">Gear</span>
            <FormField
              control={control}
              name="startingGear"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <TagsInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Tabs defaultValue="levels" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="levels">Level Abilities</TabsTrigger>
            <TabsTrigger value="options">Class Options</TabsTrigger>
          </TabsList>
          <TabsContent value="levels">
            <EditableLevels control={control} levelFields={levelFields} />
          </TabsContent>
          <TabsContent value="options">
            <EditableOptions control={control} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EditableLevels({
  control,
  levelFields,
}: {
  control: Control<FormData>;
  levelFields: FieldArrayWithId<FormData, "levels">[];
}) {
  return (
    <div className="space-y-5">
      {levelFields.map((levelField, levelIndex) => (
        <EditableLevelCard
          key={levelField.id}
          control={control}
          levelIndex={levelIndex}
        />
      ))}
    </div>
  );
}

function EditableLevelCard({
  control,
  levelIndex,
}: {
  control: Control<FormData>;
  levelIndex: number;
}) {
  return (
    <div className="flex gap-5">
      <div className="w-12 text-right">
        <span className="font-stretch-condensed font-bold uppercase italic text-base text-muted-foreground">
          LVL {levelIndex + 1}
        </span>
      </div>
      <div className="flex-1">
        <EditableLevelAbilities
          control={control}
          name={`levels.${levelIndex}.abilities`}
        />
      </div>
    </div>
  );
}

function EditableOptions({ control }: { control: Control<FormData> }) {
  const {
    fields: listFields,
    append: appendList,
    remove: removeList,
  } = useFieldArray({
    control,
    name: "abilityLists",
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h5 className="font-stretch-condensed font-bold uppercase italic text-base text-muted-foreground">
          Class Options
        </h5>
      </div>
      {listFields.map((listField, listIndex) => (
        <div key={listField.id}>
          {listIndex > 0 && <Separator className="mb-5" />}
          <EditableOptionList
            control={control}
            listIndex={listIndex}
            onRemove={() => removeList(listIndex)}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          appendList({
            name: "",
            description: "",
            items: [{ name: "", description: "" }],
          })
        }
      >
        <Plus className="size-4" />
        Add Option List
      </Button>
    </div>
  );
}

function EditableOptionList({
  control,
  listIndex,
  onRemove,
}: {
  control: Control<FormData>;
  listIndex: number;
  onRemove: () => void;
}) {
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `abilityLists.${listIndex}.items`,
  });

  return (
    <div className="flex gap-5">
      <div className="flex-1 space-y-3">
        <div className="flex gap-2 items-end justify-between">
          <FormField
            control={control}
            name={`abilityLists.${listIndex}.name`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            aria-label="Remove option list"
            className="mb-0.5"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <FormField
          control={control}
          name={`abilityLists.${listIndex}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description
                <ConditionValidationIcon text={field.value} />
              </FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pl-4 space-y-3 border-l border-neutral-200 dark:border-neutral-700">
          <span className="text-sm font-medium text-muted-foreground">
            Options
          </span>
          {itemFields.map((itemField, itemIndex) => (
            <div key={itemField.id} className="flex flex-col gap-2">
              <div className="flex gap-2 items-end">
                <FormField
                  control={control}
                  name={`abilityLists.${listIndex}.items.${itemIndex}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {itemFields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(itemIndex)}
                    className="mb-0.5"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <FormField
                control={control}
                name={`abilityLists.${listIndex}.items.${itemIndex}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description
                      <ConditionValidationIcon text={field.value} />
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => appendItem({ name: "", description: "" })}
          >
            <Plus className="size-4" />
            Option
          </Button>
        </div>
      </div>
    </div>
  );
}
