"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  PersonStanding,
  SlidersHorizontal,
  Square,
  SquareCheck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCollection } from "@/app/actions/collection";
import { searchPublicMonsters, type TypeFilter } from "@/app/actions/monster";
import { List } from "@/app/ui/monster/List";
import type { SortOption } from "@/app/ui/monster/SimpleFilterBar";
import { MonsterGroupMinis } from "@/components/MonsterGroupMinis";
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
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type { Collection, Monster, MonsterMini } from "@/lib/types";
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
  onSubmit?: (data: FormData & { monsters: MonsterMini[] }) => Promise<void>;
  isCreating?: boolean;
  submitLabel?: string;
}

export function CreateEditCollection({
  collection,
  myMonsters,
  onSubmit,
  isCreating = false,
  submitLabel = "Save",
}: Props) {
  const router = useRouter();
  const [currentMonsters, setCurrentMonsters] = useState<MonsterMini[]>(
    collection.monsters
  );
  const { data: session } = useSession();
  const [onlyMine, setOnlyMine] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

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
        JSON.stringify(collection.monsters.map((m) => m.id).sort());

  const handleSubmit = async (data: FormData) => {
    if (onSubmit) {
      await onSubmit({ ...data, monsters: currentMonsters });
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
        // If we have monsters selected, update the collection with them
        if (currentMonsters.length > 0) {
          const updateFormData = new FormData();
          updateFormData.append("name", data.name);
          updateFormData.append("visibility", data.visibility);
          updateFormData.append("description", data.description || "");
          updateFormData.append(
            "monsterIds",
            JSON.stringify(currentMonsters.map((m) => m.id))
          );

          const updateResult = await updateCollection(
            result.collection.id,
            updateFormData
          );
          if (!updateResult.success) {
            form.setError("root", {
              message: "Failed to add monsters to collection",
            });
            return;
          }
        }

        router.push(`/collections/${result.collection.id}`);
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
    creatorId = session?.user?.id;
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

            <h2 className="text-lg font-semibold mb-2 border-b-2 border-foreground">
              Monsters
            </h2>
            <div className="flex flex-col gap-4 grow-2">
              <div className="flex gap-3 items-center">
                <SearchInput
                  className="grow"
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search"
                />
                <SortSelect value={sortOption} onChange={setSortOption} />
              </div>

              <div className="flex gap-4">
                <Toggle
                  variant="outline"
                  aria-label="Toggle Only My Monsters "
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
                    <SelectItem value="standard" aria-label="Standard monsters">
                      <User />
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
            </div>
          </div>

          <div className="hidden sm:block min-w-xs">
            <MonsterGroupMinis
              name={watchedValues.name}
              monsters={currentMonsters}
              showAll={true}
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
