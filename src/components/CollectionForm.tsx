import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormRegister } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { fetchApi } from "../lib/api";
import type { Collection } from "../lib/types";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(["private", "secret", "public"]),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface Props {
  collection?: Collection;
  onSuccess?: () => void;
}

export const CollectionForm = ({ collection, onSuccess }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: collection
      ? {
          name: collection.name,
          visibility: collection.visibility as "private" | "secret" | "public",
        }
      : {
          name: "",
          visibility: "public",
        },
  });

  const visibility = watch("visibility");
  const queryClient = useQueryClient();
  const [isFormExpanded, setIsFormExpanded] = useState(!!collection);

  const mutation = useMutation({
    mutationFn: (data: CollectionFormData) => {
      return collection
        ? fetchApi(`/api/collections/${collection.id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          })
        : fetchApi<Collection>("/api/collections", {
            method: "POST",
            body: JSON.stringify(data),
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      if (!collection) reset();
      onSuccess?.();
    },
  });

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          className="w-full p-4 text-left flex justify-between items-center"
        >
          <h3 className="font-medium text-gray-700">
            {collection ? "Edit Collection" : "New Collection"}
          </h3>
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform ${isFormExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {isFormExpanded && (
          <form
            onSubmit={handleSubmit((data: CollectionFormData) =>
              mutation.mutate(data),
            )}
            className="p-4 pt-0"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-baseline">
              <div className="w-full sm:w-1/3">
                <input
                  {...register("name")}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Name"
                />
                {errors.name && (
                  <div className="mt-1 text-red-500 text-sm">
                    {errors.name.message}
                  </div>
                )}
              </div>
              <div>
                <VisibilityToggle register={register} value={visibility} />
              </div>
              <div className="pr-6">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-500"
                >
                  {collection ? "Save Changes" : "Create Collection"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const VisibilityToggle = ({
  register,
  value,
}: {
  register: UseFormRegister<CollectionFormData>;
  value: "private" | "secret" | "public";
}) => {
  const visibilityInfo = {
    private: "Only you can see this collection.",
    secret: "Only people with the link can see this collection.",
    public: "This collection is visible in the public Collections list.",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-fit inline-flex rounded-lg p-1 bg-gray-100">
        <label
          className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
            value === "private" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            {...register("visibility")}
            value="private"
            className="hidden"
          />
          <span
            className={`text-sm font-medium ${
              value === "private" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Private
          </span>
        </label>
        <label
          className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
            value === "secret" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            {...register("visibility")}
            value="secret"
            className="hidden"
          />
          <span
            className={`text-sm font-medium ${
              value === "secret" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Secret
          </span>
        </label>
        <label
          className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
            value === "public" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            {...register("visibility")}
            value="public"
            className="hidden"
          />
          <span
            className={`text-sm font-medium ${
              value === "public" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Public
          </span>
        </label>
      </div>
      <span className="text-xs text-gray-600">{visibilityInfo[value]}</span>
    </div>
  );
};

export default CollectionForm;
