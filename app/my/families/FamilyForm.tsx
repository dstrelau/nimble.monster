import { FieldErrors, UseFormRegister } from "react-hook-form";
import { z } from "zod";

export const FamilySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  abilityName: z.string().min(1, "Ability name is required"),
  abilityDescription: z.string().min(1, "Ability description is required"),
});

export type FamilyFormData = z.infer<typeof FamilySchema>;

export const FamilyForm = ({
  register,
  errors,
  children,
}: {
  register: UseFormRegister<FamilyFormData>;
  errors: FieldErrors<FamilyFormData>;
  children: React.ReactNode;
}) => {
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

      <div>
        <label className="d-fieldset-label block mb-1" htmlFor="abilityName">
          Ability Name
        </label>
        <input
          id="abilityName"
          {...register("abilityName")}
          className="d-input w-full"
        />
        {errors.abilityName && (
          <p className="text-sm text-red-600 mt-1">
            {errors.abilityName.message}
          </p>
        )}
      </div>

      <div>
        <label
          className="d-fieldset-label block mb-1"
          htmlFor="abilityDescription"
        >
          Ability Description
        </label>
        <textarea
          id="abilityDescription"
          {...register("abilityDescription")}
          className="d-textarea w-full"
          rows={3}
        />
        {errors.abilityDescription && (
          <p className="text-sm text-red-600 mt-1">
            {errors.abilityDescription.message}
          </p>
        )}
      </div>
      

      {children}
    </fieldset>
  );
};
