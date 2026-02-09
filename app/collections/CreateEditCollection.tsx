"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Crown,
  Dog,
  Layers,
  PersonStanding,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Square,
  SquareCheck,
  Swords,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createCollection,
  searchAncestriesAction,
  searchBackgroundsAction,
  searchCompanionsAction,
  searchSpellSchoolsAction,
} from "@/app/actions/collection";
import { searchPublicMonsters } from "@/app/actions/monster";
import { searchPublicSubclasses } from "@/app/actions/subclass";
import { List as AncestryList } from "@/app/ui/ancestry/List";
import { List as BackgroundList } from "@/app/ui/background/List";
import { List as CompanionList } from "@/app/ui/companion/List";
import { List as ItemList } from "@/app/ui/item/List";
import { List } from "@/app/ui/monster/List";
import { List as SchoolList } from "@/app/ui/school/List";
import { List as SubclassList } from "@/app/ui/subclass/List";
import { SortSelect } from "@/components/app/SortSelect";
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
import type { AncestryMini } from "@/lib/services/ancestries/types";
import type { BackgroundMini } from "@/lib/services/backgrounds/types";
import type { Item, ItemMini, ItemRarityFilter } from "@/lib/services/items";
import { RARITIES } from "@/lib/services/items";
import { searchPublicItems } from "@/lib/services/items/repository";
import type { Monster, MonsterMini, TypeFilter } from "@/lib/services/monsters";
import type {
  Collection,
  CompanionMini,
  SpellSchoolMini,
  SubclassMini,
} from "@/lib/types";
import { UNKNOWN_USER } from "@/lib/types";
import { getCollectionUrl } from "@/lib/utils/url";
import { CollectionCard } from "../ui/CollectionCard";
import { SearchInput } from "../ui/SearchInput";
import { updateCollection } from "./[id]/edit/actions";
import { VisibilityToggle } from "./[id]/edit/VisibilityToggle";

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
  myMonsters: Monster[];
  myItems?: Item[];
  onSubmit?: (
    data: FormData & { monsters: MonsterMini[]; items: ItemMini[] }
  ) => Promise<void>;
  isCreating?: boolean;
  submitLabel?: string;
}

export function CreateEditCollection({
  collection,
  myMonsters,
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
  const [currentCompanions, setCurrentCompanions] = useState<CompanionMini[]>(
    collection.companions ?? []
  );
  const [currentAncestries, setCurrentAncestries] = useState<AncestryMini[]>(
    collection.ancestries ?? []
  );
  const [currentBackgrounds, setCurrentBackgrounds] = useState<
    BackgroundMini[]
  >(collection.backgrounds ?? []);
  const [currentSubclasses, setCurrentSubclasses] = useState<SubclassMini[]>(
    collection.subclasses ?? []
  );
  const [currentSpellSchools, setCurrentSpellSchools] = useState<
    SpellSchoolMini[]
  >(collection.spellSchools ?? []);

  const { data: session } = useSession();
  const [onlyMine, setOnlyMine] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  // Item-specific state
  const [onlyMineItems, setOnlyMineItems] = useState<boolean>(true);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState<ItemRarityFilter>("all");

  // New tab states
  const [companionSearch, setCompanionSearch] = useState("");
  const [onlyMineCompanions, setOnlyMineCompanions] = useState(true);
  const [ancestrySearch, setAncestrySearch] = useState("");
  const [onlyMineAncestries, setOnlyMineAncestries] = useState(true);
  const [backgroundSearch, setBackgroundSearch] = useState("");
  const [onlyMineBackgrounds, setOnlyMineBackgrounds] = useState(true);
  const [subclassSearch, setSubclassSearch] = useState("");
  const [onlyMineSubclasses, setOnlyMineSubclasses] = useState(true);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [onlyMineSchools, setOnlyMineSchools] = useState(true);

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
        currentCompanions.map((c) => c.id),
        (collection.companions ?? []).map((c) => c.id)
      ) ||
      !arraysEqual(
        currentAncestries.map((a) => a.id),
        (collection.ancestries ?? []).map((a) => a.id)
      ) ||
      !arraysEqual(
        currentBackgrounds.map((b) => b.id),
        (collection.backgrounds ?? []).map((b) => b.id)
      ) ||
      !arraysEqual(
        currentSubclasses.map((s) => s.id),
        (collection.subclasses ?? []).map((s) => s.id)
      ) ||
      !arraysEqual(
        currentSpellSchools.map((s) => s.id),
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

        await updateCollection(result.collection.id, updateFormData);
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

  const companionCreatorId = onlyMineCompanions
    ? session?.user?.discordId
    : undefined;
  const ancestryCreatorId = onlyMineAncestries
    ? session?.user?.discordId
    : undefined;
  const backgroundCreatorId = onlyMineBackgrounds
    ? session?.user?.discordId
    : undefined;
  const subclassCreatorId = onlyMineSubclasses
    ? session?.user?.discordId
    : undefined;
  const schoolCreatorId = onlyMineSchools
    ? session?.user?.discordId
    : undefined;

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

  const companionsQuery = useQuery({
    queryKey: ["companions", companionSearch, companionCreatorId],
    queryFn: () =>
      searchCompanionsAction({
        searchTerm: companionSearch,
        creatorId: companionCreatorId,
        limit: 50,
      }),
    staleTime: 10000,
  });

  const ancestriesQuery = useQuery({
    queryKey: ["ancestries", ancestrySearch, ancestryCreatorId],
    queryFn: () =>
      searchAncestriesAction({
        searchTerm: ancestrySearch,
        creatorId: ancestryCreatorId,
        limit: 50,
      }),
    staleTime: 10000,
  });

  const backgroundsQuery = useQuery({
    queryKey: ["backgrounds", backgroundSearch, backgroundCreatorId],
    queryFn: () =>
      searchBackgroundsAction({
        searchTerm: backgroundSearch,
        creatorId: backgroundCreatorId,
        limit: 50,
      }),
    staleTime: 10000,
  });

  const subclassesQuery = useQuery({
    queryKey: ["subclasses", subclassSearch, subclassCreatorId],
    queryFn: async () => {
      const result = await searchPublicSubclasses({
        searchTerm: subclassSearch,
        creatorId: subclassCreatorId,
        limit: 50,
      });
      return result.subclasses ?? [];
    },
    staleTime: 10000,
  });

  const schoolsQuery = useQuery({
    queryKey: ["spellSchools", schoolSearch, schoolCreatorId],
    queryFn: () =>
      searchSpellSchoolsAction({
        searchTerm: schoolSearch,
        creatorId: schoolCreatorId,
        limit: 50,
      }),
    staleTime: 10000,
  });

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

  const handleCompanionCheck = (id: string) => {
    if (currentCompanions.some((c) => c.id === id)) {
      setCurrentCompanions((prev) => prev.filter((c) => c.id !== id));
    } else {
      const clicked = (companionsQuery.data ?? []).find((c) => c.id === id);
      if (clicked) {
        setCurrentCompanions((prev) =>
          [...prev, clicked].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    }
  };

  const handleAncestryCheck = (id: string) => {
    if (currentAncestries.some((a) => a.id === id)) {
      setCurrentAncestries((prev) => prev.filter((a) => a.id !== id));
    } else {
      const clicked = (ancestriesQuery.data ?? []).find((a) => a.id === id);
      if (clicked) {
        setCurrentAncestries((prev) =>
          [...prev, clicked].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    }
  };

  const handleBackgroundCheck = (id: string) => {
    if (currentBackgrounds.some((b) => b.id === id)) {
      setCurrentBackgrounds((prev) => prev.filter((b) => b.id !== id));
    } else {
      const clicked = (backgroundsQuery.data ?? []).find((b) => b.id === id);
      if (clicked) {
        setCurrentBackgrounds((prev) =>
          [...prev, clicked].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    }
  };

  const handleSubclassCheck = (id: string) => {
    if (currentSubclasses.some((s) => s.id === id)) {
      setCurrentSubclasses((prev) => prev.filter((s) => s.id !== id));
    } else {
      const clicked = (subclassesQuery.data ?? []).find((s) => s.id === id);
      if (clicked) {
        setCurrentSubclasses((prev) =>
          [...prev, clicked].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    }
  };

  const handleSchoolCheck = (id: string) => {
    if (currentSpellSchools.some((s) => s.id === id)) {
      setCurrentSpellSchools((prev) => prev.filter((s) => s.id !== id));
    } else {
      const clicked = (schoolsQuery.data ?? []).find((s) => s.id === id);
      if (clicked) {
        setCurrentSpellSchools((prev) =>
          [...prev, clicked].sort((a, b) => a.name.localeCompare(b.name))
        );
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

  const renderSimpleTab = (
    label: string,
    searchValue: string,
    setSearch: (v: string) => void,
    onlyMineValue: boolean,
    setOnlyMineValue: (v: boolean) => void,
    query: { isLoading: boolean; data: unknown },
    dataArray: { id: string; name: string }[],
    selectedIds: string[],
    // biome-ignore lint/suspicious/noExplicitAny: generic list component
    ListComponent: React.ComponentType<any>,
    listProps: Record<string, unknown>
  ) => (
    <>
      <div className="flex gap-3 items-center">
        <SearchInput
          className="grow"
          value={searchValue}
          onChange={setSearch}
          placeholder={`Search ${label.toLowerCase()}`}
        />
      </div>
      <div className="flex gap-4">
        <Toggle
          variant="outline"
          aria-label={`Toggle Only My ${label}`}
          pressed={onlyMineValue}
          onPressedChange={setOnlyMineValue}
        >
          {onlyMineValue ? <SquareCheck /> : <Square />}
          Only My {label}
        </Toggle>
      </div>
      <div className="flex gap-x-8">
        <div>
          {query.isLoading ? (
            <div className="p-4 text-center">Searching...</div>
          ) : dataArray.length === 0 ? (
            <div className="p-4 text-center">
              No {label.toLowerCase()} found
            </div>
          ) : (
            <ListComponent
              {...listProps}
              selectedIds={selectedIds}
              showChecks={true}
            />
          )}
        </div>
      </div>
    </>
  );

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
            <Tabs defaultValue="monsters">
              <TabsList className="min-w-sm flex-wrap h-auto">
                <TabsTrigger className="text-md p-4" value="monsters">
                  <Goblin className="size-5" />
                  Monsters
                </TabsTrigger>
                <TabsTrigger className="text-md p-4" value="items">
                  <Shield className="size-5" />
                  Items
                </TabsTrigger>
                <TabsTrigger className="text-md p-4" value="companions">
                  <Dog className="size-5" />
                  Companions
                </TabsTrigger>
                <TabsTrigger className="text-md p-4" value="ancestries">
                  <Layers className="size-5" />
                  Ancestries
                </TabsTrigger>
                <TabsTrigger className="text-md p-4" value="backgrounds">
                  <BookOpen className="size-5" />
                  Backgrounds
                </TabsTrigger>
                <TabsTrigger className="text-md p-4" value="subclasses">
                  <Swords className="size-5" />
                  Subclasses
                </TabsTrigger>
                <TabsTrigger className="text-md p-4" value="spellSchools">
                  <Sparkles className="size-5" />
                  Spell Schools
                </TabsTrigger>
              </TabsList>

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
                {renderSimpleTab(
                  "Companions",
                  companionSearch,
                  setCompanionSearch,
                  onlyMineCompanions,
                  setOnlyMineCompanions,
                  companionsQuery,
                  companionsQuery.data ?? [],
                  currentCompanions.map((c) => c.id),
                  CompanionList,
                  {
                    companions: companionsQuery.data ?? [],
                    handleCompanionClick: handleCompanionCheck,
                  }
                )}
              </TabsContent>

              <TabsContent
                value="ancestries"
                className="flex flex-col gap-4 grow-2"
              >
                {renderSimpleTab(
                  "Ancestries",
                  ancestrySearch,
                  setAncestrySearch,
                  onlyMineAncestries,
                  setOnlyMineAncestries,
                  ancestriesQuery,
                  ancestriesQuery.data ?? [],
                  currentAncestries.map((a) => a.id),
                  AncestryList,
                  {
                    ancestries: ancestriesQuery.data ?? [],
                    handleAncestryClick: handleAncestryCheck,
                  }
                )}
              </TabsContent>

              <TabsContent
                value="backgrounds"
                className="flex flex-col gap-4 grow-2"
              >
                {renderSimpleTab(
                  "Backgrounds",
                  backgroundSearch,
                  setBackgroundSearch,
                  onlyMineBackgrounds,
                  setOnlyMineBackgrounds,
                  backgroundsQuery,
                  backgroundsQuery.data ?? [],
                  currentBackgrounds.map((b) => b.id),
                  BackgroundList,
                  {
                    backgrounds: backgroundsQuery.data ?? [],
                    handleBackgroundClick: handleBackgroundCheck,
                  }
                )}
              </TabsContent>

              <TabsContent
                value="subclasses"
                className="flex flex-col gap-4 grow-2"
              >
                {renderSimpleTab(
                  "Subclasses",
                  subclassSearch,
                  setSubclassSearch,
                  onlyMineSubclasses,
                  setOnlyMineSubclasses,
                  subclassesQuery,
                  subclassesQuery.data ?? [],
                  currentSubclasses.map((s) => s.id),
                  SubclassList,
                  {
                    subclasses: subclassesQuery.data ?? [],
                    handleSubclassClick: handleSubclassCheck,
                  }
                )}
              </TabsContent>

              <TabsContent
                value="spellSchools"
                className="flex flex-col gap-4 grow-2"
              >
                {renderSimpleTab(
                  "Spell Schools",
                  schoolSearch,
                  setSchoolSearch,
                  onlyMineSchools,
                  setOnlyMineSchools,
                  schoolsQuery,
                  schoolsQuery.data ?? [],
                  currentSpellSchools.map((s) => s.id),
                  SchoolList,
                  {
                    schools: schoolsQuery.data ?? [],
                    handleSchoolClick: handleSchoolCheck,
                  }
                )}
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
                creator: session?.user || UNKNOWN_USER,
              }}
              limit={5}
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
