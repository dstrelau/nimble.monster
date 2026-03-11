"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useId, useMemo, useRef, useState } from "react";
import {
  type Control,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import { subclassClassOptionsQueryOptions } from "@/app/subclasses/hooks";
import { Card } from "@/app/ui/subclass/Card";
import { BuildView } from "@/components/app/BuildView";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
import { EditableLevelAbilities } from "@/components/app/EditableLevelAbilities";
import { ExampleLoader } from "@/components/app/ExampleLoader";
import { VisibilityToggle } from "@/components/app/VisibilityToggle";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
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

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  classId: z.string().nullable().optional(),
  className: z.string().min(1, "Class is required"),
  namePreface: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  levels: z.array(levelSchema),
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

      visibility: subclass?.visibility || "public",
    },
  });

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
      abilityLists: subclass?.abilityLists || [],
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
    watchedValues.visibility,
    creator,
    subclass?.id,
    subclass?.createdAt,
    subclass?.abilityLists,
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
        visibility: data.visibility,
      };
      const result = isEditing
        ? await updateSubclass(subclass.id, payload)
        : await createSubclass(payload);

      if (result.success && result.subclass) {
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
        visibility: example.visibility,
      });
    }
  };

  return (
    <BuildView
      entityName={
        watchedValues.name || (subclass?.id ? "Edit Subclass" : "New Subclass")
      }
      previewTitle="Subclass Preview"
      formClassName="md:col-span-3"
      previewClassName="md:col-span-3"
      formContent={
        <>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="className"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <Combobox<ClassComboboxItem>
                        groups={classComboboxGroups}
                        value={form.getValues("classId") || undefined}
                        onSelect={(item) => {
                          const currentPreface = form.getValues("namePreface");
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

              <div className="flex flex-wrap gap-4">
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

              <div className="mt-10 flex flex-row justify-between items-center my-4">
                <div className="flex items-center gap-2">
                  {session?.user.id && (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Saving..."
                        : subclass?.id
                          ? "Update"
                          : "Save"}
                    </Button>
                  )}
                </div>
                <fieldset className="space-y-2">
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
            </form>
          </Form>
          {!session?.user && (
            <div className="flex items-center gap-2 py-4">
              <DiscordLoginButton className="px-2 py-1" />
              {" to save"}
            </div>
          )}
        </>
      }
      previewContent={
        <Card
          subclass={previewSubclass}
          creator={creator}
          link={false}
          hideActions
        />
      }
      desktopPreviewContent={
        <>
          <ExampleLoader
            examples={EXAMPLE_SUBCLASSES}
            onLoadExample={loadExample}
          />
          <div className="overflow-auto max-h-[calc(100vh-120px)] px-4">
            <Card
              subclass={previewSubclass}
              creator={creator}
              link={false}
              hideActions
            />
          </div>
        </>
      }
    />
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
