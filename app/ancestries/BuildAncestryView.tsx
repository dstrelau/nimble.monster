"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/app/ui/ancestry/Card";
import { SourceSelect } from "@/app/ui/create/SourceSelect";
import { BuildView } from "@/components/app/BuildView";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Ancestry } from "@/lib/services/ancestries";
import { RARITIES, SIZES } from "@/lib/services/ancestries";
import { UNKNOWN_USER } from "@/lib/types";
import { createAncestry, updateAncestry } from "../actions/ancestry";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  size: z
    .array(z.enum(["tiny", "small", "medium", "large", "huge", "gargantuan"]))
    .min(1, "At least one size is required"),
  rarity: z.enum(["common", "exotic"]),
  abilities: z.array(
    z.object({
      name: z.string().min(1, "Ability name is required"),
      description: z.string().min(1, "Ability description is required"),
    })
  ),
  sourceId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BuildAncestryViewProps {
  ancestry?: Ancestry;
}

export default function BuildAncestryView({
  ancestry,
}: BuildAncestryViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ancestry?.name || "",
      description: ancestry?.description || "",
      size: ancestry?.size || ["medium"],
      rarity: ancestry?.rarity || "common",
      abilities: ancestry
        ? ancestry.abilities
        : [{ name: "", description: "" }],
      sourceId: ancestry?.source?.id || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  const { watch } = form;
  const watchedValues = watch();

  const creator = session?.user || UNKNOWN_USER;
  const previewAncestry = useMemo<Ancestry>(
    () => ({
      id: ancestry?.id || "",
      name: watchedValues.name || "",
      description: watchedValues.description || "",
      size: watchedValues.size,
      rarity: watchedValues.rarity,
      abilities: watchedValues.abilities || [],
      creator: creator,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [
      watchedValues.name,
      watchedValues.description,
      watchedValues.size,
      watchedValues.rarity,
      watchedValues.abilities,
      creator,
      ancestry?.id,
    ]
  );

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!ancestry?.id;
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        size: data.size,
        rarity: data.rarity,
        abilities: data.abilities.map((a) => ({
          name: a.name.trim(),
          description: a.description.trim(),
        })),
        sourceId:
          data.sourceId && data.sourceId !== "none" ? data.sourceId : undefined,
      };
      const result = isEditing
        ? await updateAncestry(ancestry.id, payload)
        : await createAncestry(payload);

      if (result.success && result.ancestry) {
        router.push(`/ancestries/${result.ancestry.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BuildView
      entityName={
        watchedValues.name || (ancestry?.id ? "Edit Ancestry" : "New Ancestry")
      }
      previewTitle="Ancestry Preview"
      previewContent={<Card ancestry={previewAncestry} />}
      desktopPreviewContent={<Card ancestry={previewAncestry} />}
      formClassName="col-span-6 md:col-span-4"
      previewClassName="hidden md:block md:col-span-2"
      formContent={
        <>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-wrap items-baseline gap-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-sm">
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
                name="size"
                render={({ field }) => (
                  <FormItem className="min-w-36">
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={
                          SIZES as unknown as typeof SIZES &
                            { value: string; label: string }[]
                        }
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rarity</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                      >
                        {RARITIES.map((rarity) => (
                          <ToggleGroupItem
                            key={rarity.value}
                            value={rarity.value}
                          >
                            {rarity.label}
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
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Description
                      <ConditionValidationIcon text={field.value} />
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Abilities</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => append({ name: "", description: "" })}
                  >
                    <Plus className="size-4" />
                    Add Ability
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="w-full flex justify-center items-end gap-4">
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.name`}
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
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-4" />
                        Ability
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name={`abilities.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Description
                            <ConditionValidationIcon text={field.value} />
                          </FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              <div className="flex-1 flex items-baseline justify-between">
                <FormField
                  control={form.control}
                  name="sourceId"
                  render={({ field }) => (
                    <FormItem>
                      <SourceSelect
                        source={field.value ? { id: field.value } : undefined}
                        onChange={(source) => field.onChange(source?.id || "")}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {session?.user && (
                  <Button
                    className="self-end"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : ancestry
                        ? "Update"
                        : "Create"}
                  </Button>
                )}
              </div>
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
    />
  );
}
