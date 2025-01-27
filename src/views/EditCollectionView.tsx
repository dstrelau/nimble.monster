import type { Collection, Monster } from "../lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import MonsterCard from "../components/MonsterCard";
import { useParams } from "react-router-dom";
import CollectionForm from "../components/CollectionForm";

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

      <h2 className="border border-b-gray-800 mb-4 text-xl col-span-5">
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
