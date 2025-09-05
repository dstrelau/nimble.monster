"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { createCollection } from "@/app/actions/collection";
import { CardGrid } from "@/app/ui/monster/CardGrid";
import { List } from "@/app/ui/monster/List";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  Collection,
  CollectionVisibilityType,
  Monster,
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
  const [currentCollection, setCurrentCollection] = useState(collection);
  const [isDirty, setIsDirty] = useState(false);
  const id = useId();

  useEffect(() => {
    if (isCreating) {
      setIsDirty(currentCollection.name.trim() !== "");
    } else {
      setIsDirty(
        currentCollection.name !== collection.name ||
          currentCollection.description !== collection.description ||
          currentCollection.visibility !== collection.visibility ||
          JSON.stringify(currentCollection.monsters.map((m) => m.id).sort()) !==
            JSON.stringify(collection.monsters.map((m) => m.id).sort())
      );
    }
  }, [currentCollection, collection, isCreating]);

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
        if (currentCollection.monsters.length > 0) {
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
            JSON.stringify(currentCollection.monsters.map((m) => m.id))
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
        JSON.stringify(currentCollection.monsters.map((m) => m.id))
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

  const handleMonsterCheck = (id: string) => {
    const isInCollection = currentCollection.monsters.some((m) => m.id === id);
    if (isInCollection) {
      setCurrentCollection((prev) => ({
        ...prev,
        monsters: prev.monsters.filter((m) => m.id !== id),
      }));
    } else {
      const clicked = myMonsters.find((m) => m.id === id);
      if (clicked) {
        setCurrentCollection((prev) => ({
          ...prev,
          monsters: [...prev.monsters, clicked].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }));
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
    <form action={formAction} className="flex flex-col space-y-4">
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

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-row flex-wrap items-center gap-4">
            <div className="w-full md:w-auto">
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
            <div className="flex items-end">
              <VisibilityToggle
                value={currentCollection.visibility}
                onChangeAction={handleVisibilityChange}
              />
            </div>
            <div className="flex items-end ml-auto">
              <Button type="submit" disabled={!isDirty}>
                {isCreating ? "Create" : submitLabel}
              </Button>
            </div>
          </div>
          <div>
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
        </CardContent>
      </Card>

      <div className="mt-4">
        <div className="flex gap-x-8">
          <div>
            <List
              monsters={myMonsters}
              selectedIds={currentCollection.monsters.map((m) => m.id)}
              handleMonsterClick={handleMonsterCheck}
              showChecks={true}
            />
          </div>

          <div className="hidden sm:block flex-2">
            <CardGrid
              monsters={currentCollection.monsters}
              hideActions={true}
              gridColumns={{ sm: 1, md: 2 }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
