"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  type Control,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import { subclassClassOptionsQueryOptions } from "@/app/subclasses/hooks";
import { Card } from "@/app/ui/subclass/Card";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
import { EditableLevelAbilities } from "@/components/app/EditableLevelAbilities";
import { ExampleLoader } from "@/components/app/ExampleLoader";
import { VisibilityToggle } from "@/components/app/VisibilityToggle";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, Card as UICard } from "@/components/ui/card";
import {
  Combobox,
  type ComboboxGroup,
  type ComboboxItem,
} from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { useClassDraft } from "@/lib/hooks/useClassDraft";
import { type Subclass, UNKNOWN_USER } from "@/lib/types";
import { randomUUID } from "@/lib/utils";
import { getSubclassUrl } from "@/lib/utils/url";
import { createSubclass, updateSubclass } from "../actions/subclass";

const abilitySchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    description: z.string(),
    actionType: z.enum(["ability", "action", "reaction", "passive"]).optional(),
    trigger: z.string().optional(),
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
  classId: z.string().nullable().optional(),
  className: z.string().min(1, "Class is required"),
  namePreface: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  levels: z.array(levelSchema),
  abilityLists: z.array(classOptionListSchema),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

const EXAMPLE_SUBCLASSES: Record<string, Omit<Subclass, "creator">> = {
  Empty: {
    visibility: "public",
    id: "",
    name: "",
    className: "Berserker",
    description: "",
    levels: [],
    abilityLists: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  "Path of the Red Mist": {
    visibility: "public",
    id: "",
    name: "Red Mist",
    className: "Berserker",
    description: "",
    levels: [
      {
        level: 3,
        abilities: [
          {
            id: "blood-frenzy",
            name: "Blood Frenzy",
            description:
              "(1/turn) While Raging, whenever you crit or kill an enemy, change 1 Fury Die to the maximum.",
          },
          {
            id: "savage-awareness",
            name: "Savage Awareness",
            description:
              "Advantage on Perception checks to notice or track down blood. Blindsight 2 while Raging: you ignore the [[Blinded]] condition and can see through darkness and Invisibility within that Range.",
          },
        ],
      },
      {
        level: 7,
        abilities: [
          {
            id: "unstoppable-brutality",
            name: "Unstoppable Brutality",
            description:
              "While Raging, you may gain 1 Wound to reroll any attack or save.",
          },
        ],
      },
      {
        level: 11,
        abilities: [
          {
            id: "opportunistic-frenzy",
            name: "Opportunistic Frenzy",
            description:
              "While Raging, you can make opportunity attacks without disadvantage, and you may make them whenever an enemy enters your melee weapon's reach.",
          },
        ],
      },
      {
        level: 15,
        abilities: [
          {
            id: "onslaught",
            name: "Onslaught",
            description:
              "While Raging, gain +2 speed. (1/round) you may move for free.",
          },
        ],
      },
    ],
    abilityLists: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

interface ClassComboboxItem extends ComboboxItem {
  subclassNamePreface: string;
  creatorImageUrl: string;
}

interface BuildSubclassViewProps {
  subclass?: Subclass;
}

export default function BuildSubclassView({
  subclass,
}: BuildSubclassViewProps) {
  const id = useId();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"preview" | "edit">("edit");
  const [classSearch, setClassSearch] = useState<string>("");
  const lastPrefaceFromClass = useRef<string>("");

  const { data: classOptions = [], isLoading: classSearchLoading } = useQuery(
    subclassClassOptionsQueryOptions(classSearch)
  );

  const classComboboxGroups = useMemo<
    ComboboxGroup<ClassComboboxItem>[]
  >(() => {
    const bucketOrder = ["owned", "official", "public"] as const;
    return bucketOrder.map((bucket) => ({
      items: classOptions
        .filter((c) => c.bucket === bucket)
        .map((c) => ({
          id: c.id,
          label: c.name,
          subclassNamePreface: c.subclassNamePreface,
          creatorImageUrl: c.creatorImageUrl,
        })),
    }));
  }, [classOptions]);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subclass?.name || "",
      classId: subclass?.classId || null,
      className: subclass?.className || "",
      namePreface: subclass?.namePreface || "",
      tagline: subclass?.tagline || "",
      description: subclass?.description || "",
      levels: [3, 7, 11, 15].map((level) => {
        const existing = subclass?.levels?.find((l) => l.level === level);
        return (
          existing ?? {
            level,
            abilities: [{ id: randomUUID(), name: "", description: "" }],
          }
        );
      }),
      abilityLists:
        subclass?.abilityLists?.map((l) => ({
          name: l.name,
          description: l.description || "",
          items: l.items.map((i) => ({
            name: i.name,
            description: i.description || "",
          })),
        })) || [],
      visibility: subclass?.visibility || "public",
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
    classId: subclass?.id ?? null,
    classUpdatedAt: subclass?.updatedAt,
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

  const watchedValues = useWatch({ control: form.control }) as FormData;

  const creator = session?.user || UNKNOWN_USER;
  const previewSubclass = useMemo<Subclass>(() => {
    return {
      id: subclass?.id || "",
      name: watchedValues.name || "",
      classId: watchedValues.classId || undefined,
      className: watchedValues.className || "",
      namePreface: watchedValues.namePreface || undefined,
      tagline: watchedValues.tagline || undefined,
      description: watchedValues.description || undefined,
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
        createdAt: subclass?.createdAt || new Date(),
        updatedAt: new Date(),
      })),
      visibility: watchedValues.visibility,
      creator: creator,
      createdAt: subclass?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }, [
    watchedValues.name,
    watchedValues.classId,
    watchedValues.className,
    watchedValues.namePreface,
    watchedValues.tagline,
    watchedValues.description,
    watchedValues.levels,
    watchedValues.abilityLists,
    watchedValues.visibility,
    creator,
    subclass?.id,
    subclass?.createdAt,
  ]);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!subclass?.id;

      const payload = {
        name: data.name.trim(),
        classId: data.classId || undefined,
        className: data.className,
        namePreface: data.namePreface?.trim() || undefined,
        tagline: data.tagline?.trim() || undefined,
        description: data.description?.trim() || undefined,
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
        ? await updateSubclass(subclass.id, payload)
        : await createSubclass(payload);

      if (result.success && result.subclass) {
        await deleteDraftOnSave();
        router.push(getSubclassUrl(result.subclass));
      } else {
        form.setError("root", {
          message:
            result.error ||
            `Failed to ${isEditing ? "update" : "create"} subclass`,
        });
      }
    } catch (error) {
      form.setError("root", {
        message: `Error ${subclass?.id ? "updating" : "creating"} subclass: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadExample = (exampleKey: string) => {
    const example = EXAMPLE_SUBCLASSES[exampleKey];
    if (example) {
      form.reset({
        name: example.name,
        className: example.className,
        description: example.description || "",
        levels: [3, 7, 11, 15].map((level) => {
          const existing = example.levels.find((l) => l.level === level);
          return (
            existing ?? {
              level,
              abilities: [{ id: randomUUID(), name: "", description: "" }],
            }
          );
        }),
        abilityLists: [],
        visibility: example.visibility,
      });
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
            {mode === "edit" && !subclass?.id && (
              <ExampleLoader
                examples={EXAMPLE_SUBCLASSES}
                onLoadExample={loadExample}
              />
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
            <Card
              subclass={previewSubclass}
              creator={creator}
              link={false}
              hideActions
            />
          ) : (
            <UICard>
              <CardHeader className="space-y-3">
                <FormField
                  control={form.control}
                  name="className"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Class</FormLabel>
                      <FormControl>
                        <Combobox<ClassComboboxItem>
                          groups={classComboboxGroups}
                          value={form.getValues("classId") || undefined}
                          onSelect={(item) => {
                            const currentPreface =
                              form.getValues("namePreface");
                            form.setValue("classId", item.id);
                            field.onChange(item.label);
                            if (
                              !currentPreface ||
                              currentPreface === lastPrefaceFromClass.current
                            ) {
                              form.setValue(
                                "namePreface",
                                item.subclassNamePreface
                              );
                            }
                            lastPrefaceFromClass.current =
                              item.subclassNamePreface;
                          }}
                          onSearch={setClassSearch}
                          renderItem={(item) => (
                            <span className="flex flex-1 items-center gap-2">
                              <Avatar className="size-5">
                                <AvatarImage src={item.creatorImageUrl} />
                              </Avatar>
                              {item.label}
                            </span>
                          )}
                          placeholder="Select a class"
                          searchPlaceholder="Search classes..."
                          emptyMessage="No classes found."
                          loading={classSearchLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="namePreface"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Preface</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
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
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tagline
                        <ConditionValidationIcon text={field.value} />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
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

                <div className="space-y-5">
                  {levelFields.map((levelField, levelIndex) => (
                    <SubclassLevelCard
                      key={levelField.id}
                      control={form.control}
                      levelIndex={levelIndex}
                    />
                  ))}
                </div>

                <EditableOptions control={form.control} />
              </CardContent>
            </UICard>
          )}
          <div className="flex items-center gap-3">
            <fieldset>
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <VisibilityToggle
                    id={`subclass-visibility-toggle-${id}`}
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
                    : subclass?.id
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
        {!form.formState.isValid && form.formState.isSubmitted && (
          <div className="text-destructive text-sm">
            Please fix the errors above before saving.
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

const SUBCLASS_LEVELS = [3, 7, 11, 15] as const;

function SubclassLevelCard({
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
          LVL {SUBCLASS_LEVELS[levelIndex]}
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
      {listFields.length > 0 && (
        <h5 className="font-stretch-condensed font-bold uppercase italic text-base text-muted-foreground">
          Class Options
        </h5>
      )}
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
