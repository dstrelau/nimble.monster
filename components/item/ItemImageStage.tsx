"use client";
import { GameIcon } from "@/components/icons/GameIcon";
import {
  BACKDROP_COLOR_CLASSES,
  BACKDROP_FILL_CLASSES,
  FG_COLOR_CLASSES,
} from "@/components/item/colors";
import type { ItemBackdrop } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface ItemImageStageProps {
  backdrop: ItemBackdrop;
  imageIcon?: string;
  imageBgIcon?: string;
  imageColor?: string;
  imageBgColor?: string;
  size?: "default" | "sm";
  className?: string;
}

const SIZE_CLASSES: Record<
  "default" | "sm",
  { stage: string; icon: string; bgIcon: string }
> = {
  default: { stage: "size-64", icon: "size-32", bgIcon: "size-64" },
  sm: { stage: "size-16", icon: "size-9", bgIcon: "size-16" },
};

// Scattered star positions for the Motes backdrop, hand-placed in a loose
// ring around the icon rather than a regular pattern for an organic feel.
const MOTE_POSITIONS: {
  id: string;
  top: string;
  left: string;
  scale: "sm" | "md" | "lg";
  opacity: string;
}[] = [
  { id: "n", top: "6%", left: "48%", scale: "md", opacity: "opacity-90" },
  { id: "nne", top: "12%", left: "62%", scale: "sm", opacity: "opacity-80" },
  { id: "ne", top: "18%", left: "78%", scale: "sm", opacity: "opacity-70" },
  { id: "e", top: "46%", left: "90%", scale: "lg", opacity: "opacity-90" },
  { id: "ese", top: "34%", left: "68%", scale: "sm", opacity: "opacity-60" },
  { id: "se", top: "76%", left: "80%", scale: "sm", opacity: "opacity-60" },
  { id: "sse", top: "62%", left: "72%", scale: "sm", opacity: "opacity-60" },
  { id: "s", top: "88%", left: "40%", scale: "md", opacity: "opacity-80" },
  { id: "ssw", top: "70%", left: "22%", scale: "sm", opacity: "opacity-70" },
  { id: "sw", top: "64%", left: "6%", scale: "lg", opacity: "opacity-90" },
  { id: "w", top: "50%", left: "2%", scale: "sm", opacity: "opacity-70" },
  { id: "nw", top: "28%", left: "10%", scale: "sm", opacity: "opacity-70" },
];

const MOTE_SIZE_CLASSES: Record<
  "default" | "sm",
  Record<"sm" | "md" | "lg", string>
> = {
  default: { sm: "size-2", md: "size-2.5", lg: "size-3" },
  sm: { sm: "size-1", md: "size-1.5", lg: "size-2" },
};

export function ItemImageStage({
  backdrop,
  imageIcon,
  imageBgIcon,
  imageColor,
  imageBgColor,
  size = "default",
  className,
}: ItemImageStageProps) {
  const isIconBackdrop = backdrop === "icon";
  const backdropFillClass = BACKDROP_FILL_CLASSES[backdrop];
  const { stage, icon, bgIcon: bgIconSize } = SIZE_CLASSES[size];
  // Backdrop color defaults to the foreground icon's color when not set.
  const backdropColor = imageBgColor ?? imageColor;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        stage,
        !isIconBackdrop &&
          backdropColor &&
          BACKDROP_COLOR_CLASSES[backdropColor],
        className
      )}
    >
      {isIconBackdrop && imageBgIcon && (
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-55">
          <GameIcon
            iconId={imageBgIcon}
            className={cn(
              bgIconSize,
              backdropColor
                ? FG_COLOR_CLASSES[backdropColor]
                : "fill-muted-foreground stroke-muted-foreground"
            )}
          />
        </div>
      )}
      {!isIconBackdrop && backdropFillClass && backdropColor && (
        <div className={backdropFillClass} />
      )}
      {backdrop === "motes" &&
        backdropColor &&
        MOTE_POSITIONS.map((mote) => (
          <span
            key={mote.id}
            className={cn(
              "item-mote",
              MOTE_SIZE_CLASSES[size][mote.scale],
              mote.opacity
            )}
            style={{ top: mote.top, left: mote.left }}
          />
        ))}
      {imageIcon && (
        <GameIcon
          iconId={imageIcon}
          className={cn(
            "relative z-10 stroke-6 drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]",
            icon,
            "fill-foreground",
            imageColor && FG_COLOR_CLASSES[imageColor]
          )}
        />
      )}
    </div>
  );
}
