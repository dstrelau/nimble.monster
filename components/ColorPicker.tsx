"use client";

import { CircleX, Palette } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string | undefined) => void;
}

const FG_COLOR_CLASSES: Record<string, string> = {
  "rose-200":
    "fill-rose-200 stroke-rose-400 dark:fill-rose-400 dark:stroke-rose-200",
  "rose-400":
    "fill-rose-400 stroke-rose-600 dark:fill-rose-600 dark:stroke-rose-400",
  "rose-600":
    "fill-rose-600 stroke-rose-800 dark:fill-rose-800 dark:stroke-rose-600",
  "red-200":
    "fill-red-200 stroke-red-400 dark:fill-red-400 dark:stroke-red-200",
  "red-400":
    "fill-red-400 stroke-red-600 dark:fill-red-600 dark:stroke-red-400",
  "red-600":
    "fill-red-600 stroke-red-800 dark:fill-red-800 dark:stroke-red-600",
  "amber-200":
    "fill-amber-200 stroke-amber-400 dark:fill-amber-400 dark:stroke-amber-200",
  "amber-400":
    "fill-amber-400 stroke-amber-600 dark:fill-amber-600 dark:stroke-amber-400",
  "amber-600":
    "fill-amber-600 stroke-amber-800 dark:fill-amber-800 dark:stroke-amber-600",
  "lime-200":
    "fill-lime-200 stroke-lime-400 dark:fill-lime-400 dark:stroke-lime-200",
  "lime-400":
    "fill-lime-400 stroke-lime-600 dark:fill-lime-600 dark:stroke-lime-400",
  "lime-600":
    "fill-lime-600 stroke-lime-800 dark:fill-lime-800 dark:stroke-lime-600",
  "teal-200":
    "fill-teal-200 stroke-teal-400 dark:fill-teal-400 dark:stroke-teal-200",
  "teal-400":
    "fill-teal-400 stroke-teal-600 dark:fill-teal-600 dark:stroke-teal-400",
  "teal-600":
    "fill-teal-600 stroke-teal-800 dark:fill-teal-800 dark:stroke-teal-600",
  "blue-200":
    "fill-blue-200 stroke-blue-400 dark:fill-blue-400 dark:stroke-blue-200",
  "blue-400":
    "fill-blue-400 stroke-blue-600 dark:fill-blue-600 dark:stroke-blue-400",
  "blue-600":
    "fill-blue-600 stroke-blue-800 dark:fill-blue-800 dark:stroke-blue-600",
  "purple-200":
    "fill-purple-200 stroke-purple-400 dark:fill-purple-400 dark:stroke-purple-200",
  "purple-400":
    "fill-purple-400 stroke-purple-600 dark:fill-purple-600 dark:stroke-purple-400",
  "purple-600":
    "fill-purple-600 stroke-purple-800 dark:fill-purple-800 dark:stroke-purple-600",
  "slate-200":
    "fill-slate-200 stroke-slate-400 dark:fill-slate-400 dark:stroke-slate-200",
  "slate-400":
    "fill-slate-400 stroke-slate-600 dark:fill-slate-600 dark:stroke-slate-400",
  "slate-600":
    "fill-slate-600 stroke-slate-800 dark:fill-slate-800 dark:stroke-slate-600",
  "neutral-200":
    "fill-neutral-200 stroke-neutral-400 dark:fill-neutral-400 dark:stroke-neutral-200",
  "neutral-400":
    "fill-neutral-400 stroke-neutral-600 dark:fill-neutral-600 dark:stroke-neutral-400",
  "neutral-600":
    "fill-neutral-600 stroke-neutral-800 dark:fill-neutral-800 dark:stroke-neutral-600",
};

const BUTTON_BG_CLASSES: Record<string, string> = {
  "rose-200": "bg-rose-200",
  "rose-400": "bg-rose-400",
  "rose-600": "bg-rose-600",
  "red-200": "bg-red-200",
  "red-400": "bg-red-400",
  "red-600": "bg-red-600",
  "amber-200": "bg-amber-200",
  "amber-400": "bg-amber-400",
  "amber-600": "bg-amber-600",
  "lime-200": "bg-lime-200",
  "lime-400": "bg-lime-400",
  "lime-600": "bg-lime-600",
  "teal-200": "bg-teal-200",
  "teal-400": "bg-teal-400",
  "teal-600": "bg-teal-600",
  "blue-200": "bg-blue-200",
  "blue-400": "bg-blue-400",
  "blue-600": "bg-blue-600",
  "purple-200": "bg-purple-200",
  "purple-400": "bg-purple-400",
  "purple-600": "bg-purple-600",
  "slate-200": "bg-slate-200",
  "slate-400": "bg-slate-400",
  "slate-600": "bg-slate-600",
  "neutral-200": "bg-neutral-200",
  "neutral-400": "bg-neutral-400",
  "neutral-600": "bg-neutral-600",
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
}) => {
  return (
    <Popover>
      <PopoverTrigger>
        <span className="flex items-center justify-center size-12 border-2 border-border">
          {selectedColor ? (
            <span
              className={cn(
                "h-8 w-8 p-0 rounded-full border-2 border-white",
                BUTTON_BG_CLASSES[selectedColor]
              )}
            ></span>
          ) : (
            <Palette className="size-8 stroke-muted-foreground" />
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent className="grid grid-cols-3 gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onColorSelect(undefined)}
          className={cn(
            "m-2 col-span-3",
            !selectedColor && "ring-2 ring-blue-500"
          )}
        >
          <CircleX className="size-5" />
          Default
        </Button>

        {Object.entries(FG_COLOR_CLASSES).map(([colorValue]) => {
          const isSelected = selectedColor === colorValue;

          return (
            <Button
              key={colorValue}
              type="button"
              size="icon"
              onClick={() => onColorSelect(colorValue)}
              className={cn(
                "h-8 w-8 p-0 rounded-full border-2 border-white",
                BUTTON_BG_CLASSES[colorValue],
                isSelected && "ring-2 ring-blue-500 ring-offset-1"
              )}
              title={colorValue}
            />
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
