"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateFamily } from "@/app/actions/family";
import { Button } from "@/components/ui/button";
import type { Family } from "@/lib/types";
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
        description: data.description,
        abilities: data.abilities,
      });
      if (result.success) {
        onCancel();
      }
    });
  };

  const normalizedAbilities = family.abilities.map((ability) => ({
    name: ability.name || "",
    description: ability.description || "",
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
      description: family.description || "",
      abilities:
        normalizedAbilities.length > 0
          ? normalizedAbilities
          : [{ name: "", description: "" }],
    },
  });

  return (
    <form onSubmit={handleSubmit(handleUpdate)}>
      <FamilyForm register={register} errors={errors} control={control}>
        <div className="flex space-x-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </FamilyForm>
    </form>
  );
};
