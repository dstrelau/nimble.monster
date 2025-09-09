"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { createCollection } from "@/app/actions/collection";
import { searchPublicMonsters } from "@/app/actions/monster";
import { List } from "@/app/ui/monster/List";
import {
  type LegendaryFilter,
  SimpleFilterBar,
  type SortOption,
} from "@/app/ui/monster/SimpleFilterBar";
import { MonsterGroupMinis } from "@/components/MonsterGroupMinis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSimpleMonsterFilters } from "@/lib/hooks/useSimpleMonsterFilters";
import type {
  Collection,
  CollectionVisibilityType,
  Monster,
  MonsterMini,
} from "@/lib/types";
import { updateCollection } from "./[id]/edit/actions";
import { VisibilityToggle } from "./[id]/edit/VisibilityToggle";

interface Props {
  collection: Collection;
  myMonsters: Monster[];
  onSubmit?: (prevState: ActionState, data: FormData) => Promise<ActionState>;
  isCreating?: boolean;
  submitLabel?: string;
}

type ActionState = {
  success: boolean;
  monsterIds?: string[];
  error?: string;
  collection?: { id: string };
};

export function CreateEditCollection({
  collection,
  myMonsters,
  onSubmit,
  isCreating = false,
  submitLabel = "Save",
}: Props) {
  const router = useRouter();
  const [currentCollection, setCurrentCollection] =
    useState<Omit<Collection, "monsters">>(collection);
  const [currentMonsters, setCurrentMonsters] = useState<MonsterMini[]>(
    collection.monsters
  );
  const [isDirty, setIsDirty] = useState(false);
  const [monsterScope, setMonsterScope] = useState<"mine" | "public">("mine");
  const [searchTerm, setSearchTerm] = useState("");
  const [legendaryFilter, setLegendaryFilter] =
    useState<LegendaryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const id = useId();

  useEffect(() => {
    if (isCreating) {
      setIsDirty(currentCollection.name.trim() !== "");
    } else {
      setIsDirty(
        currentCollection.name !== collection.name ||
          currentCollection.description !== collection.description ||
          currentCollection.visibility !== collection.visibility ||
          JSON.stringify(currentMonsters.map((m) => m.id).sort()) !==
            JSON.stringify(collection.monsters.map((m) => m.id).sort())
      );
    }
  }, [currentCollection, currentMonsters, collection, isCreating]);

  const initialState: ActionState = {
    success: false,
    monsterIds: collection.monsters.map((m) => m.id),
  };

  const defaultSubmitHandler = async (
    _prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> => {
    if (isCreating) {
      const result = await createCollection({
        name: formData.get("name") as string,
        visibility: formData.get("visibility") as CollectionVisibilityType,
        description: (formData.get("description") as string) || undefined,
      });

      if (result.success && result.collection) {
        // If we have monsters selected, update the collection with them
        if (currentMonsters.length > 0) {
          const updateFormData = new FormData();
          updateFormData.append("name", formData.get("name") as string);
          updateFormData.append(
            "visibility",
            formData.get("visibility") as string
          );
          updateFormData.append(
            "description",
            formData.get("description") as string
          );
          updateFormData.append(
            "monsterIds",
            JSON.stringify(currentMonsters.map((m) => m.id))
          );

          const updateResult = await updateCollection(
            result.collection.id,
            updateFormData
          );
          if (!updateResult.success) {
            return {
              success: false,
              error: "Failed to add monsters to collection",
            };
          }
        }

        router.push(`/collections/${result.collection.id}`);
        return {
          success: true,
          collection: { id: result.collection.id },
        };
      }

      return {
        success: false,
        error: result.error || "Failed to create collection",
      };
    } else {
      formData.append(
        "monsterIds",
        JSON.stringify(currentMonsters.map((m) => m.id))
      );
      const result = await updateCollection(collection.id, formData);
      if (result.success) {
        const updatedMonsters = myMonsters
          .filter((m) => result.monsterIds?.includes(m.id) ?? false)
          .sort((a, b) => a.name.localeCompare(b.name));

        setCurrentCollection((prev) => ({
          ...prev,
          monsters: updatedMonsters,
        }));
      }
      return result;
    }
  };

  const [_state, formAction] = useActionState<ActionState, FormData>(
    onSubmit || defaultSubmitHandler,
    initialState
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentCollection((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVisibilityChange = (visibility: string) => {
    setCurrentCollection((prev) => ({
      ...prev,
      visibility: visibility as CollectionVisibilityType,
    }));
  };

  // Use the existing hook for filtering user's monsters
  const {
    searchTerm: myMonstersSearchTerm,
    legendaryFilter: myMonstersLegendaryFilter,
    sortOption: myMonstersSortOption,
    filteredMonsters: filteredMyMonsters,
    handleSearch: handleMyMonstersSearch,
    setLegendaryFilter: setMyMonstersLegendaryFilter,
    setSortOption: setMyMonstersSortOption,
  } = useSimpleMonsterFilters({
    monsters: myMonsters,
  });

  // Search public monsters with debouncing
  const publicMonstersQuery = useQuery({
    queryKey: ["publicMonsters", searchTerm, legendaryFilter, sortOption],
    queryFn: async () => {
      if (monsterScope !== "public") return { success: true, monsters: [] };

      const [sortBy, sortDirection] = sortOption.split("-") as [
        "name" | "level" | "hp",
        "asc" | "desc",
      ];
      const legendaryValue =
        legendaryFilter === "all" ? null : legendaryFilter === "legendary";

      return searchPublicMonsters({
        searchTerm: searchTerm || undefined,
        legendary: legendaryValue,
        sortBy,
        sortDirection,
        limit: 50,
      });
    },
    enabled: monsterScope === "public" && searchTerm?.length > 2,
    staleTime: 10000, // Cache for 30 seconds
  });

  // Get the current filtered monster list
  const availableMonsters: MonsterMini[] =
    monsterScope === "mine"
      ? filteredMyMonsters
      : publicMonstersQuery.data?.monsters || [];

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
    <form action={formAction} className="flex flex-col gap-8">
      <input
        type="hidden"
        name="formChanged"
        value={isDirty ? "true" : "false"}
      />
      <input
        type="hidden"
        name="visibility"
        value={currentCollection.visibility}
      />
      <div className="flex justify-between gap-4">
        <div>
          <Label htmlFor={`name-${id}`} className="mb-2 block">
            Name
          </Label>
          <Input
            name="name"
            id={`name-${id}`}
            className="w-full md:w-80"
            placeholder="Name"
            value={currentCollection.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="flex grow items-end justify-start">
          <VisibilityToggle
            value={currentCollection.visibility}
            onChangeAction={handleVisibilityChange}
          />
        </div>

        <Button type="submit" disabled={!isDirty}>
          {isCreating ? "Create" : submitLabel}
        </Button>
      </div>

      <div className="flex flex-col grow gap-4">
        <div className="flex flex-col">
          <Label htmlFor={`description-${id}`} className="mb-2 block">
            Description
          </Label>
          <Textarea
            name="description"
            id={`description-${id}`}
            className="w-full"
            placeholder="Description (optional)"
            rows={3}
            value={currentCollection.description}
            onChange={handleInputChange}
          />
        </div>

        <div className="flex gap-8">
          <div className="grow">
            <div className="mb-4">
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="monsterScope"
                    value="mine"
                    checked={monsterScope === "mine"}
                    onChange={(e) =>
                      setMonsterScope(e.target.value as "mine" | "public")
                    }
                    className="mr-2"
                  />
                  My Monsters
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="monsterScope"
                    value="public"
                    checked={monsterScope === "public"}
                    onChange={(e) =>
                      setMonsterScope(e.target.value as "mine" | "public")
                    }
                    className="mr-2"
                  />
                  All Public Monsters
                </label>
              </div>
            </div>

            <SimpleFilterBar
              searchTerm={
                monsterScope === "mine" ? myMonstersSearchTerm : searchTerm
              }
              legendaryFilter={
                monsterScope === "mine"
                  ? myMonstersLegendaryFilter
                  : legendaryFilter
              }
              sortOption={
                monsterScope === "mine" ? myMonstersSortOption : sortOption
              }
              onSearch={
                monsterScope === "mine" ? handleMyMonstersSearch : setSearchTerm
              }
              onLegendaryFilterChange={
                monsterScope === "mine"
                  ? setMyMonstersLegendaryFilter
                  : setLegendaryFilter
              }
              onSortChange={
                monsterScope === "mine"
                  ? setMyMonstersSortOption
                  : setSortOption
              }
            />

            <div className="flex gap-x-8">
              <div>
                {monsterScope === "public" && publicMonstersQuery.isLoading ? (
                  <div className="p-4 text-center">Searching...</div>
                ) : monsterScope === "public" && !searchTerm ? (
                  <div className="p-4 text-center">Enter a search term</div>
                ) : monsterScope === "public" &&
                  (publicMonstersQuery.data?.monsters?.length ?? 0) === 0 ? (
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
          </div>
          <div className="hidden sm:block grow">
            <MonsterGroupMinis
              name={currentCollection.name}
              monsters={currentMonsters}
              showAll={true}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
