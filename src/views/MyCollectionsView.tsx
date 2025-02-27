import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useState } from "react";
import { fetchApi } from "../lib/api";
import { VisibilityToggle, VisibilityEnum } from "../components/VisibilityToggle";
import { z } from "zod";

interface Collection {
  id: string;
  name: string;
  visibility: string;
  monstersCount: number;
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

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(VisibilityEnum),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

const NewCollectionForm = () => {
  const queryClient = useQueryClient();
  const [formVisible, setFormVisible] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: CollectionFormData) =>
      fetchApi("/api/collections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      reset();
      setFormVisible(false);
    },
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      visibility: "public" as "public" | "private" | "secret",
    },
  });
  
  const formData = watch();

  if (!formVisible) {
    return (
      <div className="mb-6">
        <button 
          onClick={() => setFormVisible(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create New Collection
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h2 className="text-lg font-medium mb-4">Create a New Collection</h2>
      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Collection Name
            </label>
            <input
              id="name"
              {...register("name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter collection name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibility
            </label>
            <div className="flex justify-start">
              <VisibilityToggle register={register} value={formData.visibility} />
            </div>
            {errors.visibility && <p className="mt-1 text-sm text-red-600">{errors.visibility.message}</p>}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setFormVisible(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Collection"}
          </button>
        </div>
      </form>
    </div>
  );
};

const MyCollectionsView = () => {
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
            <div
              key={c.id}
              className="collection p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200 hover:border-blue-200"
            >
              <Link to={`/collections/${c.id}`} className="block">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900">{c.name}</h3>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      c.visibility
                        ? "bg-green-100 text-green-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {c.visibility == "public"
                      ? "Public"
                      : c.visibility == "private"
                        ? "Private"
                        : "Secret"}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {c.monstersCount === 1
                    ? "1 monster"
                    : `${c.monstersCount} monsters`}
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
