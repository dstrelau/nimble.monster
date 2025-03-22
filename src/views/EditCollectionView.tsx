import { CheckIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";
import clsx from "clsx";
import {
  VisibilityToggle,
  VisibilityEnum,
} from "../components/VisibilityToggle";
import { MonsterCardGrid } from "../components/MonsterCard";
import { fetchApi } from "../lib/api";
import type { Collection, Monster } from "../lib/types";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(VisibilityEnum),
  description: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface Props {
  collection?: Collection;
  onSuccess?: () => void;
}

export const CollectionForm = ({ collection }: Props) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: CollectionFormData) =>
      fetchApi(`/api/collections/${collection!.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  const onSubmit = (data: CollectionFormData) => {
    if (collection) {
      mutation.mutate(data);
    }
  };

  const { register, handleSubmit, watch } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name ?? "",
      visibility: (collection?.visibility ?? "public") as
        | "public"
        | "private"
        | "secret",
      description: collection?.description ?? "",
    },
  });
  const formData = watch();

  useEffect(() => {
    if (
      collection &&
      (formData.name !== collection.name ||
        formData.visibility !== collection.visibility ||
        formData.description !== collection.description)
    ) {
      const timer = setTimeout(() => {
        mutation.mutate(formData);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [collection, formData, mutation]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
      <fieldset className="d-fieldset space-y-4">
        <div className="flex flex-row flex-wrap space-x-2">
          <div className="w-full md:w-auto mb-2">
            <label className="d-fieldset-label mb-1" htmlFor="name">
              Name
            </label>
            <input
              {...register("name")}
              className="d-input w-full md:w-md"
              placeholder="Name"
            />
          </div>
          <div>
            <VisibilityToggle register={register} value={formData.visibility} />
          </div>
        </div>
        <div>
          <label className="d-fieldset-label mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            {...register("description")}
            className="w-full d-textarea"
            placeholder="Description (optional)"
            rows={3}
          />
        </div>
        <div
          className={clsx(
            "d-alert d-alert-soft d-alert-success animate-fade-out",
            mutation.isPending || showSuccess || "hidden",
          )}
        >
          {showSuccess && (
            <div className="flex space-x-2 text-success">
              <CheckIcon className="w-5 h-5 text-success " />
              Saved
            </div>
          )}
        </div>
      </fieldset>
    </form>
  );
};

export const EditCollectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: collection } = useQuery({
    queryKey: ["collections", id],
    queryFn: () => fetchApi<Collection>(`/api/collections/${id}`),
  });

  const { data: myMonsters } = useQuery({
    queryKey: ["my-monsters"],
    queryFn: () => fetchApi<{ monsters: Monster[] }>("/api/users/me/monsters"),
    select: (data) => data.monsters,
  });

  const queryClient = useQueryClient();
  const updateMonsters = useMutation({
    mutationFn: (monsterId: string) =>
      fetchApi(`/api/collections/${id}/monsters`, {
        method: "PUT",
        body: JSON.stringify(
          collection?.monsters.some((m) => m.id === monsterId)
            ? collection.monsters
                .filter((m) => m.id !== monsterId)
                .map((m) => m.id)
            : [...(collection?.monsters.map((m) => m.id) || []), monsterId],
        ),
      }),
    onSuccess: (updated) => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
      queryClient.setQueryData(["collections", id], (old: Collection) => ({
        ...old,
        monsters: updated,
      }));
    },
  });

  if (!collection || !myMonsters) return null;

  return (
    <div className="">
      <div className="">
        <CollectionForm collection={collection} />
      </div>

      <div
        className={clsx(
          "d-alert d-alert-soft d-alert-success animate-fade-out",
          updateMonsters.isPending || showSuccess || "hidden",
        )}
      >
        {showSuccess && (
          <div className="flex space-x-2 text-success">
            <CheckIcon className="w-5 h-5 text-success " />
            Saved
          </div>
        )}
      </div>

      <div className="flex gap-x-8">
        <div>
          <table className="d-table flex-1">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {myMonsters.map((monster) => {
                const isInCollection = collection.monsters.some(
                  (m) => m.id === monster.id,
                );
                return (
                  <tr
                    key={monster.id}
                    onClick={() => updateMonsters.mutate(monster.id)}
                    className={clsx(
                      "p-2 cursor-pointer rounded w-full has-checked:bg-primary/10",
                    )}
                  >
                    <td>
                      <label>
                        <input
                          type="checkbox"
                          className="d-checkbox"
                          checked={isInCollection}
                        />
                      </label>
                    </td>
                    <td>{monster.name}</td>
                    <td>Lvl {monster.level}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="hidden sm:block flex-2">
          <MonsterCardGrid
            monsters={collection.monsters}
            showActions={false}
            gridColumns={{ sm: 1, md: 2 }}
          />
        </div>
      </div>
    </div>
  );
};
