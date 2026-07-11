"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createEncounter } from "@/app/actions/encounter";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { Card as MonsterCard } from "@/components/monster/Card";
import { SelectableMonsterGrid } from "@/components/monster/SelectableMonsterGrid";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Toggle } from "@/components/ui/toggle";
import type { Monster } from "@/lib/services/monsters";
import type { Encounter, EncounterMonsterEntryFull } from "@/lib/types";
import { cn, monstersSortedByLevelInt } from "@/lib/utils";
import { monsterLevelValue } from "@/lib/utils/monster";
import { getEncounterUrl } from "@/lib/utils/url";
import { updateEncounter } from "./[id]/edit/actions";
import { EncounterStatsPanel } from "./EncounterStatsPanel";

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

function EditableMonsterCard({
  entry,
  heroCount,
  onRemove,
  onQuantityChange,
  onIsPerHeroToggle,
}: {
  entry: EncounterMonsterEntryFull;
  heroCount: number;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onIsPerHeroToggle: (id: string, isPerHero: boolean) => void;
}) {
  const { monster, quantity, isPerHero } = entry;
  const resolvedQuantity = isPerHero ? quantity * heroCount : quantity;
  const totalLevels = Number(
    (monsterLevelValue(monster.levelInt) * resolvedQuantity).toFixed(2)
  );
  const perMonsterHp =
    monster.hpPerHero != null ? monster.hpPerHero * heroCount : monster.hp;
  const totalHp = perMonsterHp * resolvedQuantity;

  return (
    <div className={cn(monster.legendary && "sm:col-span-2")}>
      <div className="flex items-center justify-between gap-2 rounded-t-xl bg-header px-3 py-2 font-slab text-header-foreground">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onRemove(monster.id)}
          >
            <X />
            <span className="sr-only">Remove {monster.name}</span>
          </Button>
          <Input
            type="number"
            min={1}
            className="h-8 w-16 bg-background text-center font-sans not-italic tabular-nums"
            value={quantity}
            onChange={(e) =>
              onQuantityChange(monster.id, Math.max(1, Number(e.target.value)))
            }
          />
          <Toggle
            size="sm"
            variant="outline"
            pressed={isPerHero}
            onPressedChange={(pressed) =>
              onIsPerHeroToggle(monster.id, pressed)
            }
            className="bg-background font-sans not-italic"
          >
            /hero
          </Toggle>
        </div>
        <div className="whitespace-nowrap text-sm tabular-nums">
          Total: {totalLevels} levels, {totalHp} hp
        </div>
      </div>
      <MonsterCard
        monster={monster}
        creator={monster.creator}
        className="rounded-t-none"
      />
    </div>
  );
}

export function CreateEditEncounter({
  encounter,
  isCreating = false,
  submitLabel = "Save",
}: Props) {
  const router = useRouter();

  const [selectedMonsters, setSelectedMonsters] = useState<
    Map<string, EncounterMonsterEntryFull>
  >(() => new Map(encounter.monsters.map((e) => [e.monster.id, e])));
  const [monstersSectionOpen, setMonstersSectionOpen] = useState(
    () => encounter.monsters.length === 0
  );

  const selectedMonsterIds = useMemo(
    () => new Set(selectedMonsters.keys()),
    [selectedMonsters]
  );

  const currentEntries = useMemo(
    () => [...selectedMonsters.values()],
    [selectedMonsters]
  );

  const sortedEntries = useMemo(() => {
    const sortedMonsters = monstersSortedByLevelInt(
      currentEntries.map((e) => e.monster)
    );
    return sortedMonsters.map(
      (monster) =>
        currentEntries.find((e) => e.monster.id === monster.id) ?? null
    );
  }, [currentEntries]);

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
    a: EncounterMonsterEntryFull[],
    b: EncounterMonsterEntryFull[]
  ) => {
    const normalize = (entries: EncounterMonsterEntryFull[]) =>
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

  const liveEncounter: Encounter = {
    ...encounter,
    heroCount: watchedValues.heroCount,
    heroLevel: watchedValues.heroLevel,
    monsters: currentEntries,
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex justify-between gap-4">
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
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <VisibilityToggle
                    id="encounter-visibility-toggle"
                    checked={field.value === "public"}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? "public" : "private")
                    }
                  />
                )}
              />
              <Button type="submit" disabled={!isDirty}>
                {isCreating ? "Create" : submitLabel}
              </Button>
            </div>
          </div>

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
        </div>

        {form.formState.errors.root && (
          <div className="mb-4 text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:col-span-2">
            {sortedEntries.length === 0 ? (
              <p className="col-span-full rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                No monsters yet. Add some below.
              </p>
            ) : (
              sortedEntries.map((entry) =>
                entry ? (
                  <EditableMonsterCard
                    key={entry.monster.id}
                    entry={entry}
                    heroCount={watchedValues.heroCount}
                    onRemove={handleRemoveMonster}
                    onQuantityChange={handleQuantityChange}
                    onIsPerHeroToggle={handleIsPerHeroToggle}
                  />
                ) : null
              )
            )}
          </div>
          <div className="flex flex-col gap-6 lg:sticky lg:top-4 lg:col-span-1">
            <EncounterStatsPanel
              encounter={liveEncounter}
              onHeroCountChange={(value) =>
                form.setValue("heroCount", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onHeroLevelChange={(value) =>
                form.setValue("heroLevel", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />

            <Card className="gap-2 py-3">
              <Collapsible
                open={monstersSectionOpen}
                onOpenChange={setMonstersSectionOpen}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
                  <CardHeader className="w-full flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 font-condensed font-bold text-xl">
                      <ChevronRight
                        className={cn(
                          "size-5 shrink-0 transition-transform",
                          monstersSectionOpen && "rotate-90"
                        )}
                      />
                      Add Monsters
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-1">
                    <SelectableMonsterGrid
                      selectedIds={selectedMonsterIds}
                      onToggle={handleMonsterToggle}
                      compact
                    />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
