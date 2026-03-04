"use client";

import { Lock, LockOpen } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";

interface VisibilityToggleProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  id,
  checked,
  onCheckedChange,
}) => {
  const isPrivate = !checked;
  return (
    <Toggle
      id={id}
      variant="outline"
      pressed={isPrivate}
      onPressedChange={(pressed) => onCheckedChange(!pressed)}
    >
      {isPrivate ? <Lock /> : <LockOpen />}
      {isPrivate ? "Private" : "Public"}
    </Toggle>
  );
};
