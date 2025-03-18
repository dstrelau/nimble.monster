import {
  ArrowPathIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
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
    <div className="flex flex-row justify-end">
      <Link to={`/my/collections/${id}/edit`} className="mr-2">
        <PencilIcon className="w-5 h-5 text-slate-500" />
      </Link>
      <button
        onClick={() => {
          if (window.confirm("Really? This is permanent.")) {
            deleteMutation.mutate();
          }
        }}
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
    <div className="d-collapse d-collapse-arrow bg-base-100 border-base-300 border mb-6">
      <input type="checkbox" />
      <h3 className="d-collapse-title text-lg">Create Collection</h3>
      <form
        className="d-collapse-content"
        onSubmit={handleSubmit((data) => createMutation.mutate(data))}
      >
        <fieldset className="d-fieldset">
          <div className="space-y-4">
            <div>
              <label className="d-fieldset-label block mb-1" htmlFor="name">
                Collection Name
              </label>
              <input
                id="name"
                {...register("name")}
                className="d-input w-full"
                placeholder="New collection name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="d-btn d-btn-primary flex items-center gap-2"
              >
                Create
              </button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

const CollectionCard = ({ collection }: { collection: CollectionOverview }) => {
  return (
    <div
      key={collection.id}
      className="d-card d-card-border d-card-body bg-base-100 border-base-300 py-4"
    >
      <Link to={`/collections/${collection.id}`} className="block">
        <div className="flex justify-between items-start">
          <h3 className="d-card-title">{collection.name}</h3>
          {collection.visibility === "public" && (
            <div className="d-badge d-badge-soft d-badge-success">Public</div>
          )}
        </div>
        <div className="flex items-center mt-3 gap-2">
          <img
            src={`https://cdn.discordapp.com/avatars/${collection.creator.discordId}/${collection.creator.avatar}.png`}
            alt={collection.creator.username}
            className="size-6 rounded-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {collection.creator.username}
          </span>
        </div>
        <div className="d-divider my-2"></div>
        <div className="flex justify-between">
          <div className="font-condensed text-sm text-gray-600 dark:text-gray-400">
            {collection.standardCount} monsters |{" "}
            <span className="text-info">
              {collection.legendaryCount} legendary
            </span>
          </div>
          <div className="flex justify-end">
            <EditDeleteButtons id={collection.id} />
          </div>
        </div>
      </Link>
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
        <div className="d-alert d-alert-info">
          <p>
            No collections yet. Create your first collection to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCollectionsView;
