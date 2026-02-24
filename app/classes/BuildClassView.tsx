"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigDown, ArrowBigUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  type Control,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import { ClassDetailView } from "@/app/ui/class/ClassDetailView";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ARMOR_TYPES,
  type Class,
  HIT_DIE_SIZES,
  STAT_TYPES,
  UNKNOWN_USER,
} from "@/lib/types";
import { getClassUrl } from "@/lib/utils/url";
import { createClass, updateClass } from "../actions/class";
import { getUserClassAbilityLists } from "../actions/classAbilityList";

const weaponSpecSchema = z.object({
  kind: z.array(z.enum(["blade", "stave", "wand"])),
  type: z.enum(["STR", "DEX"]).optional(),
  range: z.enum(["melee", "ranged"]).optional(),
});

const abilitySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Ability name is required"),
  description: z.string().min(1, "Ability description is required"),
});

const levelSchema = z.object({
  level: z.number(),
  abilities: z.array(abilitySchema),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  keyStats: z
    .array(z.enum(STAT_TYPES))
    .length(2, "Must select exactly 2 stats"),
  hitDie: z.enum(HIT_DIE_SIZES),
  startingHp: z.number().min(1),
  saves: z.object({
    STR: z.number(),
    DEX: z.number(),
    INT: z.number(),
    WIL: z.number(),
  }),
  armor: z.array(z.enum(ARMOR_TYPES)),
  weapons: weaponSpecSchema,
  startingGear: z.array(z.string()),
  levels: z.array(levelSchema),
  abilityListIds: z.array(z.string()),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

const EXAMPLE_CLASSES: Record<string, Omit<Class, "creator">> = {
  Empty: {
    visibility: "public",
    id: "",
    name: "",
    description: "",
    keyStats: [],
    hitDie: "d8",
    startingHp: 8,
    saves: { STR: 0, DEX: 0, INT: 0, WIL: 0 },
    armor: [],
    weapons: { kind: [], type: undefined, range: undefined },
    startingGear: [],
    levels: [],
    abilityLists: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  "The Cheat": {
    visibility: "public",
    id: "",
    name: "The Cheat",
    description: "Cloak and dagger…and dagger.",
    keyStats: ["DEX", "INT"],
    hitDie: "d6",
    startingHp: 10,
    saves: { STR: 0, DEX: 1, INT: 0, WIL: -1 },
    armor: ["leather"],
    weapons: { kind: ["blade"], type: "DEX", range: "melee" },
    startingGear: ["2 Daggers", "Sling", "Cheap Hides", "Chalk"],
    levels: [
      {
        level: 1,
        abilities: [
          {
            id: "1",
            name: "Sneak Attack",
            description: "(1/turn) When you crit, deal +1d6 damage.",
          },
          {
            id: "2",
            name: "Vicious Opportunist",
            description:
              "(1/turn) When you hit a [[Distracted]] target with a melee attack, you may change this Primary Die roll to whatever you like (changing it to the max value counts as a crit).",
          },
        ],
      },
      {
        level: 2,
        abilities: [
          {
            id: "",
            name: "Cheat",
            description:
              "You're a well-rounded cheater. Gain the following abilities:\n- (1/round) You may either Move or Hide for free.\n- (1/day) You may change any skill check to 10+INT\n- If you roll less than 10 on Initiative, you may change it to 10 instead.\n- You may gain advantage on skill checks while playing any games, competitions, or placing wagers. If you're caught though...",
          },
        ],
      },
      {
        level: 3,
        abilities: [
          {
            id: "1",
            name: "Subclass",
            description: "Choose a Cheat subclass.",
          },
          {
            id: "2",
            name: "Sneak Attack (2)",
            description: "Your Sneak Attack becomes 1d8.",
          },
          {
            id: "3",
            name: "Theives' Cant",
            description:
              "You learn the secret language of rogues and scoundrels.",
          },
        ],
      },
    ],
    abilityLists: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

interface BuildClassViewProps {
  classEntity?: Class;
}

export default function BuildClassView({ classEntity }: BuildClassViewProps) {
  const id = useId();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLists, setAvailableLists] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    async function fetchLists() {
      if (session?.user) {
        const result = await getUserClassAbilityLists();
        if (result.success) {
          setAvailableLists(result.lists);
        }
      }
    }
    fetchLists();
  }, [session]);

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
      weapons: classEntity?.weapons || {
        kind: [],
        type: undefined,
        range: undefined,
      },
      startingGear: classEntity?.startingGear || [],
      levels: classEntity?.levels || [
        {
          level: 1,
          abilities: [{ id: crypto.randomUUID(), name: "", description: "" }],
        },
      ],
      abilityListIds: classEntity?.abilityLists?.map((list) => list.id) || [],
      visibility: classEntity?.visibility || "public",
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

  const {
    fields: gearFields,
    append: appendGear,
    remove: removeGear,
  } = useFieldArray({
    control: form.control,
    name: "startingGear" as never,
  });

  const { watch } = form;
  const watchedValues = watch() as FormData;

  const creator = session?.user || UNKNOWN_USER;
  const previewClass = useMemo<Class>(() => {
    const selectedListIds = watchedValues.abilityListIds || [];
    const abilityLists =
      classEntity?.abilityLists?.filter((list) =>
        selectedListIds.includes(list.id)
      ) || [];

    return {
      id: classEntity?.id || "",
      name: watchedValues.name || "",
      description: watchedValues.description || "",
      keyStats: watchedValues.keyStats || [],
      hitDie: watchedValues.hitDie || "d8",
      startingHp: watchedValues.startingHp || 0,
      saves: watchedValues.saves || { STR: 0, DEX: 0, INT: 0, WIL: 0 },
      armor: watchedValues.armor || [],
      weapons: watchedValues.weapons || [],
      startingGear: watchedValues.startingGear || [],
      levels: watchedValues.levels || [],
      abilityLists,
      visibility: watchedValues.visibility,
      creator: creator,
      createdAt: classEntity?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }, [
    watchedValues,
    creator,
    classEntity?.id,
    classEntity?.createdAt,
    classEntity?.abilityLists,
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
        levels: data.levels,
        abilityListIds: data.abilityListIds,
        visibility: data.visibility,
      };

      const result = isEditing
        ? await updateClass(classEntity.id, payload)
        : await createClass(payload);

      if (result.success && result.class) {
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

  const loadExample = (exampleKey: string) => {
    const example = EXAMPLE_CLASSES[exampleKey];
    if (example) {
      form.reset({
        name: example.name,
        description: example.description,
        keyStats: example.keyStats,
        hitDie: example.hitDie,
        startingHp: example.startingHp,
        saves: example.saves,
        armor: example.armor,
        weapons: example.weapons,
        startingGear: example.startingGear,
        levels: example.levels,
        abilityListIds: [],
        visibility: example.visibility,
      });
    }
  };

  const addLevel = () => {
    const usedLevels = levelFields.map((field) => field.level);
    const maxUsedLevel = Math.max(...usedLevels, 0);
    const nextLevel = Math.min(maxUsedLevel + 1, 20);

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
        watchedValues.name || (classEntity?.id ? "Edit Class" : "New Class")
      }
      previewTitle="Class Preview"
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

              <div className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name="keyStats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Stats (Select 2)</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="multiple"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {STAT_TYPES.map((stat) => (
                            <ToggleGroupItem key={stat} value={stat}>
                              {stat}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hitDie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hit Die</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HIT_DIE_SIZES.map((die) => (
                            <SelectItem key={die} value={die}>
                              {die}
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
                  name="startingHp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting HP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                          className="w-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Saves</FormLabel>
                <div className="flex gap-2">
                  {STAT_TYPES.map((stat) => (
                    <FormField
                      key={stat}
                      control={form.control}
                      name={`saves.${stat}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="size-8"
                                onClick={(_v) =>
                                  field.onChange(field.value === -1 ? 0 : -1)
                                }
                              >
                                <ArrowBigDown
                                  className={
                                    field.value === -1 ? "fill-current" : ""
                                  }
                                />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">
                                {stat}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="size-8"
                                onClick={(_v) =>
                                  field.onChange(field.value === 1 ? 0 : 1)
                                }
                              >
                                <ArrowBigUp
                                  className={
                                    field.value === 1 ? "fill-current" : ""
                                  }
                                />
                              </Button>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="armor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Armor</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        className="justify-start"
                        type="multiple"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {ARMOR_TYPES.map((armor) => (
                          <ToggleGroupItem
                            key={armor}
                            value={armor}
                            className="capitalize"
                          >
                            {armor}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Weapons</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <FormField
                      control={form.control}
                      name="weapons.kind"
                      render={({ field }) => (
                        <ToggleGroup
                          className="justify-start"
                          type="multiple"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <ToggleGroupItem value="blade" className="capitalize">
                            Blades
                          </ToggleGroupItem>
                          <ToggleGroupItem value="stave" className="capitalize">
                            Staves
                          </ToggleGroupItem>
                          <ToggleGroupItem value="wand" className="capitalize">
                            Wands
                          </ToggleGroupItem>
                        </ToggleGroup>
                      )}
                    />
                  </FormControl>
                  <FormField
                    control={form.control}
                    name="weapons.type"
                    render={({ field }) => (
                      <ToggleGroup
                        className="justify-start"
                        type="single"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <ToggleGroupItem value="STR">STR</ToggleGroupItem>
                        <ToggleGroupItem value="DEX">DEX</ToggleGroupItem>
                      </ToggleGroup>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weapons.range"
                    render={({ field }) => (
                      <ToggleGroup
                        className="justify-start"
                        type="single"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <ToggleGroupItem value="melee" className="capitalize">
                          Melee
                        </ToggleGroupItem>
                        <ToggleGroupItem value="ranged" className="capitalize">
                          Ranged
                        </ToggleGroupItem>
                      </ToggleGroup>
                    )}
                  />
                  <FormMessage />
                </div>
              </FormItem>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Starting Gear</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendGear("")}
                  >
                    <Plus className="size-4" />
                    Add Item
                  </Button>
                </div>
                {gearFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`startingGear.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Item name" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGear(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Level Abilities</h3>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Class Options</FormLabel>
                  {process.env.NEXT_PUBLIC_ENABLE_CLASS_CREATION === "true" && (
                    <Link href="/class-options/new">
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="size-4" />
                        Create New
                      </Button>
                    </Link>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="abilityListIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MultiSelect
                          options={availableLists.map((list) => ({
                            value: list.id,
                            label: list.name,
                          }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select ability lists..."
                          emptyText="No lists available. Create one first."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-10 flex flex-row justify-between items-center my-4">
                <div className="flex items-center gap-2">
                  {session?.user.id && (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Saving..."
                        : classEntity?.id
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
                        id={`class-visibility-toggle-${id}`}
                        checked={field.value === "public"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "public" : "private")
                        }
                        entityType="Class"
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
          {!session?.user && (
            <div className="flex items-center gap-2 py-4">
              <DiscordLoginButton className="px-2 py-1" />
              {" to save"}
            </div>
          )}
        </>
      }
      previewContent={
        <ClassDetailView classEntity={previewClass} creator={creator} />
      }
      desktopPreviewContent={
        <>
          <ExampleLoader
            examples={EXAMPLE_CLASSES}
            onLoadExample={loadExample}
          />
          <div className="overflow-auto max-h-[calc(100vh-120px)] px-4">
            <ClassDetailView classEntity={previewClass} creator={creator} />
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
