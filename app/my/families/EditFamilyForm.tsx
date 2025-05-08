"use client";
import { Family } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FamilyForm } from "./FamilyForm";
import { updateFamily } from "@/actions/family";
import { useTransition } from "react";

interface EditFamilyFormProps {
  family: Family;
  onCancel: () => void;
}
export const EditFamilyForm = ({ family, onCancel }: EditFamilyFormProps) => {
  const [isPending, startTransition] = useTransition();

  const familySchema = z.object({
    name: z.string().min(1, "Family name is required"),
    abilityName: z.string().min(1, "Ability name is required"),
    abilityDescription: z.string().min(1, "Ability description is required"),
  });

  type EditFamilyFormData = z.infer<typeof familySchema>;

  const handleUpdate = (data: EditFamilyFormData) => {
    startTransition(async () => {
      const result = await updateFamily(family.id, data);
      if (result.success) {
        onCancel();
      }
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: family.name,
      abilityName: family.abilities[0]?.name || family.abilities[0]?.Name || "",
      abilityDescription:
        family.abilities[0]?.description ||
        family.abilities[0]?.Description ||
        "",
    },
  });

  return (
    <div className="mb-6">
      <form
        onSubmit={handleSubmit(handleUpdate)}
        className=""
      >
        <FamilyForm register={register} errors={errors}>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="d-btn">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="d-btn d-btn-primary"
            >
              {isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </FamilyForm>
      </form>
    </div>
  );
};
