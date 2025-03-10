import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { fetchApi } from "../lib/api";
import { VisibilityEnum } from "../components/VisibilityToggle";
import { z } from "zod";
import type { CollectionOverview } from "../lib/types";

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

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(VisibilityEnum).default("private"),
  description: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

const NewCollectionForm = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CollectionFormData) =>
      fetchApi<CollectionOverview>("/api/collections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (newCollection: CollectionOverview) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      reset();
      window.location.href = `/my/collections/${newCollection.id}/edit`;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      visibility: "private" as "public" | "private" | "secret",
      description: "",
    },
  });

  return (
    <div className="mb-6">
      <form
        onSubmit={handleSubmit((data) => createMutation.mutate(data))}
        className="flex items-center gap-2"
      >
        <div className="flex-grow">
          <input
            id="name"
            {...register("name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="New collection name"
          />
          {errors.name && (
            <p className="text-sm text-red-600 absolute">
              {errors.name.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          {createMutation.isPending ? "Creating..." : "Create Collection"}
        </button>
      </form>
    </div>
  );
};

const MyCollectionsView = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["collections"],
    queryFn: () =>
      fetchApi<{ collections: CollectionOverview[] }>(
        "/api/users/me/collections",
      ),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <NewCollectionForm />

      {data.collections.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No collections yet. Create your first collection to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.collections.map((c) => (
            <div>
              <div
                key={c.id}
                className="collection p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200 hover:border-blue-200"
              >
                <Link to={`/collections/${c.id}`} className="block">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">
                      {c.name}
                    </h3>
                    <div className="flex items-center">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          c.visibility == "public"
                            ? "bg-green-100 text-green-700"
                            : c.visibility == "private"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {c.visibility == "public"
                          ? "Public"
                          : c.visibility == "private"
                            ? "Private"
                            : "Secret"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center mt-3 gap-2">
                    <img
                      src={`https://cdn.discordapp.com/avatars/${c.creator.discordId}/${c.creator.avatar}.png`}
                      alt={c.creator.username}
                      className="size-6 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {c.creator.username}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-between border-t pt-3 border-gray-100">
                    <div className="text-sm text-gray-600">
                      {c.standardCount} standard
                    </div>
                    <div className="text-sm text-purple-600 font-medium">
                      {c.legendaryCount} legendary
                    </div>
                  </div>
                </Link>
              </div>
              <div className="flex justify-end">
                <EditDeleteButtons id={c.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCollectionsView;
