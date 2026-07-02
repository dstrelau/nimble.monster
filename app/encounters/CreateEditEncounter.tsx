"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createEncounter } from "@/app/actions/encounter";
import { VisibilityToggle } from "@/app/collections/[id]/edit/VisibilityToggle";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { EncounterCard } from "@/components/encounter/EncounterCard";
import { SelectableMonsterGrid } from "@/components/monster/SelectableMonsterGrid";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Monster } from "@/lib/services/monsters";
import {
  type Encounter,
  type EncounterMonsterEntry,
  UNKNOWN_USER,
} from "@/lib/types";
import { getEncounterUrl } from "@/lib/utils/url";
import { updateEncounter } from "./[id]/edit/actions";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  heroCount: z.number().int().min(1, "Hero count must be at least 1"),
  heroLevel: z
    .number()
    .int()
    .min(1, "Hero level must be at least 1")
    .max(20, "Hero level must be at most 20"),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  encounter: Encounter;
  isCreating?: boolean;
  submitLabel?: string;
}

export function CreateEditEncounter({
  encounter,
  isCreating = false,
  submitLabel = "Save",
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const [selectedMonsters, setSelectedMonsters] = useState<
    Map<string, EncounterMonsterEntry>
  >(() => new Map(encounter.monsters.map((e) => [e.monster.id, e])));

  const selectedMonsterIds = useMemo(
    () => new Set(selectedMonsters.keys()),
    [selectedMonsters]
  );

  const currentEntries = useMemo(
    () => [...selectedMonsters.values()],
    [selectedMonsters]
  );

  const handleMonsterToggle = (monster: Monster) => {
    setSelectedMonsters((prev) => {
      const next = new Map(prev);
      if (next.has(monster.id)) {
        next.delete(monster.id);
      } else {
        next.set(monster.id, { monster, quantity: 1, isPerHero: false });
      }
      return next;
    });
  };

  const handleQuantityChange = (monsterId: string, quantity: number) => {
    setSelectedMonsters((prev) => {
      const entry = prev.get(monsterId);
      if (!entry) return prev;
      const next = new Map(prev);
      next.set(monsterId, { ...entry, quantity: Math.max(1, quantity) });
      return next;
    });
  };

  const handleIsPerHeroToggle = (monsterId: string, isPerHero: boolean) => {
    setSelectedMonsters((prev) => {
      const entry = prev.get(monsterId);
      if (!entry) return prev;
      const next = new Map(prev);
      next.set(monsterId, { ...entry, isPerHero });
      return next;
    });
  };

  const handleRemoveMonster = (monsterId: string) => {
    setSelectedMonsters((prev) => {
      const next = new Map(prev);
      next.delete(monsterId);
      return next;
    });
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: encounter.name,
      description: encounter.description || "",
      visibility: encounter.visibility,
      heroCount: encounter.heroCount,
      heroLevel: encounter.heroLevel,
    },
  });

  const { watch } = form;
  const watchedValues = watch();

  const entriesEqual = (
    a: EncounterMonsterEntry[],
    b: EncounterMonsterEntry[]
  ) => {
    const normalize = (entries: EncounterMonsterEntry[]) =>
      JSON.stringify(
        [...entries]
          .map((e) => ({
            monsterId: e.monster.id,
            quantity: e.quantity,
            isPerHero: e.isPerHero,
          }))
          .sort((x, y) => x.monsterId.localeCompare(y.monsterId))
      );
    return normalize(a) === normalize(b);
  };

  const isDirty = isCreating
    ? watchedValues.name.trim() !== ""
    : watchedValues.name !== encounter.name ||
      watchedValues.description !== (encounter.description || "") ||
      watchedValues.visibility !== encounter.visibility ||
      watchedValues.heroCount !== encounter.heroCount ||
      watchedValues.heroLevel !== encounter.heroLevel ||
      !entriesEqual(currentEntries, encounter.monsters);

  const handleSubmit = async (data: FormData) => {
    if (isCreating) {
      const result = await createEncounter({
        name: data.name,
        visibility: data.visibility,
        description: data.description || undefined,
        heroCount: data.heroCount,
        heroLevel: data.heroLevel,
      });

      if (result.success && result.encounter) {
        const updateFormData = new FormData();
        updateFormData.append("name", data.name);
        updateFormData.append("visibility", data.visibility);
        updateFormData.append("description", data.description || "");
        updateFormData.append("heroCount", String(data.heroCount));
        updateFormData.append("heroLevel", String(data.heroLevel));
        updateFormData.append(
          "monsters",
          JSON.stringify(
            currentEntries.map((e) => ({
              monsterId: e.monster.id,
              quantity: e.quantity,
              isPerHero: e.isPerHero,
            }))
          )
        );

        const updateResult = await updateEncounter(
          result.encounter.id,
          updateFormData
        );
        if (!updateResult.success) {
          form.setError("root", {
            message: "Failed to add monsters to encounter",
          });
          return;
        }
        router.push(getEncounterUrl(result.encounter));
      } else {
        form.setError("root", {
          message: result.error || "Failed to create encounter",
        });
      }
    } else {
      const updateFormData = new FormData();
      updateFormData.append("name", data.name);
      updateFormData.append("visibility", data.visibility);
      updateFormData.append("description", data.description || "");
      updateFormData.append("heroCount", String(data.heroCount));
      updateFormData.append("heroLevel", String(data.heroLevel));
      updateFormData.append(
        "monsters",
        JSON.stringify(
          currentEntries.map((e) => ({
            monsterId: e.monster.id,
            quantity: e.quantity,
            isPerHero: e.isPerHero,
          }))
        )
      );

      try {
        await updateEncounter(encounter.id, updateFormData);
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error
              ? error.message
              : "Failed to update encounter",
        });
      }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="flex justify-between grow-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    className="w-full md:w-80"
                    placeholder="Name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={!isDirty}>
            {isCreating ? "Create" : submitLabel}
          </Button>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col gap-4 grow">
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
                    <Textarea
                      className="w-full"
                      placeholder="Description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 items-start">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <VisibilityToggle
                    value={field.value}
                    onChangeAction={field.onChange}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="heroCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heroes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heroLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="w-20"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <SelectableMonsterGrid
              selectedIds={selectedMonsterIds}
              onToggle={handleMonsterToggle}
            />
          </div>

          <div className="hidden sm:block min-w-sm">
            <EncounterCard
              encounter={{
                ...encounter,
                name: watchedValues.name,
                heroCount: watchedValues.heroCount,
                heroLevel: watchedValues.heroLevel,
                monsters: currentEntries,
                creator: session?.user || UNKNOWN_USER,
              }}
              limit={Infinity}
              onRemoveMonsterAction={handleRemoveMonster}
              onQuantityChangeAction={handleQuantityChange}
              onIsPerHeroToggleAction={handleIsPerHeroToggle}
            />
          </div>
        </div>

        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
      </form>
    </Form>
  );
}
