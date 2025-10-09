"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Ghost,
  PersonStanding,
  Shield,
  SlidersHorizontal,
  Square,
  SquareCheck,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCollection } from "@/app/actions/collection";
import { searchPublicItems } from "@/app/actions/item";
import { searchPublicMonsters } from "@/app/actions/monster";
import { List as ItemList } from "@/app/ui/item/List";
import { List } from "@/app/ui/monster/List";
import type { SortOption } from "@/app/ui/monster/SimpleFilterBar";
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
import type { Item, ItemMini, ItemRarityFilter } from "@/lib/services/items";
import { RARITIES } from "@/lib/services/items";
import type { Monster, MonsterMini, TypeFilter } from "@/lib/services/monsters";
import type { Collection } from "@/lib/types";
import { UNKNOWN_USER } from "@/lib/types";
import { getCollectionUrl } from "@/lib/utils/url";
import { CollectionCard } from "../ui/CollectionCard";
import { SortSelect } from "../ui/monster/SortSelect";
import { SearchInput } from "../ui/SearchInput";
import { updateCollection } from "./[id]/edit/actions";
import { VisibilityToggle } from "./[id]/edit/VisibilityToggle";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

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
  const { data: session } = useSession();
  const [onlyMine, setOnlyMine] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  // Item-specific state
  const [onlyMineItems, setOnlyMineItems] = useState<boolean>(true);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState<ItemRarityFilter>("all");
  const [itemSortOption, _setItemSortOption] = useState<"name" | "rarity">(
    "name"
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

  const isDirty = isCreating
    ? watchedValues.name.trim() !== ""
    : watchedValues.name !== collection.name ||
      watchedValues.description !== (collection.description || "") ||
      watchedValues.visibility !== collection.visibility ||
      JSON.stringify(currentMonsters.map((m) => m.id).sort()) !==
        JSON.stringify(collection.monsters.map((m) => m.id).sort()) ||
      JSON.stringify(currentItems.map((i) => i.id).sort()) !==
        JSON.stringify(collection.items.map((i) => i.id).sort());

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
        // If we have monsters or items selected, update the collection with them
        if (currentMonsters.length > 0 || currentItems.length > 0) {
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

          const updateResult = await updateCollection(
            result.collection.id,
            updateFormData
          );
          if (!updateResult.success) {
            form.setError("root", {
              message: "Failed to add monsters and items to collection",
            });
            return;
          }
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
    queryKey: [
      "publicItems",
      itemSearchTerm,
      rarityFilter,
      itemSortOption,
      itemCreatorId,
    ],
    queryFn: async () => {
      return searchPublicItems({
        searchTerm: itemSearchTerm,
        rarity: rarityFilter,
        creatorId: itemCreatorId,
        sortBy: itemSortOption,
        sortDirection: "asc",
        limit: 50,
      });
    },
    staleTime: 10000,
  });

  const availableItems: ItemMini[] = itemsQuery.data?.items || [];

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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="w-full"
                      placeholder="Description (optional)"
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
              <TabsList className="min-w-sm">
                <TabsTrigger className="text-md p-4" value="monsters">
                  <Ghost className="size-5" />
                  Monsters
                </TabsTrigger>
                <TabsTrigger className="text-md p-4" value="items">
                  <Shield className="size-5" />
                  Items
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
                  <SortSelect value={sortOption} onChange={setSortOption} />
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
                    ) : (itemsQuery.data?.items?.length ?? 0) === 0 ? (
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
