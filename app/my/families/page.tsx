"use client";

import { AbilityOverlay } from "@/ui/AbilityOverlay";
import { fetchApi } from "@/lib/api";
import type { Family } from "@/lib/types";

import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
    },
  });

  return (
    <div className="mb-6">
      <form
        onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
        className=""
      >
        <FamilyForm register={register} errors={errors}>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="d-btn">
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="d-btn d-btn-primary"
            >
              {updateMutation.isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </FamilyForm>
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
    <div className="flex flex-col items-end">
      <div className="flex flex-row space-x-2">
        <button
          onClick={onEdit}
          className="w-4 pr-2 cursor-pointer"
          title="Edit family"
        >
          <PencilIcon className="w-5 h-5 text-slate-500" />
        </button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure?")) {
              deleteMutation.mutate();
            }
          }}
          className={`w-4 pr-2 cursor-pointer ${family.monsterCount && family.monsterCount > 0 && "d-tooltip"}`}
          disabled={
            (family.monsterCount && family.monsterCount > 0) ||
            deleteMutation.isPending
          }
          data-tip="Cannot delete: family has monsters"
          data-popover-target={
            family.monsterCount && family.monsterCount > 0
              ? "popover-default"
              : ""
          }
        >
          <TrashIcon
            className={`w-5 h-5 ${family.monsterCount && family.monsterCount > 0 ? "text-slate-300" : "text-slate-500"}`}
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

const FamilyForm = ({
  register,
  errors,
  children,
}: {
  register: UseFormRegister<FamilyFormData>;
  errors: FieldErrors<FamilyFormData>;
  children: React.ReactNode;
}) => {
  return (
    <fieldset className="d-fieldset space-y-4">
      <div>
        <label className="d-fieldset-label block mb-1" htmlFor="name">
          Family Name
        </label>
        <input id="name" {...register("name")} className="d-input w-full" />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="d-fieldset-label block mb-1" htmlFor="abilityName">
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
      {children}
    </fieldset>
  );
};

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
        <FamilyForm register={register} errors={errors}>
          <div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="d-btn d-btn-primary"
            >
              Create
            </button>
          </div>
        </FamilyForm>
      </form>
    </div>
  );
};

const FamilyCard = ({ family }: { family: Family }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="d-card d-card-border px-4 py-3 bg-base-100 border-base-300">
      {isEditing ? (
        <EditFamilyForm family={family} onCancel={() => setIsEditing(false)} />
      ) : (
        <>
          <h2 className="d-card-title font-bold italic text-xl">
            {family.name}
          </h2>
          <div className="flex flex-col py-2 gap-4">
            {family.abilities.map((ability, index) => (
              <AbilityOverlay ability={ability} key={index} />
            ))}
          </div>
          <div className="flex flex-row justify-between">
            <div className="font-condensed text-sm text-base-content/50">
              {family.monsterCount || 0} monsters
            </div>
            <EditDeleteButtons
              family={family}
              onEdit={() => setIsEditing(true)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default function MyFamiliesPage() {
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
            Families allow associating one or more abilities with a group of
            related monsters.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
          {data.families.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>
      )}
    </div>
  );
}
