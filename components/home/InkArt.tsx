import type { CSSProperties } from "react";
import type { FieldGuideArtOptions } from "@/components/home/fieldGuideArtOptions";
import { cn } from "@/lib/utils";

// Adaptations of Daniel F. Walthall's stock art. Each piece ships as two alpha
// masks (line work and silhouette) so the page paints them with theme colors:
// dark ink on paper in light mode, light ink on dark paper in dark mode.
const ART = {
  "goblin-shaman": { width: 619, height: 900, label: "Goblin shaman" },
  "orc-warrior": { width: 574, height: 900, label: "Orc warrior" },
  "skeleton-warrior": { width: 628, height: 900, label: "Skeleton warrior" },
  "floating-eye": { width: 781, height: 1000, label: "Floating eye monster" },
  hydra: { width: 1300, height: 709, label: "Hydra" },
  "displacer-beast": { width: 1300, height: 841, label: "Displacer beast" },
  lich: { width: 620, height: 1100, label: "Lich" },
  mimic: { width: 837, height: 900, label: "Mimic" },
  kobold: { width: 742, height: 800, label: "Kobold" },
  "gelatinous-cube": { width: 633, height: 700, label: "Gelatinous cube" },
  torch: { width: 131, height: 420, label: "Torch" },
  potion: { width: 225, height: 420, label: "Potion" },
  "spellbook-open": { width: 420, height: 288, label: "Open spellbook" },
  "war-banner": { width: 196, height: 420, label: "War banner" },
  "battle-axe": { width: 215, height: 420, label: "Battle axe" },
  shield: { width: 322, height: 420, label: "Shield" },
} as const;

export type InkArtName = keyof typeof ART;

interface InkArtProps {
  name: InkArtName;
  treatment: FieldGuideArtOptions["treatment"];
  tint: FieldGuideArtOptions["tint"];
  decorative?: boolean;
  className?: string;
}

function mask(name: InkArtName, layer: "ink" | "fill"): CSSProperties {
  const url = `url(/field-guide-art/${name}-${layer}.webp)`;
  return {
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center bottom",
    WebkitMaskPosition: "center bottom",
  };
}

export function InkArt({
  name,
  treatment,
  tint,
  decorative,
  className,
}: InkArtProps) {
  const { width, height, label } = ART[name];
  const plate = treatment === "plate";
  const inkColor =
    tint === "rust"
      ? plate
        ? "bg-[#b1490f]"
        : "bg-primary"
      : plate
        ? "bg-[#241f18]"
        : "bg-card-foreground";
  return (
    <div
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": `${label} illustration` })}
      className={cn("relative", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {treatment !== "ink" && (
        <div
          className={cn("absolute inset-0", plate ? "bg-[#fffdf8]" : "bg-card")}
          style={mask(name, "fill")}
        />
      )}
      <div
        className={cn("absolute inset-0", inkColor)}
        style={mask(name, "ink")}
      />
    </div>
  );
}
