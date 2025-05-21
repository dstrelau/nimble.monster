"use client";
import { updateFamily } from "@/actions/family";
import type { Family } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { FamilyForm, type FamilyFormData, FamilySchema } from "./FamilyForm";

interface EditFamilyFormProps {
  family: Family;
  onCancel: () => void;
}
export const EditFamilyForm = ({ family, onCancel }: EditFamilyFormProps) => {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (data: FamilyFormData) => {
    startTransition(async () => {
      const result = await updateFamily(family.id, {
        name: data.name,
        abilities: data.abilities,
      });
      if (result.success) {
        onCancel();
      }
    });
  };

  const normalizedAbilities = family.abilities.map((ability) => ({
    name: ability.name || ability.Name || "",
    description: ability.description || ability.Description || "",
  }));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FamilyFormData>({
    resolver: zodResolver(FamilySchema),
    defaultValues: {
      name: family.name,
      abilities:
        normalizedAbilities.length > 0
          ? normalizedAbilities
          : [{ name: "", description: "" }],
    },
  });

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit(handleUpdate)} className="">
        <FamilyForm register={register} errors={errors} control={control}>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isPending}
              className="d-btn d-btn-primary"
            >
              {isPending ? "Updating..." : "Update"}
            </button>
            <button type="button" onClick={onCancel} className="d-btn">
              Cancel
            </button>
          </div>
        </FamilyForm>
      </form>
    </div>
  );
};
