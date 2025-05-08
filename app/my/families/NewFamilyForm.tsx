"use client";
import { fetchApi } from "@/lib/api";
import { Family } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { FamilyFormData, FamilySchema, FamilyForm } from "./FamilyForm";

export const NewFamilyForm = () => {
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
    resolver: zodResolver(FamilySchema),
    defaultValues: {
      name: "",
      abilityName: "",
      abilityDescription: "",
    },
  });

  return (
    <div className="d-collapse d-collapse-arrow bg-base-200 border-base-300 border">
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
