"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { createFamily } from "@/app/actions/family";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Ability } from "@/lib/types";
import { FamilyForm, type FamilyFormData, FamilySchema } from "./FamilyForm";

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
      description: "",
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
        description: data.description,
        abilities,
      });
      if (result.success) {
        reset();
      }
    });
  };

  return (
    <Card className="mb-6">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Create Family</CardTitle>
              <ChevronDown className="h-4 w-4" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <form onSubmit={handleSubmit(handleCreate)}>
              <FamilyForm register={register} errors={errors} control={control}>
                <div>
                  <Button type="submit" disabled={isPending}>
                    Create
                  </Button>
                </div>
              </FamilyForm>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
