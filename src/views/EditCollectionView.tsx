import { CheckIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";
import {
  VisibilityToggle,
  VisibilityEnum
} from "../components/VisibilityToggle";
import MonsterCard from "../components/MonsterCard";
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
      visibility: (collection?.visibility ?? "public") as "public" | "private" | "secret",
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col space-y-4 w-full"
    >
      <div className="flex items-start space-x-4">
        <div className="w-64 flex-shrink-0">
          <input
            {...register("name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Name"
          />
        </div>
        <div className="flex-shrink-0">
          <VisibilityToggle register={register} value={formData.visibility} />
        </div>
        <div className="flex items-center h-10 ml-2">
          {mutation.isPending && (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          )}
          {showSuccess && (
            <CheckIcon className="w-5 h-5 text-green-500 animate-fade-out" />
          )}
        </div>
      </div>
      <div className="w-full">
        <textarea
          {...register("description")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Description (optional)"
          rows={3}
        />
      </div>
    </form>
  );
};

export const EditCollectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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
      queryClient.setQueryData(["collections", id], (old: Collection) => ({
        ...old,
        monsters: updated,
      }));
    },
  });

  if (!collection || !myMonsters) return null;

  return (
    <div className="grid grid-cols-6 gap-x-8">
      <div className="col-span-6">
        <CollectionForm collection={collection} />
      </div>

      <h2 className="border-b border-b-gray-800 mb-4 text-xl col-span-5">
        Monsters
      </h2>
      <div className="col-span-6 grid grid-cols-3 gap-x-8">
        <div className="space-y-2 p-2">
          {myMonsters.map((monster) => {
            const isInCollection = collection.monsters.some(
              (m) => m.id === monster.id,
            );
            return (
              <div
                key={monster.id}
                onClick={() => updateMonsters.mutate(monster.id)}
                className={`p-2 cursor-pointer rounded w-full ${
                  isInCollection
                    ? "bg-blue-100 hover:bg-blue-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className="font-medium">{monster.name}</span>
                <span className="text-sm text-gray-500">
                  {" "}
                  Lvl {monster.level}
                </span>
              </div>
            );
          })}
        </div>
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {collection.monsters.map((monster) => (
              <MonsterCard key={monster.id} monster={monster} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
