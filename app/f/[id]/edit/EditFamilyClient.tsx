"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { updateFamily } from "@/app/actions/family";
import {
  FamilyForm,
  type FamilyFormData,
  FamilySchema,
} from "@/app/my/families/FamilyForm";
import { FamilyHeader } from "@/components/FamilyHeader";
import { Button } from "@/components/ui/button";
import { useConditions } from "@/lib/hooks/useConditions";
import type { FamilyOverview } from "@/lib/types";

interface EditFamilyClientProps {
  family: FamilyOverview;
}

export function EditFamilyClient({ family }: EditFamilyClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { allConditions } = useConditions({ creatorId: session?.user?.id });

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

  const handleUpdate = (data: FamilyFormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateFamily(family.id, {
        name: data.name,
        description: data.description || undefined, // Convert empty string to undefined
        abilities: data.abilities,
      });
      if (result.success) {
        router.push(`/f/${family.id}`);
      } else {
        setError(result.error || "Failed to update family");
      }
    });
  };

  const handleCancel = () => {
    router.push(`/f/${family.id}`);
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
      <h1 className="text-2xl font-bold mb-6">Edit Family</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit(handleUpdate)}>
            <FamilyForm register={register} errors={errors} control={control}>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </FamilyForm>
          </form>
        </div>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <div className="border rounded-lg p-4">
            <FamilyHeader family={previewFamily} conditions={allConditions} />
          </div>
        </div>
      </div>
    </div>
  );
}
