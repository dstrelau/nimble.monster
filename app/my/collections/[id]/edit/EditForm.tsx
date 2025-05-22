"use client";

import { useState, useEffect, useActionState } from "react";
import { VisibilityToggle } from "./VisibilityToggle";
import type {
  Collection,
  CollectionVisibilityType,
  Monster,
} from "@/lib/types";
import { updateCollection } from "./actions";
import { List } from "@/ui/monster/List";
import { CardGrid } from "@/ui/monster/CardGrid";

interface Props {
  collection: Collection;
  myMonsters: Monster[];
}

export function EditForm({ collection, myMonsters }: Props) {
  const [currentCollection, setCurrentCollection] = useState(collection);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(
      currentCollection.name !== collection.name ||
        currentCollection.description !== collection.description ||
        currentCollection.visibility !== collection.visibility ||
        JSON.stringify(currentCollection.monsters.map((m) => m.id).sort()) !==
          JSON.stringify(collection.monsters.map((m) => m.id).sort()),
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
    async (prevState: ActionState, formData: FormData) => {
      formData.append(
        "monsterIds",
        JSON.stringify(currentCollection.monsters.map((m) => m.id)),
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
    initialState,
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
            a.name.localeCompare(b.name),
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

      <fieldset className="d-fieldset space-y-4">
        <div className="flex flex-row flex-wrap items-center space-x-4 space-y-4 md:space-y-0">
          <div className="w-full md:w-auto">
            <label className="d-fieldset-label mb-1" htmlFor="name">
              Name
            </label>
            <input
              name="name"
              id="name"
              className="d-input w-full md:w-md"
              placeholder="Name"
              value={currentCollection.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="flex items-center">
            <VisibilityToggle
              name="visibility"
              value={currentCollection.visibility}
              onChangeAction={handleVisibilityChange}
            />
          </div>
          <div className="flex items-center ml-auto">
            <button
              type="submit"
              className="d-btn d-btn-primary"
              disabled={!isDirty}
            >
              Save
            </button>
          </div>
        </div>
        <div>
          <label className="d-fieldset-label mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            className="w-full d-textarea"
            placeholder="Description (optional)"
            rows={3}
            value={currentCollection.description}
            onChange={handleInputChange}
          />
        </div>
      </fieldset>

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
              isOwner={false}
              gridColumns={{ sm: 1, md: 2 }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
