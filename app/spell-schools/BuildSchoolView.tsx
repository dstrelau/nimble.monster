"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/app/ui/school/Card";
import { BuildView } from "@/components/app/BuildView";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { type SpellSchool, UNKNOWN_USER } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSpellSchoolUrl } from "@/lib/utils/url";
import { createSpellSchool, updateSpellSchool } from "../spell-schools/actions";

// Helper functions for target type display
function getTargetTypeDisplay(
  type: "self" | "single" | "single+" | "multi" | "aoe" | "special"
): string {
  const map = {
    self: "Self",
    single: "Single Target",
    "single+": "Single Target+",
    multi: "Multi-Target",
    aoe: "AoE",
    special: "Special",
  };
  return map[type];
}

function getTargetTypeValue(
  display: string
): "self" | "single" | "single+" | "multi" | "aoe" | "special" {
  const map: Record<
    string,
    "self" | "single" | "single+" | "multi" | "aoe" | "special"
  > = {
    Self: "self",
    "Single Target": "single",
    "Single Target+": "single+",
    "Multi-Target": "multi",
    AoE: "aoe",
    Special: "special",
  };
  return map[display] || "single";
}

const spellSchema = z.object({
  id: z.union([z.enum([""]), z.uuid()]),
  name: z.string().min(1, "Spell name is required"),
  tier: z.number().min(0).max(9),
  actions: z.coerce.number().max(10),
  reaction: z.boolean(),
  target: z
    .union([
      z.object({ type: z.literal("self") }),
      z.object({
        type: z.enum(["single", "single+", "multi", "special"]),
        kind: z.enum(["range", "reach"]),
        distance: z.coerce.number().min(0).optional(),
      }),
      z.object({
        type: z.literal("aoe"),
        kind: z.enum(["range", "reach", "line", "cone"]),
        distance: z.coerce.number().min(0).optional(),
      }),
    ])
    .optional(),
  damage: z.string().optional(),
  description: z.string().min(1, "Spell description is required"),
  highLevels: z.string().optional(),
  concentration: z.string().optional(),
  upcast: z.string().optional(),
});

const formSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  name: z.string().min(1, "School name is required"),
  description: z.string().optional(),
  spells: z.array(spellSchema).min(1, "At least one spell is required"),
  visibility: z.enum(["public", "private"]),
});

type FormValues = z.infer<typeof formSchema>;

interface BuildSchoolViewProps {
  existingSchool?: SpellSchool;
}

export default function BuildSchoolView({
  existingSchool,
}: BuildSchoolViewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<
    z.input<typeof formSchema>,
    // biome-ignore lint/suspicious/noExplicitAny: unused Context
    any,
    z.output<typeof formSchema>
  >({
    mode: "onChange",
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      id: existingSchool?.id ?? "",
      name: existingSchool?.name ?? "",
      description: existingSchool?.description ?? "",
      spells: existingSchool?.spells.map((spell) => ({
        id: spell.id,
        name: spell.name,
        tier: spell.tier,
        actions: spell.actions,
        reaction: spell.reaction || false,
        target: spell.target,
        damage: spell.damage || "",
        description: spell.description,
        highLevels: spell.highLevels || "",
        concentration: spell.concentration || "",
        upcast: spell.upcast || "",
      })),
      visibility: existingSchool?.visibility ?? "public",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "spells",
  });

  const watchedValues = form.watch();

  let previewSchool: SpellSchool;
  try {
    const spells = (watchedValues.spells || []).map((spell) => ({
      id: spell?.id || crypto.randomUUID(),
      schoolId: "",
      name: spell?.name || "",
      tier: spell?.tier ?? 0,
      actions: Number(spell?.actions) || 1,
      reaction: spell?.reaction || false,
      target: spell?.target
        ? {
            ...spell.target,
            distance:
              spell.target.type !== "self" &&
              spell.target.distance !== undefined
                ? Number(spell.target.distance)
                : undefined,
          }
        : undefined,
      damage: spell?.damage,
      description: spell?.description || "",
      highLevels: spell?.highLevels,
      concentration: spell?.concentration,
      upcast: spell?.upcast,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    previewSchool = {
      id: watchedValues.id || crypto.randomUUID(),
      name: watchedValues.name || "Untitled School",
      description: watchedValues.description || undefined,
      visibility: watchedValues.visibility,
      spells: spells.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
      }),
      creator: existingSchool?.creator || session?.user || UNKNOWN_USER,
      createdAt: existingSchool?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  } catch {
    previewSchool = {
      id: crypto.randomUUID(),
      name: "Untitled School",
      description: undefined,
      visibility: "public",
      spells: [],
      creator: session?.user || UNKNOWN_USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const addSpell = () => {
    append({
      id: crypto.randomUUID(),
      name: "",
      tier: 0,
      actions: 1,
      reaction: false,
      target: { type: "single", kind: "range", distance: 0 },
      damage: "",
      description: "",
      highLevels: "",
      concentration: "",
      upcast: "",
    });
  };

  const onSubmit = async (data: FormValues) => {
    console.log(data.spells);
    setIsSubmitting(true);
    setError(null);

    try {
      const result = existingSchool
        ? await updateSpellSchool(existingSchool.id, data)
        : await createSpellSchool(data);

      if (result.success && result.spellSchool) {
        router.push(getSpellSchoolUrl(result.spellSchool));
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return <DiscordLoginButton />;
  }

  return (
    <BuildView
      entityName={existingSchool ? "Edit Spell School" : "Create Spell School"}
      previewTitle={previewSchool.name}
      previewContent={<Card spellSchool={previewSchool} link={false} />}
      formClassName={cn("col-span-6 md:col-span-3")}
      previewClassName={cn("hidden md:block md:col-span-3")}
      formContent={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Name</FormLabel>
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
                    <Textarea className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Spells</h3>
                <Button type="button" onClick={addSpell} size="sm">
                  <Plus className="size-4" />
                  Add Spell
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex flex-wrap justify-start items-end gap-4">
                    <div className="w-full flex justify-center items-end gap-4">
                      <FormField
                        control={form.control}
                        name={`spells.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1 min-w-48">
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
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-4" />
                        Spell
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name={`spells.${index}.tier`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tier</FormLabel>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="min-w-32">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Cantrip</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="7">7</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`spells.${index}.target.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target</FormLabel>
                          <FormControl>
                            <Select
                              value={
                                field.value
                                  ? getTargetTypeDisplay(field.value)
                                  : "Single Target"
                              }
                              onValueChange={(value) => {
                                const newType = getTargetTypeValue(value);
                                field.onChange(newType);
                              }}
                            >
                              <SelectTrigger className="min-w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Self">Self</SelectItem>
                                <SelectItem value="Single Target">
                                  Single Target
                                </SelectItem>
                                <SelectItem value="Single Target+">
                                  Single Target+
                                </SelectItem>
                                <SelectItem value="Multi-Target">
                                  Multi-Target
                                </SelectItem>
                                <SelectItem value="AoE">AoE</SelectItem>
                                <SelectItem value="special">Special</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`spells.${index}.actions`}
                      render={({ field }) => (
                        <FormItem className="w-24 min-w-24">
                          <FormLabel>Actions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              className="mb-2"
                              value={field.value as number}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`spells.${index}.reaction`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col py-2">
                          <FormLabel className="pb-1">Reaction</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              size="default"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`spells.${index}.concentration`}
                      render={({ field }) => (
                        <FormItem className="flex-1 mb-2 min-w-48">
                          <FormLabel>Concentration</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-wrap items-end gap-4">
                      <FormField
                        control={form.control}
                        name={`spells.${index}.target.kind`}
                        render={({ field }) => {
                          const targetType = form.watch(
                            `spells.${index}.target.type`
                          );
                          const isSelf = targetType === "self";
                          const isAoe = targetType === "aoe";

                          return (
                            <FormItem>
                              <FormControl>
                                <Select
                                  value={field.value || "range"}
                                  onValueChange={field.onChange}
                                  disabled={isSelf}
                                >
                                  <SelectTrigger className="min-w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="range">Range</SelectItem>
                                    <SelectItem value="reach">Reach</SelectItem>
                                    {isAoe && (
                                      <>
                                        <SelectItem value="line">
                                          Line
                                        </SelectItem>
                                        <SelectItem value="cone">
                                          Cone
                                        </SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name={`spells.${index}.target.distance`}
                        render={({ field }) => {
                          const targetType = form.watch(
                            `spells.${index}.target.type`
                          );
                          const isSelf = targetType === "self";

                          return (
                            <FormItem className="flex-1 min-w-24">
                              <FormControl>
                                <Input
                                  type="number"
                                  value={
                                    isSelf
                                      ? ""
                                      : typeof field.value === "number"
                                        ? field.value
                                        : ""
                                  }
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="w-24 mb-2"
                                  disabled={isSelf}
                                />
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`spells.${index}.damage`}
                      render={({ field }) => (
                        <FormItem className="flex-1 mb-2">
                          <FormLabel>Damage</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name={`spells.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-16" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`spells.${index}.highLevels`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>High Levels</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`spells.${index}.upcast`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Upcast</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Visibility</FormLabel>
                  <FormControl>
                    <VisibilityToggle
                      id={`school-visibility-toggle-${watchedValues.id}`}
                      checked={field.value === "public"}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? "public" : "private")
                      }
                      entityType="Subclass"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <strong>Error:</strong> {error}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? existingSchool
                  ? "Updating..."
                  : "Creating..."
                : existingSchool
                  ? "Update School"
                  : "Create School"}
            </Button>
          </form>
        </Form>
      }
      desktopPreviewContent={<Card spellSchool={previewSchool} link={false} />}
    />
  );
}
