import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Adaptations of Daniel F. Walthall's stock art. Each piece ships as two alpha
// masks (line work and silhouette), painted as dark ink on a light paper plate
// in both themes so the line art reads the same on dark backgrounds.
const ART = {
  "goblin-shaman": { width: 619, height: 900, label: "Goblin shaman" },
  "orc-warrior": { width: 574, height: 900, label: "Orc warrior" },
  "skeleton-warrior": { width: 628, height: 900, label: "Skeleton warrior" },
  torch: { width: 131, height: 420, label: "Torch" },
  potion: { width: 225, height: 420, label: "Potion" },
  "spellbook-open": { width: 420, height: 288, label: "Open spellbook" },
  "war-banner": { width: 196, height: 420, label: "War banner" },
  "floating-eye": {
    width: 781,
    height: 1000,
    label: "Floating eye",
    src: "/monstery-monday/floating-eye",
  },
} as const;

export type InkArtName = keyof typeof ART;

interface InkArtProps {
  name: InkArtName;
  decorative?: boolean;
  className?: string;
}

function mask(name: InkArtName, layer: "ink" | "fill"): CSSProperties {
  const art = ART[name];
  const src = "src" in art ? art.src : `/field-guide-art/${name}`;
  const url = `url(${src}-${layer}.webp)`;
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

export function InkArt({ name, decorative, className }: InkArtProps) {
  const { width, height, label } = ART[name];
  return (
    <div
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": `${label} illustration` })}
      className={cn("relative", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div
        className="absolute inset-0 bg-[#fffdf8]"
        style={mask(name, "fill")}
      />
      <div
        className="absolute inset-0 bg-[#241f18]"
        style={mask(name, "ink")}
      />
    </div>
  );
}
