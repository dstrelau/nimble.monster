"use client";

import { CollectionCard } from "@/ui/CollectionCard";
import { VisibilityEnum } from "@/ui/VisibilityToggle";
import { fetchApi } from "@/lib/api";
import type { CollectionOverview } from "@/lib/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
                className="d-btn d-btn-primary"
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

export default function MyCollectionsPage() {
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
            <CollectionCard
              key={c.id}
              collection={c}
              showEditDeleteButtons={true}
              showPublicBadge={c.visibility === "public"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
