"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CollectionVisibility,
  type CollectionVisibilityType,
} from "@/lib/types";

export const VisibilityToggle = ({
  name,
  value,
  onChangeAction = () => {},
}: {
  name: string;
  value: CollectionVisibilityType;
  onChangeAction?: (value: CollectionVisibilityType) => void;
}) => {
  const isPublic = value === CollectionVisibility.PUBLIC;

  const handleToggle = (checked: boolean) => {
    const newValue = checked
      ? CollectionVisibility.PUBLIC
      : CollectionVisibility.PRIVATE;
    onChangeAction(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Switch
          id={`${name}-visibility`}
          checked={isPublic}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor={`${name}-visibility`} className="text-sm font-medium">
          Public
        </Label>
      </div>
      <div className="text-xs text-muted-foreground">
        {isPublic
          ? "This collection is visible in the public Collections list."
          : "Only you can see this collection."}
      </div>
    </div>
  );
};
