import type { UseFormRegister } from "react-hook-form";
// import { z } from "zod";
import clsx from "clsx";

export const VisibilityEnum = ["private", "secret", "public"] as const;

export type VisibilityFormData = {
  visibility: (typeof VisibilityEnum)[keyof typeof VisibilityEnum];
};

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
    <div>
      <label className="d-fieldset-label mb-1" htmlFor="visibility">
        Visibility
      </label>
      <div className="d-join" role="group">
        <input
          type="radio"
          {...register("visibility")}
          value="private"
          aria-label="Private"
          className={clsx(
            "d-btn d-join-item",
            value === "private" ? "d-btn-primary" : "bg-base-100",
          )}
        />
        <input
          type="radio"
          {...register("visibility")}
          value="secret"
          aria-label="Secret"
          className={clsx(
            "d-btn d-join-item",
            value === "secret" ? "d-btn-primary" : "bg-base-100",
          )}
        />
        <input
          type="radio"
          {...register("visibility")}
          value="public"
          aria-label="Public"
          className={clsx(
            "d-btn d-join-item",
            value === "public" ? "d-btn-primary" : "bg-base-100",
          )}
        />
      </div>
      <div className="mt-2 text-xs text-base-content/60 text-center">
        {visibilityInfo[value]}
      </div>
    </div>
  );
};
