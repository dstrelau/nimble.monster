import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchApi } from "../lib/api";
import { useState } from "react";

interface Collection {
  id: string;
  name: string;
  public: boolean;
  monsters_count: number;
}

const EditDeleteButtons = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationKey: ["deleteCollection", id],
    mutationFn: () => fetchApi(`/api/collections/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  return (
    <div className="flex flex-row justify-end mr-4">
      <Link to={`/my/collections/${id}/edit`} className="w-4 mx-4 p-2">
        <PencilIcon className="w-5 h-5 text-slate-500" />
      </Link>
      <button
        onClick={() => {
          if (window.confirm("Really? This is permanent.")) {
            deleteMutation.mutate();
          }
        }}
        className="w-4 p-2"
      >
        <TrashIcon className="w-5 h-5 text-slate-500" />
      </button>
    </div>
  );
};

const MyCollectionsView = () => {
  const [newCollection, setNewCollection] = useState({
    name: "",
    public: false,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: Omit<Collection, "id" | "monsters_count">) => {
      return fetchApi<Collection>("/api/collections", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setNewCollection({ name: "", public: false });
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["collections"],
    queryFn: () =>
      fetchApi<{ collections: Collection[] }>("/api/users/me/collections"),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(newCollection);
        }}
        className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="font-medium text-gray-700">New Collection:</div>
        <input
          type="text"
          value={newCollection.name}
          onChange={(e) =>
            setNewCollection({ ...newCollection, name: e.target.value })
          }
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          placeholder="Collection name"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={newCollection.public}
            onChange={(e) =>
              setNewCollection({ ...newCollection, public: e.target.checked })
            }
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          Public
        </label>
        <button
          type="submit"
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-500"
        >
          Create
        </button>
      </form>

      {data.collections.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No collections yet. Create your first collection to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.collections.map((c) => (
            <div
              key={c.id}
              className="collection p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200 hover:border-blue-200"
            >
              <Link to={`/collections/${c.id}`} className="block">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900">{c.name}</h3>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      c.public
                        ? "bg-green-100 text-green-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {c.public ? "Public" : "Private"}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {c.monsters_count === 1
                    ? "1 monster"
                    : `${c.monsters_count} monsters`}
                </div>
              </Link>
              <EditDeleteButtons id={c.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCollectionsView;
