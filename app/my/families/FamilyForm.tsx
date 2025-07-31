import {
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
  type Control,
} from "react-hook-form";
import { z } from "zod";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const AbilitySchema = z.object({
  name: z.string().min(1, "Ability name is required"),
  description: z.string().min(1, "Ability description is required"),
});

export const FamilySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  abilities: z.array(AbilitySchema).min(1, "At least one ability is required"),
});

export type FamilyFormData = z.infer<typeof FamilySchema>;

export const FamilyForm = ({
  register,
  errors,
  control,
  children,
}: {
  register: UseFormRegister<FamilyFormData>;
  errors: FieldErrors<FamilyFormData>;
  control: Control<FamilyFormData>;
  children: React.ReactNode;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "abilities",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name" className="mb-2 block">
          Family Name
        </Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor={`abilities.${index}.name`} className="mb-2 block">
                  Ability Name
                </Label>
                <Input
                  id={`abilities.${index}.name`}
                  {...register(`abilities.${index}.name`)}
                />
                {errors.abilities?.[index]?.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.abilities[index]?.name?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`abilities.${index}.description`} className="mb-2 block">
                  Ability Description
                </Label>
                <Textarea
                  id={`abilities.${index}.description`}
                  {...register(`abilities.${index}.description`)}
                  rows={3}
                />
                {errors.abilities?.[index]?.description && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.abilities[index]?.description?.message}
                  </p>
                )}
              </div>
              
              {fields.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ name: "", description: "" })}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Ability
          </Button>
        </div>

        {errors.abilities && !Array.isArray(errors.abilities) && (
          <p className="text-sm text-destructive mt-1">
            {errors.abilities.message}
          </p>
        )}
      </div>

      {children}
    </div>
  );
};
