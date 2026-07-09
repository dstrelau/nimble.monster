"use client";

import type React from "react";
import { ITEM_COLOR_KEYS } from "@/components/item/colors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  // "backdrop" previews the color the way it actually renders as a Glow
  // backdrop (color-mix'd 70% over the card background) instead of a solid
  // swatch, so the picker doesn't look more saturated than the result.
  variant?: "solid" | "backdrop";
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  variant = "solid",
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ITEM_COLOR_KEYS.map((colorValue) => {
        const isSelected = selectedColor === colorValue;

        return (
          <Button
            key={colorValue}
            type="button"
            size="icon"
            onClick={() => onColorSelect(colorValue)}
            className={cn(
              "size-8 p-0 rounded-lg border-2 border-card ring-1 ring-icon hover:border-accent hover:ring-flame",
              isSelected && "ring-primary ring-2"
            )}
            style={{
              backgroundColor:
                variant === "backdrop"
                  ? `color-mix(in oklab, var(--color-${colorValue}) 70%, var(--card))`
                  : `var(--color-${colorValue})`,
            }}
            title={colorValue}
          />
        );
      })}
    </div>
  );
};
