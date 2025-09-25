"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useId, useMemo, useState } from "react";
import {
  type Control,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import { Card } from "@/app/ui/subclass/Card";
import { BuildView } from "@/components/app/BuildView";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
import { ExampleLoader } from "@/components/app/ExampleLoader";
import { VisibilityToggle } from "@/components/app/VisibilityToggle";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  SUBCLASS_CLASSES,
  SUBCLASS_NAME_PREFIXES,
  type Subclass,
  type SubclassClass,
  UNKNOWN_USER,
} from "@/lib/types";
import { createSubclass, updateSubclass } from "../actions/subclass";

const abilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Ability name is required"),
  description: z.string().min(1, "Ability description is required"),
  actionType: z.enum(["ability", "action", "reaction", "passive"]).optional(),
  trigger: z.string().optional(),
});

const levelSchema = z.object({
  level: z.number(),
  abilities: z.array(abilitySchema),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  className: z.enum(
    SUBCLASS_CLASSES.map((cls) => cls.value) as [
      SubclassClass,
      ...SubclassClass[],
    ]
  ),
  namePreface: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  levels: z.array(levelSchema),
  visibility: z.enum(["public", "private"]).default("public"),
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
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subclass?.name || "",
      className: subclass?.className || "Berserker",
      namePreface:
        subclass?.namePreface ||
        (subclass?.className
          ? SUBCLASS_NAME_PREFIXES[subclass.className]
          : SUBCLASS_NAME_PREFIXES.Berserker),
      tagline: subclass?.tagline || "",
      description: subclass?.description || "",
      levels: subclass?.levels || [{ level: 3, abilities: [] }],
      visibility: subclass?.visibility || "public",
    },
  });

  const {
    fields: levelFields,
    append: appendLevel,
    remove: removeLevel,
  } = useFieldArray({
    control: form.control,
    name: "levels",
  });

  const { watch } = form;
  const watchedValues = watch() as FormData;

  const creator = session?.user || UNKNOWN_USER;
  const previewSubclass = useMemo<Subclass>(
    () => ({
      id: subclass?.id || "",
      name: watchedValues.name || "",
      className: watchedValues.className || ("" as SubclassClass),
      namePreface: watchedValues.namePreface || undefined,
      tagline: watchedValues.tagline || undefined,
      description: watchedValues.description || undefined,
      levels: watchedValues.levels || [],
      visibility: watchedValues.visibility,
      creator: creator,
      createdAt: subclass?.createdAt || new Date(),
      updatedAt: new Date(),
    }),
    [
      watchedValues.name,
      watchedValues.className,
      watchedValues.namePreface,
      watchedValues.tagline,
      watchedValues.description,
      watchedValues.levels,
      watchedValues.visibility,
      creator,
      subclass?.id,
      subclass?.createdAt,
    ]
  );

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!subclass?.id;
      const processedLevels = data.levels;

      const payload = {
        name: data.name.trim(),
        className: data.className,
        namePreface: data.namePreface?.trim() || undefined,
        tagline: data.tagline?.trim() || undefined,
        description: data.description?.trim() || undefined,
        levels: processedLevels,
        visibility: data.visibility,
      };
      const result = isEditing
        ? await updateSubclass(subclass.id, payload)
        : await createSubclass(payload);

      if (result.success && result.subclass) {
        router.push(`/subclasses/${result.subclass.id}`);
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
      const processedLevels = example.levels;

      form.reset({
        name: example.name,
        className: example.className as FormData["className"],
        description: example.description || "",
        levels: processedLevels,
        visibility: example.visibility,
      });
    }
  };

  const addLevel = () => {
    // select the next default level after the max used level
    const defaultLevels = [3, 7, 11, 15] as const;
    const usedLevels = levelFields.map((field) => field.level);
    const maxUsedLevel = Math.max(...usedLevels, 0);
    const nextDefaultLevel = defaultLevels.find(
      (level) => level > maxUsedLevel
    );
    const nextLevel = nextDefaultLevel || Math.min(maxUsedLevel + 1, 20);

    appendLevel({
      level: nextLevel,
      abilities: [
        {
          id: crypto.randomUUID(),
          name: "",
          description: "",
        },
      ],
    });
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="className"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const currentNamePreface =
                          form.getValues("namePreface");
                        const previousClassName = field.value;
                        const previousDefaultPrefix =
                          SUBCLASS_NAME_PREFIXES[
                            previousClassName as keyof typeof SUBCLASS_NAME_PREFIXES
                          ];

                        field.onChange(value);

                        // Auto-set namePreface based on class if field is empty or matches previous default
                        const defaultPrefix =
                          SUBCLASS_NAME_PREFIXES[
                            value as keyof typeof SUBCLASS_NAME_PREFIXES
                          ];
                        if (
                          !currentNamePreface ||
                          currentNamePreface === previousDefaultPrefix
                        ) {
                          form.setValue("namePreface", defaultPrefix);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUBCLASS_CLASSES.map((classOption) => (
                          <SelectItem
                            key={classOption.value}
                            value={classOption.value}
                          >
                            {classOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="namePreface"
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
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
                  <FormLabel>Tagline</FormLabel>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Levels</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLevel}
                  disabled={levelFields.length >= 20}
                >
                  <Plus className="size-4" />
                  Add Level
                </Button>
              </div>

              {levelFields.map((levelField, levelIndex) => (
                <div
                  key={levelField.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <LevelAbilitiesForm
                    control={form.control}
                    levelIndex={levelIndex}
                    removeLevel={removeLevel}
                  />
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-row justify-between items-center my-4">
              <div className="flex items-center gap-2">
                {session?.user.id ? (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : subclass?.id
                        ? "Update"
                        : "Save"}
                  </Button>
                ) : (
                  <>
                    <DiscordLoginButton className="px-2 py-1" />
                    {" to save"}
                  </>
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
                      entityType="Subclass"
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
          </form>
        </Form>
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

interface LevelAbilitiesFormProps {
  control: Control<FormData>;
  levelIndex: number;
  removeLevel: (index: number) => void;
}

function LevelAbilitiesForm({
  control,
  levelIndex,
  removeLevel,
}: LevelAbilitiesFormProps) {
  const {
    fields: abilityFields,
    remove: removeAbility,
    append: appendAbility,
  } = useFieldArray({
    control,
    name: `levels.${levelIndex}.abilities`,
  });

  const allLevels = useWatch({ control, name: "levels" }) || [];
  const usedLevels = allLevels
    .map((level: { level: number }, index: number) =>
      index === levelIndex ? null : level?.level
    )
    .filter((level: number | null) => level !== null) as number[];

  const addAbility = () => {
    appendAbility({
      id: crypto.randomUUID(),
      name: "",
      description: "",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <FormField
          control={control}
          name={`levels.${levelIndex}.level`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-18">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => (
                    <SelectItem
                      key={level}
                      value={String(level)}
                      disabled={usedLevels.includes(level)}
                    >
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAbility}
          >
            <Plus className="size-4" />
            Add Ability
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeLevel(levelIndex)}
          >
            <Trash2 className="size-4" />
            Level
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {abilityFields.map((abilityField, abilityIndex) => (
          <div key={abilityField.id}>
            {abilityIndex > 0 && <hr className="my-4" />}
            <div className="space-y-3">
              <div className="flex gap-2 items-end justify-between">
                <FormField
                  control={control}
                  name={`levels.${levelIndex}.abilities.${abilityIndex}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input className="min-w-56" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {abilityFields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAbility(abilityIndex)}
                    className="mb-0.5"
                  >
                    <Trash2 className="size-4" />
                    Ability
                  </Button>
                )}
              </div>

              <FormField
                control={control}
                name={`levels.${levelIndex}.abilities.${abilityIndex}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-18" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
