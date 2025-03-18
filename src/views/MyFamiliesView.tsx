import {
  ArrowPathIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchApi } from "../lib/api";
import { z } from "zod";
import type { Family } from "../lib/types";
import { useState } from "react";

interface EditFamilyFormProps {
  family: Family;
  onCancel: () => void;
}

const EditFamilyForm = ({ family, onCancel }: EditFamilyFormProps) => {
  const queryClient = useQueryClient();

  const familySchema = z.object({
    name: z.string().min(1, "Family name is required"),
    abilityName: z.string().min(1, "Ability name is required"),
    abilityDescription: z.string().min(1, "Ability description is required"),
    visibility: z.enum(["public", "secret", "private"] as const),
  });

  type EditFamilyFormData = z.infer<typeof familySchema>;

  const updateMutation = useMutation({
    mutationKey: ["updateFamily", family.id],
    mutationFn: (data: EditFamilyFormData) =>
      fetchApi<Family>(`/api/families/${family.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          abilities: [
            {
              name: data.abilityName,
              description: data.abilityDescription,
            },
          ],
          visibility: data.visibility,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      onCancel();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: family.name,
      abilityName: family.abilities[0]?.name || "",
      abilityDescription: family.abilities[0]?.description || "",
      visibility: family.visibility,
    },
  });

  return (
    <div className="mb-6">
      <form
        onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
        className="space-y-4 p-4 border border-gray-200 rounded-xl bg-white"
      >
        <div>
          <input
            id="name"
            {...register("name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Family name"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <input
            id="abilityName"
            {...register("abilityName")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Ability name"
          />
          {errors.abilityName && (
            <p className="text-sm text-red-600">{errors.abilityName.message}</p>
          )}
        </div>

        <div>
          <textarea
            id="abilityDescription"
            {...register("abilityDescription")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Ability description"
            rows={3}
          />
          {errors.abilityDescription && (
            <p className="text-sm text-red-600">
              {errors.abilityDescription.message}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? "Updating..." : "Update Family"}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditDeleteButtons = ({
  family,
  onEdit,
}: {
  family: Family;
  onEdit: () => void;
}) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationKey: ["deleteFamily", family.id],
    mutationFn: () =>
      fetchApi(`/api/families/${family.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
  });

  return (
    <div className="flex flex-col items-end mr-4">
      <div className="flex flex-row space-x-2">
        <button onClick={onEdit} className="w-4 p-2" title="Edit family">
          <PencilIcon className="w-5 h-5 text-slate-500" />
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          className="w-4 p-2"
          title={
            family.monsterCount > 0
              ? "Cannot delete: family has monsters"
              : "Delete family"
          }
          disabled={family.monsterCount > 0 || deleteMutation.isPending}
          data-popover-target={family.monsterCount > 0 ? "popover-default" : ""}
        >
          <TrashIcon
            className={`w-5 h-5 ${family.monsterCount > 0 ? "text-slate-300" : "text-slate-500"}`}
          />
        </button>
      </div>
    </div>
  );
};

const familySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  abilityName: z.string().min(1, "Ability name is required"),
  abilityDescription: z.string().min(1, "Ability description is required"),
  visibility: z
    .enum(["public", "secret", "private"] as const)
    .default("public"),
});

type FamilyFormData = z.infer<typeof familySchema>;

const NewFamilyForm = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: FamilyFormData) =>
      fetchApi<Family>("/api/families", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          abilities: [
            {
              name: data.abilityName,
              description: data.abilityDescription,
            },
          ],
          visibility: data.visibility,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: "",
      abilityName: "",
      abilityDescription: "",
      visibility: "public",
    },
  });

  return (
    <div className="d-collapse d-collapse-arrow bg-base-100 border-base-300 border">
      <input type="checkbox" />
      <h3 className="d-collapse-title text-lg">Create Family</h3>
      <form
        className="d-collapse-content"
        onSubmit={handleSubmit((data) => createMutation.mutate(data))}
      >
        <fieldset className="d-fieldset p-4">
          <div className="space-y-4">
            <div>
              <label className="d-fieldset-label block mb-1" htmlFor="name">
                Family Name
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
              <label
                className="d-fieldset-label block mb-1"
                htmlFor="abilityName"
              >
                Ability Name
              </label>
              <input
                id="abilityName"
                {...register("abilityName")}
                className="d-input w-full"
              />
              {errors.abilityName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.abilityName.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="d-fieldset-label block mb-1"
                htmlFor="abilityDescription"
              >
                Ability Description
              </label>
              <textarea
                id="abilityDescription"
                {...register("abilityDescription")}
                className="d-textarea w-full"
                rows={3}
              />
              {errors.abilityDescription && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.abilityDescription.message}
                </p>
              )}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="d-btn d-btn-primary flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PlusIcon className="w-5 h-5" />
                )}
                Create
              </button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

const FamilyCard = ({ family }: { family: Family }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EditFamilyForm family={family} onCancel={() => setIsEditing(false)} />
    );
  }

  return (
    <div key={family.id}>
      <div className="d-card d-card-border d-card-body bg-base-100 border-base-300">
        <div className="flex justify-between items-baseline">
          <h3 className="d-card-title">{family.name}</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {family.monsterCount || 0} monsters
          </span>
        </div>

        {family.abilities.length > 0 && (
          <>
            <div className="d-divider m-0"></div>
            <p>
              <b>{family.abilities[0].name}: </b>
              {family.abilities[0].description}
            </p>
          </>
        )}
      </div>
      <div className="flex justify-end">
        <EditDeleteButtons family={family} onEdit={() => setIsEditing(true)} />
      </div>
    </div>
  );
};

const MyFamiliesView = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["families"],
    queryFn: () => fetchApi<{ families: Family[] }>("/api/users/me/families"),
    staleTime: 0,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading families: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6">
      <NewFamilyForm />

      {!data || data.families.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No families yet. Create your first family to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.families.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFamiliesView;
