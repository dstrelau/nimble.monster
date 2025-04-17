"use client";

import { CollectionVisibility, CollectionVisibilityType } from "@/lib/types";
import clsx from "clsx";

export const VisibilityToggle = ({
  name,
  value,
  onChangeAction = () => {},
}: {
  name: string;
  value: CollectionVisibilityType;
  onChangeAction?: (value: CollectionVisibilityType) => void;
}) => {
  const visibilityInfo = {
    [CollectionVisibility.PRIVATE]: "Only you can see this collection.",
    [CollectionVisibility.SECRET]:
      "Only people with the link can see this collection.",
    [CollectionVisibility.PUBLIC]:
      "This collection is visible in the public Collections list.",
  };

  return (
    <div>
      <label className="d-fieldset-label mb-1" htmlFor={name}>
        Visibility
      </label>
      <div className="d-join" role="group">
        <input
          type="radio"
          name={name}
          id={`${name}-private`}
          value={CollectionVisibility.PRIVATE}
          checked={value === CollectionVisibility.PRIVATE}
          onChange={() => onChangeAction(CollectionVisibility.PRIVATE)}
          aria-label="Private"
          className={clsx(
            "d-btn d-join-item",
            value === CollectionVisibility.PRIVATE
              ? "d-btn-primary"
              : "bg-base-100",
          )}
        />
        <input
          type="radio"
          name={name}
          id={`${name}-secret`}
          value={CollectionVisibility.SECRET}
          checked={value === CollectionVisibility.SECRET}
          onChange={() => onChangeAction(CollectionVisibility.SECRET)}
          aria-label="Secret"
          className={clsx(
            "d-btn d-join-item",
            value === CollectionVisibility.SECRET
              ? "d-btn-primary"
              : "bg-base-100",
          )}
        />
        <input
          type="radio"
          name={name}
          id={`${name}-public`}
          value={CollectionVisibility.PUBLIC}
          checked={value === CollectionVisibility.PUBLIC}
          onChange={() => onChangeAction(CollectionVisibility.PUBLIC)}
          aria-label="Public"
          className={clsx(
            "d-btn d-join-item",
            value === CollectionVisibility.PUBLIC
              ? "d-btn-primary"
              : "bg-base-100",
          )}
        />
      </div>
      <div className="mt-2 text-xs text-base-content/60 text-center">
        {visibilityInfo[value]}
      </div>
    </div>
  );
};
