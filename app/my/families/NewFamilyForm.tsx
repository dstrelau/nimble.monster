"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type FamilyFormData, FamilySchema, FamilyForm } from "./FamilyForm";
import { createFamily } from "@/actions/family";
import { useTransition } from "react";
import type { Ability } from "@/lib/types";

export const NewFamilyForm = () => {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FamilyFormData>({
    resolver: zodResolver(FamilySchema),
    defaultValues: {
      name: "",
      abilities: [{ name: "", description: "" }],
    },
  });

  const handleCreate = (data: FamilyFormData) => {
    startTransition(async () => {
      const abilities: Ability[] = data.abilities.map((ability) => ({
        name: ability.name,
        description: ability.description,
      }));
      const result = await createFamily({
        name: data.name,
        abilities,
      });
      if (result.success) {
        reset();
      }
    });
  };

  return (
    <div className="d-collapse d-collapse-arrow bg-base-200 border-base-300 border">
      <input type="checkbox" />
      <h3 className="d-collapse-title text-lg">Create Family</h3>
      <form
        className="d-collapse-content"
        onSubmit={handleSubmit(handleCreate)}
      >
        <FamilyForm register={register} errors={errors} control={control}>
          <div>
            <button
              type="submit"
              disabled={isPending}
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
