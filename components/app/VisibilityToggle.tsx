"use client";

import { Switch } from "@/components/ui/switch";

interface VisibilityToggleProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  entityType: "Monster" | "Companion" | "Item" | "Subclass";
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  id,
  checked,
  onCheckedChange,
  entityType,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Publish to Public {entityType}s
      </label>
    </div>
  );
};
