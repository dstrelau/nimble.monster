"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drama,
  HandFist,
  HeartHandshake,
  Scroll,
  Shield,
  WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCollection } from "@/app/actions/collection";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Goblin } from "@/components/icons/goblin";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Ancestry } from "@/lib/services/ancestries";
import type { AncestryMini } from "@/lib/services/ancestries/types";
import type { Background } from "@/lib/services/backgrounds";
import type { BackgroundMini } from "@/lib/services/backgrounds/types";
import type { Item, ItemMini } from "@/lib/services/items";
import type { Monster, MonsterMini } from "@/lib/services/monsters";
import type {
  Collection,
  Companion,
  CompanionMini,
  SpellSchool,
  SpellSchoolMini,
  Subclass,
  SubclassMini,
} from "@/lib/types";
import { UNKNOWN_USER } from "@/lib/types";
import { getCollectionUrl } from "@/lib/utils/url";
import { CollectionCard } from "../ui/CollectionCard";
import { updateCollection } from "./[id]/edit/actions";
import { VisibilityToggle } from "./[id]/edit/VisibilityToggle";
import { SelectableAncestryGrid } from "./SelectableAncestryGrid";
import { SelectableBackgroundGrid } from "./SelectableBackgroundGrid";
import { SelectableCompanionGrid } from "./SelectableCompanionGrid";
import { SelectableItemGrid } from "./SelectableItemGrid";
import { SelectableMonsterGrid } from "./SelectableMonsterGrid";
import { SelectableSpellSchoolGrid } from "./SelectableSpellSchoolGrid";
import { SelectableSubclassGrid } from "./SelectableSubclassGrid";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  collection: Collection;
  onSubmit?: (
    data: FormData & { monsters: MonsterMini[]; items: ItemMini[] }
  ) => Promise<void>;
  isCreating?: boolean;
  submitLabel?: string;
}

export function CreateEditCollection({
  collection,
  onSubmit,
  isCreating = false,
  submitLabel = "Save",
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const [selectedMonsters, setSelectedMonsters] = useState<
    Map<string, Monster | MonsterMini>
  >(() => new Map(collection.monsters.map((m) => [m.id, m])));

  const [selectedItems, setSelectedItems] = useState<
    Map<string, Item | ItemMini>
  >(() => new Map(collection.items.map((i) => [i.id, i])));

  const selectedMonsterIds = useMemo(
    () => new Set(selectedMonsters.keys()),
    [selectedMonsters]
  );
  const selectedItemIds = useMemo(
    () => new Set(selectedItems.keys()),
    [selectedItems]
  );

  const currentMonsters = useMemo(
    () => [...selectedMonsters.values()] as MonsterMini[],
    [selectedMonsters]
  );
  const currentItems = useMemo(
    () => [...selectedItems.values()] as ItemMini[],
    [selectedItems]
  );

  const handleMonsterToggle = (monster: Monster) => {
    setSelectedMonsters((prev) => {
      const next = new Map(prev);
      if (next.has(monster.id)) {
        next.delete(monster.id);
      } else {
        next.set(monster.id, monster);
      }
      return next;
    });
  };

  const handleItemToggle = (item: Item) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });
  };

  const [selectedCompanions, setSelectedCompanions] = useState<
    Map<string, Companion | CompanionMini>
  >(() => new Map((collection.companions ?? []).map((c) => [c.id, c])));
  const [selectedAncestries, setSelectedAncestries] = useState<
    Map<string, Ancestry | AncestryMini>
  >(() => new Map((collection.ancestries ?? []).map((a) => [a.id, a])));
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<
    Map<string, Background | BackgroundMini>
  >(() => new Map((collection.backgrounds ?? []).map((b) => [b.id, b])));
  const [selectedSubclasses, setSelectedSubclasses] = useState<
    Map<string, Subclass | SubclassMini>
  >(() => new Map((collection.subclasses ?? []).map((s) => [s.id, s])));
  const [selectedSpellSchools, setSelectedSpellSchools] = useState<
    Map<string, SpellSchool | SpellSchoolMini>
  >(() => new Map((collection.spellSchools ?? []).map((s) => [s.id, s])));

  const selectedCompanionIds = useMemo(
    () => new Set(selectedCompanions.keys()),
    [selectedCompanions]
  );
  const selectedAncestryIds = useMemo(
    () => new Set(selectedAncestries.keys()),
    [selectedAncestries]
  );
  const selectedBackgroundIds = useMemo(
    () => new Set(selectedBackgrounds.keys()),
    [selectedBackgrounds]
  );
  const selectedSubclassIds = useMemo(
    () => new Set(selectedSubclasses.keys()),
    [selectedSubclasses]
  );
  const selectedSpellSchoolIds = useMemo(
    () => new Set(selectedSpellSchools.keys()),
    [selectedSpellSchools]
  );

  const currentCompanions = useMemo(
    () => [...selectedCompanions.values()] as CompanionMini[],
    [selectedCompanions]
  );
  const currentAncestries = useMemo(
    () => [...selectedAncestries.values()] as AncestryMini[],
    [selectedAncestries]
  );
  const currentBackgrounds = useMemo(
    () => [...selectedBackgrounds.values()] as BackgroundMini[],
    [selectedBackgrounds]
  );
  const currentSubclasses = useMemo(
    () => [...selectedSubclasses.values()] as SubclassMini[],
    [selectedSubclasses]
  );
  const currentSpellSchools = useMemo(
    () => [...selectedSpellSchools.values()] as SpellSchoolMini[],
    [selectedSpellSchools]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection.name,
      description: collection.description || "",
      visibility: collection.visibility,
    },
  });

  const { watch } = form;
  const watchedValues = watch();

  const arraysEqual = (a: string[], b: string[]) =>
    JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

  const isDirty = isCreating
    ? watchedValues.name.trim() !== ""
    : watchedValues.name !== collection.name ||
      watchedValues.description !== (collection.description || "") ||
      watchedValues.visibility !== collection.visibility ||
      !arraysEqual(
        [...selectedMonsterIds],
        collection.monsters.map((m) => m.id)
      ) ||
      !arraysEqual(
        [...selectedItemIds],
        collection.items.map((i) => i.id)
      ) ||
      !arraysEqual(
        [...selectedCompanionIds],
        (collection.companions ?? []).map((c) => c.id)
      ) ||
      !arraysEqual(
        [...selectedAncestryIds],
        (collection.ancestries ?? []).map((a) => a.id)
      ) ||
      !arraysEqual(
        [...selectedBackgroundIds],
        (collection.backgrounds ?? []).map((b) => b.id)
      ) ||
      !arraysEqual(
        [...selectedSubclassIds],
        (collection.subclasses ?? []).map((s) => s.id)
      ) ||
      !arraysEqual(
        [...selectedSpellSchoolIds],
        (collection.spellSchools ?? []).map((s) => s.id)
      );

  const handleSubmit = async (data: FormData) => {
    if (onSubmit) {
      await onSubmit({
        ...data,
        monsters: currentMonsters,
        items: currentItems,
      });
      return;
    }

    if (isCreating) {
      const result = await createCollection({
        name: data.name,
        visibility: data.visibility,
        description: data.description || undefined,
      });

      if (result.success && result.collection) {
        const updateFormData = new FormData();
        updateFormData.append("name", data.name);
        updateFormData.append("visibility", data.visibility);
        updateFormData.append("description", data.description || "");
        updateFormData.append(
          "monsterIds",
          JSON.stringify(currentMonsters.map((m) => m.id))
        );
        updateFormData.append(
          "itemIds",
          JSON.stringify(currentItems.map((i) => i.id))
        );
        updateFormData.append(
          "companionIds",
          JSON.stringify(currentCompanions.map((c) => c.id))
        );
        updateFormData.append(
          "ancestryIds",
          JSON.stringify(currentAncestries.map((a) => a.id))
        );
        updateFormData.append(
          "backgroundIds",
          JSON.stringify(currentBackgrounds.map((b) => b.id))
        );
        updateFormData.append(
          "subclassIds",
          JSON.stringify(currentSubclasses.map((s) => s.id))
        );
        updateFormData.append(
          "spellSchoolIds",
          JSON.stringify(currentSpellSchools.map((s) => s.id))
        );

        const updateResult = await updateCollection(
          result.collection.id,
          updateFormData
        );
        if (!updateResult.success) {
          form.setError("root", {
            message: "Failed to add content to collection",
          });
          return;
        }
        router.push(getCollectionUrl(result.collection));
      } else {
        form.setError("root", {
          message: result.error || "Failed to create collection",
        });
      }
    } else {
      const updateFormData = new FormData();
      updateFormData.append("name", data.name);
      updateFormData.append("visibility", data.visibility);
      updateFormData.append("description", data.description || "");
      updateFormData.append(
        "monsterIds",
        JSON.stringify(currentMonsters.map((m) => m.id))
      );
      updateFormData.append(
        "itemIds",
        JSON.stringify(currentItems.map((i) => i.id))
      );
      updateFormData.append(
        "companionIds",
        JSON.stringify(currentCompanions.map((c) => c.id))
      );
      updateFormData.append(
        "ancestryIds",
        JSON.stringify(currentAncestries.map((a) => a.id))
      );
      updateFormData.append(
        "backgroundIds",
        JSON.stringify(currentBackgrounds.map((b) => b.id))
      );
      updateFormData.append(
        "subclassIds",
        JSON.stringify(currentSubclasses.map((s) => s.id))
      );
      updateFormData.append(
        "spellSchoolIds",
        JSON.stringify(currentSpellSchools.map((s) => s.id))
      );

      try {
        await updateCollection(collection.id, updateFormData);
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error
              ? error.message
              : "Failed to update collection",
        });
      }
    }
  };

  const makeToggle = <T extends { id: string }>(
    setter: React.Dispatch<React.SetStateAction<Map<string, T>>>
  ) => {
    return (entity: T) => {
      setter((prev) => {
        const next = new Map(prev);
        if (next.has(entity.id)) {
          next.delete(entity.id);
        } else {
          next.set(entity.id, entity);
        }
        return next;
      });
    };
  };

  const handleCompanionToggle = makeToggle(setSelectedCompanions);
  const handleAncestryToggle = makeToggle(setSelectedAncestries);
  const handleBackgroundToggle = makeToggle(setSelectedBackgrounds);
  const handleSubclassToggle = makeToggle(setSelectedSubclasses);
  const handleSpellSchoolToggle = makeToggle(setSelectedSpellSchools);

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

            <Separator />
            <Tabs defaultValue="companions">
              <div className="flex flex-col gap-1">
                <TabsList className="grid grid-cols-3 h-auto w-full">
                  <TabsTrigger className="text-md" value="companions">
                    <HeartHandshake className="size-5" />
                    Companions
                  </TabsTrigger>
                  <TabsTrigger className="text-md" value="monsters">
                    <Goblin className="size-5" />
                    Monsters
                  </TabsTrigger>
                  <TabsTrigger className="text-md" value="items">
                    <Shield className="size-5" />
                    Items
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-4 h-auto w-full">
                  <TabsTrigger className="text-md" value="ancestries">
                    <Scroll className="size-5" />
                    Ancestries
                  </TabsTrigger>
                  <TabsTrigger className="text-md" value="backgrounds">
                    <Drama className="size-5" />
                    Backgrounds
                  </TabsTrigger>
                  <TabsTrigger className="text-md" value="subclasses">
                    <HandFist className="size-5" />
                    Subclasses
                  </TabsTrigger>
                  <TabsTrigger className="text-md" value="spellSchools">
                    <WandSparkles className="size-5" />
                    Spells
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="monsters"
                className="flex flex-col gap-4 grow-2"
              >
                <SelectableMonsterGrid
                  selectedIds={selectedMonsterIds}
                  onToggle={handleMonsterToggle}
                />
              </TabsContent>

              <TabsContent value="items" className="flex flex-col gap-4 grow-2">
                <SelectableItemGrid
                  selectedIds={selectedItemIds}
                  onToggle={handleItemToggle}
                />
              </TabsContent>

              <TabsContent
                value="companions"
                className="flex flex-col gap-4 grow-2"
              >
                <SelectableCompanionGrid
                  selectedIds={selectedCompanionIds}
                  onToggle={handleCompanionToggle}
                />
              </TabsContent>

              <TabsContent
                value="ancestries"
                className="flex flex-col gap-4 grow-2"
              >
                <SelectableAncestryGrid
                  selectedIds={selectedAncestryIds}
                  onToggle={handleAncestryToggle}
                />
              </TabsContent>

              <TabsContent
                value="backgrounds"
                className="flex flex-col gap-4 grow-2"
              >
                <SelectableBackgroundGrid
                  selectedIds={selectedBackgroundIds}
                  onToggle={handleBackgroundToggle}
                />
              </TabsContent>

              <TabsContent
                value="subclasses"
                className="flex flex-col gap-4 grow-2"
              >
                <SelectableSubclassGrid
                  selectedIds={selectedSubclassIds}
                  onToggle={handleSubclassToggle}
                />
              </TabsContent>

              <TabsContent
                value="spellSchools"
                className="flex flex-col gap-4 grow-2"
              >
                <SelectableSpellSchoolGrid
                  selectedIds={selectedSpellSchoolIds}
                  onToggle={handleSpellSchoolToggle}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden sm:block min-w-sm">
            <CollectionCard
              collection={{
                ...collection,
                name: watchedValues.name,
                monsters: currentMonsters,
                items: currentItems,
                companions: currentCompanions,
                ancestries: currentAncestries,
                backgrounds: currentBackgrounds,
                subclasses: currentSubclasses,
                spellSchools: currentSpellSchools,
                creator: session?.user || UNKNOWN_USER,
              }}
              limit={Infinity}
              onRemoveMonsterAction={(id) =>
                setSelectedMonsters((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
              onRemoveItemAction={(id) =>
                setSelectedItems((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
              onRemoveCompanionAction={(id) =>
                setSelectedCompanions((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
              onRemoveAncestryAction={(id) =>
                setSelectedAncestries((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
              onRemoveBackgroundAction={(id) =>
                setSelectedBackgrounds((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
              onRemoveSubclassAction={(id) =>
                setSelectedSubclasses((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
              onRemoveSpellSchoolAction={(id) =>
                setSelectedSpellSchools((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
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
