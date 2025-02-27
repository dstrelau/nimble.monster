import type { UseFormRegister } from "react-hook-form";
import { z } from "zod";

// Array of valid visibility values
export const VisibilityEnum = ["private", "secret", "public"] as const;

// Schema for validation
export const visibilitySchema = z.object({
  visibility: z.enum(VisibilityEnum),
});

// Type for form data
export type VisibilityFormData = z.infer<typeof visibilitySchema>;

export const VisibilityToggle = ({
  register,
  value,
}: {
  register: UseFormRegister<any>;
  value: "private" | "secret" | "public";
}) => {
  const visibilityInfo = {
    private: "Only you can see this collection.",
    secret: "Only people with the link can see this collection.",
    public: "This collection is visible in the public Collections list.",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex rounded-lg p-1 bg-gray-100 w-fit">
        <label
          className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
            value === "private" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            {...register("visibility")}
            value="private"
            className="hidden"
          />
          <span
            className={`text-sm font-medium ${
              value === "private" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Private
          </span>
        </label>
        <label
          className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
            value === "secret" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            {...register("visibility")}
            value="secret"
            className="hidden"
          />
          <span
            className={`text-sm font-medium ${
              value === "secret" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Secret
          </span>
        </label>
        <label
          className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
            value === "public" ? "bg-white shadow-sm" : "hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            {...register("visibility")}
            value="public"
            className="hidden"
          />
          <span
            className={`text-sm font-medium ${
              value === "public" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Public
          </span>
        </label>
      </div>
      <div className="h-5 text-xs text-gray-600 text-center">{visibilityInfo[value]}</div>
    </div>
  );
};
