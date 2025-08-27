"use client";

import { useActionState, useEffect, useId, useState } from "react";
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
import { updateCollection } from "./actions";
import { VisibilityToggle } from "./VisibilityToggle";

interface Props {
  collection: Collection;
  myMonsters: Monster[];
}

export function EditForm({ collection, myMonsters }: Props) {
  const [currentCollection, setCurrentCollection] = useState(collection);
  const [isDirty, setIsDirty] = useState(false);
  const id = useId();

  useEffect(() => {
    setIsDirty(
      currentCollection.name !== collection.name ||
        currentCollection.description !== collection.description ||
        currentCollection.visibility !== collection.visibility ||
        JSON.stringify(currentCollection.monsters.map((m) => m.id).sort()) !==
          JSON.stringify(collection.monsters.map((m) => m.id).sort())
    );
  }, [currentCollection, collection]);

  type ActionState = {
    success: boolean;
    monsterIds: string[];
  };

  const initialState: ActionState = {
    success: false,
    monsterIds: collection.monsters.map((m) => m.id),
  };

  const [_state, formAction] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, formData: FormData) => {
      formData.append(
        "monsterIds",
        JSON.stringify(currentCollection.monsters.map((m) => m.id))
      );
      const result = await updateCollection(collection.id, formData);
      if (result.success) {
        const updatedMonsters = myMonsters
          .filter((m) => result.monsterIds.includes(m.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setCurrentCollection((prev) => ({
          ...prev,
          monsters: updatedMonsters,
        }));
      }
      return result;
    },
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
                Save
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
