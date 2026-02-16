"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";
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
import type { Item, ItemMini } from "@/lib/services/items";
import type { Monster, MonsterMini } from "@/lib/services/monsters";
import type { Collection } from "@/lib/types";
import { UNKNOWN_USER } from "@/lib/types";
import { getCollectionUrl } from "@/lib/utils/url";
import { CollectionCard } from "../ui/CollectionCard";
import { updateCollection } from "./[id]/edit/actions";
import { VisibilityToggle } from "./[id]/edit/VisibilityToggle";
import { SelectableItemGrid } from "./SelectableItemGrid";
import { SelectableMonsterGrid } from "./SelectableMonsterGrid";

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
      JSON.stringify([...selectedMonsterIds].sort()) !==
        JSON.stringify(collection.monsters.map((m) => m.id).sort()) ||
      JSON.stringify([...selectedItemIds].sort()) !==
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

    if (isCreating) {
      const result = await createCollection({
        name: data.name,
        visibility: data.visibility,
        description: data.description || undefined,
      });

      if (result.success && result.collection) {
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
            <Tabs defaultValue="monsters">
              <TabsList className="min-w-sm">
                <TabsTrigger className="text-md p-4" value="monsters">
                  <Goblin className="size-5" />
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
            </Tabs>
          </div>

          <div className="hidden sm:block min-w-sm">
            <CollectionCard
              collection={{
                ...collection,
                name: watchedValues.name,
                monsters: currentMonsters,
                items: currentItems,
                creator: session?.user || UNKNOWN_USER,
              }}
              limit={Infinity}
              onRemoveMonster={(id) =>
                setSelectedMonsters((prev) => {
                  const next = new Map(prev);
                  next.delete(id);
                  return next;
                })
              }
              onRemoveItem={(id) =>
                setSelectedItems((prev) => {
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
