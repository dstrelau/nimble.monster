import {
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
  type Control,
} from "react-hook-form";
import { z } from "zod";
import { Plus, Trash } from "lucide-react";

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
    <fieldset className="d-fieldset space-y-4">
      <div>
        <label className="d-fieldset-label block mb-1" htmlFor="name">
          Family Name
        </label>
        <input id="name" {...register("name")} className="d-input w-full" />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-base-300 p-3 rounded-md">
            <div className="mb-3">
              <label
                className="d-fieldset-label block mb-1"
                htmlFor={`abilities.${index}.name`}
              >
                Ability Name
              </label>
              <input
                id={`abilities.${index}.name`}
                {...register(`abilities.${index}.name`)}
                className="d-input w-full"
              />
              {errors.abilities?.[index]?.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.abilities[index]?.name?.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="d-fieldset-label block mb-1"
                htmlFor={`abilities.${index}.description`}
              >
                Ability Description
              </label>
              <textarea
                id={`abilities.${index}.description`}
                {...register(`abilities.${index}.description`)}
                className="d-textarea w-full"
                rows={3}
              />
              {errors.abilities?.[index]?.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.abilities[index]?.description?.message}
                </p>
              )}
            </div>
            <div className="flex justify-end items-center mt-2">
              {fields.length > 1 && (
                <button
                  type="button"
                  className="w-4 pr-2 cursor-pointer"
                  onClick={() => remove(index)}
                >
                  <Trash className="w-5 h-5 text-slate-500" />
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button
            type="button"
            className="d-btn d-btn-sm d-btn-ghost"
            onClick={() => append({ name: "", description: "" })}
          >
            <Plus size={16} /> Add Ability
          </button>
        </div>

        {errors.abilities && !Array.isArray(errors.abilities) && (
          <p className="text-sm text-red-600 mt-1">
            {errors.abilities.message}
          </p>
        )}
      </div>

      {children}
    </fieldset>
  );
};
