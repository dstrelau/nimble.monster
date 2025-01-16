import { Collection, Monster } from "../lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import MonsterCard from "../components/MonsterCard";
import { useParams } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/outline";

export const EditCollectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const queryClient = useQueryClient();

  const { data: collection } = useQuery({
    queryKey: ["collections", id],
    queryFn: () => fetchApi<Collection>(`/api/collections/${id}`),
  });

  const { data: myMonsters } = useQuery({
    queryKey: ["my-monsters"],
    queryFn: () => fetchApi<{ monsters: Monster[] }>("/api/users/me/monsters"),
    select: (data) => data.monsters,
  });

  const updateMetadata = useMutation({
    mutationFn: (data: { name: string; public: boolean }) =>
      fetchApi(`/api/collections/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setTimeout(() => {
        updateMetadata.reset();
      }, 2000);
    },
  });

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
      setTimeout(() => {
        updateMonsters.reset();
      }, 2000);
    },
  });

  const isLoading = updateMetadata.isPending || updateMonsters.isPending;
  const hasError = updateMetadata.isError || updateMonsters.isError;

  if (!collection || !myMonsters) return null;

  return (
    <div className="grid grid-cols-6 gap-x-8">
      <h2 className="text-2xl col-span-6 font-bold text-gray-800 mb-6">
        Edit Collection
      </h2>
      <form className="mb-8 col-span-6">
        <div className="space-y-4 col-span-6 grid grid-cols-6 gap-x-8">
          <div className="col-span-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={collection.name}
              onBlur={(e) =>
                updateMetadata.mutate({
                  name: e.target.value,
                  public: collection.public,
                })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="public"
              defaultChecked={collection.public}
              onChange={(e) =>
                updateMetadata.mutate({
                  name: collection.name,
                  public: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium">Public</span>
          </label>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
            ) : hasError ? (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            ) : (
              <CheckIcon className="w-6 h-6 text-green-500" />
            )}
          </div>
        </div>
      </form>

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
                  - Level {monster.level}
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
