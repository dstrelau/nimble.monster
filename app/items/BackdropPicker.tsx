"use client";

import {
  BACKDROP_OPTIONS,
  resolveItemBackdrop,
} from "@/components/item/colors";
import { ItemImageStage } from "@/components/item/ItemImageStage";
import type { ItemBackdrop } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface BackdropPickerProps {
  selectedBackdrop?: string;
  imageIcon?: string;
  imageBgIcon?: string;
  imageColor?: string;
  imageBgColor?: string;
  onBackdropSelect: (backdrop: ItemBackdrop) => void;
}

export function BackdropPicker({
  selectedBackdrop,
  imageIcon,
  imageBgIcon,
  imageColor,
  imageBgColor,
  onBackdropSelect,
}: BackdropPickerProps) {
  const resolvedBackdrop = resolveItemBackdrop({
    imageBackdrop: selectedBackdrop,
    imageBgIcon,
  });

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {BACKDROP_OPTIONS.map((option) => {
        const isSelected = option.value === resolvedBackdrop;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onBackdropSelect(option.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 p-2",
              isSelected
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border hover:border-flame hover:bg-accent"
            )}
          >
            <ItemImageStage
              backdrop={option.value}
              imageIcon={imageIcon}
              imageBgIcon={option.value === "icon" ? imageBgIcon : undefined}
              imageColor={imageColor}
              imageBgColor={imageBgColor}
              size="sm"
            />
            <span className="text-xs font-bold text-muted-foreground">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
