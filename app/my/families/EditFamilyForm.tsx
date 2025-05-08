"use client";
import { fetchApi } from "@/lib/api";
import { Family } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FamilyForm } from "./FamilyForm";

interface EditFamilyFormProps {
  family: Family;
  onCancel: () => void;
}
export const EditFamilyForm = ({ family, onCancel }: EditFamilyFormProps) => {
  const queryClient = useQueryClient();

  const familySchema = z.object({
    name: z.string().min(1, "Family name is required"),
    abilityName: z.string().min(1, "Ability name is required"),
    abilityDescription: z.string().min(1, "Ability description is required"),
  });

  type EditFamilyFormData = z.infer<typeof familySchema>;

  const updateMutation = useMutation({
    mutationKey: ["updateFamily", family.id],
    mutationFn: (data: EditFamilyFormData) =>
      fetchApi<Family>(`/api/families/${family.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          abilities: [
            {
              name: data.abilityName,
              description: data.abilityDescription,
            },
          ],
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
