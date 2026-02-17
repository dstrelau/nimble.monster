"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Drama,
  Gem,
  Ghost,
  HandFist,
  HeartHandshake,
  PersonStanding,
  Scroll,
  SlidersHorizontal,
  Square,
  SquareCheck,
  User as UserIcon,
  WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCollection } from "@/app/actions/collection";
import { searchPublicMonsters } from "@/app/actions/monster";
import { List as ItemList } from "@/app/ui/item/List";
import { List } from "@/app/ui/monster/List";
import { SortSelect } from "@/components/app/SortSelect";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type { Ancestry } from "@/lib/services/ancestries";
import type { AncestryMini } from "@/lib/services/ancestries/types";
import type { Background } from "@/lib/services/backgrounds";
import type { BackgroundMini } from "@/lib/services/backgrounds/types";
import type { Item, ItemMini, ItemRarityFilter } from "@/lib/services/items";
import { RARITIES } from "@/lib/services/items";
import { searchPublicItems } from "@/lib/services/items/repository";
import type { Monster, MonsterMini, TypeFilter } from "@/lib/services/monsters";
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
import { SearchInput } from "../ui/SearchInput";
import { updateCollection } from "./[id]/edit/actions";
import { VisibilityToggle } from "./[id]/edit/VisibilityToggle";
import { SelectableAncestryGrid } from "./SelectableAncestryGrid";
import { SelectableBackgroundGrid } from "./SelectableBackgroundGrid";
import { SelectableCompanionGrid } from "./SelectableCompanionGrid";
import { SelectableSpellSchoolGrid } from "./SelectableSpellSchoolGrid";
import { SelectableSubclassGrid } from "./SelectableSubclassGrid";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

type SortOption =
  | "name-asc"
  | "name-desc"
  | "level-asc"
  | "level-desc"
  | "hp-asc"
  | "hp-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A→Z)" },
  { value: "name-desc", label: "Name (Z→A)" },
  { value: "level-asc", label: "Level (Low→High)" },
  { value: "level-desc", label: "Level (High→Low)" },
  { value: "hp-asc", label: "HP (Low→High)" },
  { value: "hp-desc", label: "HP (High→Low)" },
];

interface Props {
  collection: Collection;
  myMonsters?: Monster[];
  myItems?: Item[];
  onSubmit?: (
    data: FormData & { monsters: MonsterMini[]; items: ItemMini[] }
  ) => Promise<void>;
  isCreating?: boolean;
  submitLabel?: string;
}

export function CreateEditCollection({
  collection,
  myMonsters = [],
  myItems = [],
  onSubmit,
  isCreating = false,
  submitLabel = "Save",
}: Props) {
  const router = useRouter();
  const [currentMonsters, setCurrentMonsters] = useState<MonsterMini[]>(
    collection.monsters
  );
  const [currentItems, setCurrentItems] = useState<ItemMini[]>(
    collection.items
  );
  const { data: session } = useSession();
  const [onlyMine, setOnlyMine] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  // Item-specific state
  const [onlyMineItems, setOnlyMineItems] = useState<boolean>(true);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState<ItemRarityFilter>("all");

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
        currentMonsters.map((m) => m.id),
        collection.monsters.map((m) => m.id)
      ) ||
      !arraysEqual(
        currentItems.map((i) => i.id),
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

    // Default submit handler
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

  let creatorId: string | undefined;
  if (onlyMine) {
    creatorId = session?.user?.discordId;
  }

  let itemCreatorId: string | undefined;
  if (onlyMineItems) {
    itemCreatorId = session?.user?.discordId;
  }

  const monstersQuery = useQuery({
    queryKey: ["publicMonsters", searchTerm, typeFilter, sortOption, creatorId],
    queryFn: async () => {
      const [sortBy, sortDirection] = sortOption.split("-") as [
        "name" | "level" | "hp",
        "asc" | "desc",
      ];

      return searchPublicMonsters({
        searchTerm: searchTerm,
        type: typeFilter,
        creatorId,
        sortBy,
        sortDirection,
        limit: 50,
      });
    },
    staleTime: 10000,
  });

  const availableMonsters: MonsterMini[] = monstersQuery.data?.monsters || [];

  const itemsQuery = useQuery({
    queryKey: ["items", itemSearchTerm, rarityFilter, itemCreatorId],
    queryFn: () =>
      searchPublicItems({
        searchTerm: itemSearchTerm,
        rarity: rarityFilter,
        creatorId: itemCreatorId,
        sortBy: "name",
        sortDirection: "asc",
        limit: 50,
      }),
    staleTime: 10000,
  });

  const availableItems: ItemMini[] = itemsQuery.data || [];

  const handleMonsterCheck = (id: string) => {
    const isInCollection = currentMonsters.some((m) => m.id === id);
    if (isInCollection) {
      setCurrentMonsters((prev) => prev.filter((m) => m.id !== id));
    } else {
      const clicked =
        myMonsters.find((m) => m.id === id) ||
        availableMonsters.find((m) => m.id === id);
      if (clicked) {
        setCurrentMonsters((prev) =>
          [...prev, clicked].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    }
  };

  const handleItemCheck = (id: string) => {
    const isInCollection = currentItems.some((i) => i.id === id);
    if (isInCollection) {
      setCurrentItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      const clicked =
        myItems.find((i) => i.id === id) ||
        availableItems.find((i) => i.id === id);
      if (clicked) {
        setCurrentItems((prev) =>
          [...prev, clicked].sort((a, b) => a.name.localeCompare(b.name))
        );
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
                    <Ghost className="size-5" />
                    Monsters
                  </TabsTrigger>
                  <TabsTrigger className="text-md" value="items">
                    <Gem className="size-5" />
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
                <div className="flex gap-3 items-center">
                  <SearchInput
                    className="grow"
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search monsters"
                  />
                  <SortSelect
                    items={SORT_OPTIONS}
                    value={sortOption}
                    onChange={setSortOption}
                  />
                </div>

                <div className="flex gap-4">
                  <Toggle
                    variant="outline"
                    aria-label="Toggle Only My Monsters"
                    pressed={onlyMine}
                    onPressedChange={setOnlyMine}
                  >
                    {onlyMine ? <SquareCheck /> : <Square />}
                    Only My Monsters
                  </Toggle>

                  <Select
                    defaultValue="all"
                    onValueChange={(s: TypeFilter) => setTypeFilter(s)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Monsters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <SlidersHorizontal />
                        All Monsters
                      </SelectItem>
                      <SelectItem
                        value="standard"
                        aria-label="Standard monsters"
                      >
                        <UserIcon />
                        Standard
                      </SelectItem>
                      <SelectItem
                        value="legendary"
                        aria-label="Legendary monsters"
                      >
                        <Crown />
                        Legendary
                      </SelectItem>
                      <SelectItem value="minion" aria-label="Minions">
                        <PersonStanding />
                        Minions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-x-8">
                  <div>
                    {monstersQuery.isLoading ? (
                      <div className="p-4 text-center">Searching...</div>
                    ) : (monstersQuery.data?.monsters?.length ?? 0) === 0 ? (
                      <div className="p-4 text-center">No monsters found</div>
                    ) : (
                      <List
                        monsters={availableMonsters}
                        selectedIds={currentMonsters.map((m) => m.id)}
                        handleMonsterClick={handleMonsterCheck}
                        showChecks={true}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="items" className="flex flex-col gap-4 grow-2">
                <div className="flex gap-3 items-center">
                  <SearchInput
                    className="grow"
                    value={itemSearchTerm}
                    onChange={setItemSearchTerm}
                    placeholder="Search items"
                  />
                </div>

                <div className="flex gap-4">
                  <Toggle
                    variant="outline"
                    aria-label="Toggle Only My Items"
                    pressed={onlyMineItems}
                    onPressedChange={setOnlyMineItems}
                  >
                    {onlyMineItems ? <SquareCheck /> : <Square />}
                    Only My Items
                  </Toggle>

                  <Select
                    defaultValue="all"
                    onValueChange={(s: ItemRarityFilter) => setRarityFilter(s)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Rarities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <SlidersHorizontal />
                        All Rarities
                      </SelectItem>
                      {RARITIES.map((rarity) => (
                        <SelectItem key={rarity.value} value={rarity.value}>
                          {rarity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-x-8">
                  <div>
                    {itemsQuery.isLoading ? (
                      <div className="p-4 text-center">Searching...</div>
                    ) : (itemsQuery.data?.length ?? 0) === 0 ? (
                      <div className="p-4 text-center">No items found</div>
                    ) : (
                      <ItemList
                        items={availableItems}
                        selectedIds={currentItems.map((i) => i.id)}
                        handleItemClick={handleItemCheck}
                        showChecks={true}
                      />
                    )}
                  </div>
                </div>
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

          <div className="hidden sm:block min-w-xs">
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
              limit={5}
              onRemoveMonsterAction={(id) =>
                setCurrentMonsters((prev) => prev.filter((m) => m.id !== id))
              }
              onRemoveItemAction={(id) =>
                setCurrentItems((prev) => prev.filter((i) => i.id !== id))
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
