"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldValues,
  type Path,
  useFieldArray,
} from "react-hook-form";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { randomUUID } from "@/lib/utils";

interface EditableLevelAbilitiesProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

export function EditableLevelAbilities<T extends FieldValues>({
  control,
  name,
}: EditableLevelAbilitiesProps<T>) {
  const {
    fields: abilityFields,
    remove: removeAbility,
    append: appendAbility,
  } = useFieldArray({
    control,
    name: name as never,
  });

  return (
    <div className="space-y-5">
      {abilityFields.map((abilityField, abilityIndex) => (
        <div className="flex flex-col gap-2" key={abilityField.id}>
          <div className="flex gap-2 items-end justify-between">
            <FormField
              control={control}
              name={`${name}.${abilityIndex}.name` as Path<T>}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeAbility(abilityIndex)}
              aria-label="Remove ability"
              className="mb-0.5"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <FormField
            control={control}
            name={`${name}.${abilityIndex}.description` as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description
                  <ConditionValidationIcon text={field.value} />
                </FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            appendAbility({
              id: randomUUID(),
              name: "",
              description: "",
            } as never)
          }
        >
          <Plus className="size-4" />
          Ability
        </Button>
      </div>
    </div>
  );
}
