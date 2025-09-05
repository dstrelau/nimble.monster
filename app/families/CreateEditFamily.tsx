"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createFamily, updateFamily } from "@/app/families/actions";
import {
  FamilyForm,
  type FamilyFormData,
  FamilySchema,
} from "@/app/families/FamilyForm";
import { FamilyHeader } from "@/app/families/FamilyHeader";
import { Button } from "@/components/ui/button";
import type { FamilyOverview } from "@/lib/types";

interface EditFamilyClientProps {
  family: FamilyOverview;
  isCreating?: boolean;
}

export function CreateEditFamily({
  family,
  isCreating = false,
}: EditFamilyClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const normalizedAbilities = family.abilities.map((ability) => ({
    name: ability.name || "",
    description: ability.description || "",
  }));

  const {
    register,
    handleSubmit: onSubmit,
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

  const handleSubmit = (data: FamilyFormData) => {
    setError(null);
    startTransition(async () => {
      const result = isCreating
        ? await createFamily({
            name: data.name,
            description: data.description || undefined,
            abilities: data.abilities,
          })
        : await updateFamily(family.id, {
            name: data.name,
            description: data.description || undefined,
            abilities: data.abilities,
          });

      if (result.success) {
        const targetId = isCreating ? result.family?.id : family.id;
        router.push(`/families/${targetId}`);
      } else {
        setError(
          result.error || `Failed to ${isCreating ? "create" : "update"} family`
        );
      }
    });
  };

  const watchedValues = useWatch({ control });

  const previewFamily: FamilyOverview = {
    id: family.id,
    creatorId: family.creatorId,
    creator: family.creator,
    name: watchedValues.name || family.name,
    description: watchedValues.description ?? family.description,
    abilities:
      watchedValues.abilities
        ?.filter((a) => a.name && a.description)
        .map((ability) => ({
          name: ability.name ?? "",
          description: ability.description ?? "",
        })) ?? family.abilities,
  };

  return (
    <div className="container max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">
        {isCreating ? "Create Family" : "Edit Family"}
      </h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={onSubmit(handleSubmit)}>
            <FamilyForm register={register} errors={errors} control={control}>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? isCreating
                      ? "Creating..."
                      : "Saving..."
                    : isCreating
                      ? "Create"
                      : "Save"}
                </Button>
              </div>
            </FamilyForm>
          </form>
        </div>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <div className="border rounded-lg p-4">
            <FamilyHeader family={previewFamily} />
          </div>
        </div>
      </div>
    </div>
  );
}
