"use client";
import { ValidCollectionVisibilities } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCollection } from "@/actions/collection";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(ValidCollectionVisibilities).default("private"),
  description: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function NewCollectionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        onSubmit={handleSubmit((data) => {
          startTransition(async () => {
            const result = await createCollection(data);
            if (result.success && result.collection) {
              reset();
              router.push(`/my/collections/${result.collection.id}/edit`);
            }
          });
        })}
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
                disabled={isPending}
                className="d-btn d-btn-primary"
              >
                {isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
