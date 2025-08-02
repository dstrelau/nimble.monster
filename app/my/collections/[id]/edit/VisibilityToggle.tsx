"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const visibilityInfo = {
    [CollectionVisibility.PRIVATE]: "Only you can see this collection.",
    [CollectionVisibility.SECRET]:
      "Only people with the link can see this collection.",
    [CollectionVisibility.PUBLIC]:
      "This collection is visible in the public Collections list.",
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Visibility</Label>
      <RadioGroup
        value={value}
        onValueChange={(newValue) =>
          onChangeAction(newValue as CollectionVisibilityType)
        }
        className="flex flex-row space-x-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value={CollectionVisibility.PRIVATE}
            id={`${name}-private`}
          />
          <Label htmlFor={`${name}-private`} className="text-sm cursor-pointer">
            Private
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value={CollectionVisibility.SECRET}
            id={`${name}-secret`}
          />
          <Label htmlFor={`${name}-secret`} className="text-sm cursor-pointer">
            Secret
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value={CollectionVisibility.PUBLIC}
            id={`${name}-public`}
          />
          <Label htmlFor={`${name}-public`} className="text-sm cursor-pointer">
            Public
          </Label>
        </div>
      </RadioGroup>
      <div className="text-xs text-muted-foreground text-center">
        {visibilityInfo[value]}
      </div>
    </div>
  );
};
