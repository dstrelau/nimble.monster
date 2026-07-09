import type { ItemBackdrop } from "@/lib/db/schema";

// Curated palette: closest built-in Tailwind color per hue, matched against
// the design system's "tuned for parchment & charcoal" mockup swatches.
export const ITEM_COLOR_KEYS: string[] = [
  "amber-700", // rust
  "amber-600", // terracotta
  "amber-500", // gold
  "yellow-600", // tan
  "lime-700", // green
  "green-700", // dark green
  "teal-700", // teal
  "blue-600", // blue
  "indigo-700", // indigo
  "violet-600", // purple
  "fuchsia-600", // mauve
  "pink-700", // rose
  "red-700", // red
  "stone-500", // olive
  "stone-800", // charcoal
];

export const FG_COLOR_CLASSES: Record<string, string> = {
  "amber-700":
    "fill-amber-700 stroke-amber-900 dark:fill-amber-900 dark:stroke-amber-700",
  "amber-600":
    "fill-amber-600 stroke-amber-800 dark:fill-amber-800 dark:stroke-amber-600",
  "amber-500":
    "fill-amber-500 stroke-amber-700 dark:fill-amber-700 dark:stroke-amber-500",
  "yellow-600":
    "fill-yellow-600 stroke-yellow-800 dark:fill-yellow-800 dark:stroke-yellow-600",
  "lime-700":
    "fill-lime-700 stroke-lime-900 dark:fill-lime-900 dark:stroke-lime-700",
  "green-700":
    "fill-green-700 stroke-green-900 dark:fill-green-900 dark:stroke-green-700",
  "teal-700":
    "fill-teal-700 stroke-teal-900 dark:fill-teal-900 dark:stroke-teal-700",
  "blue-600":
    "fill-blue-600 stroke-blue-800 dark:fill-blue-800 dark:stroke-blue-600",
  "indigo-700":
    "fill-indigo-700 stroke-indigo-900 dark:fill-indigo-900 dark:stroke-indigo-700",
  "violet-600":
    "fill-violet-600 stroke-violet-800 dark:fill-violet-800 dark:stroke-violet-600",
  "fuchsia-600":
    "fill-fuchsia-600 stroke-fuchsia-800 dark:fill-fuchsia-800 dark:stroke-fuchsia-600",
  "pink-700":
    "fill-pink-700 stroke-pink-900 dark:fill-pink-900 dark:stroke-pink-700",
  "red-700":
    "fill-red-700 stroke-red-900 dark:fill-red-900 dark:stroke-red-700",
  "stone-500":
    "fill-stone-500 stroke-stone-700 dark:fill-stone-700 dark:stroke-stone-500",
  // near-black: dark mode swaps to a lighter shade instead of the usual
  // darker neighbor, so the icon stays visible against the dark background.
  "stone-800":
    "fill-stone-800 stroke-stone-950 dark:fill-stone-500 dark:stroke-stone-800",
};

// Sets the --backdrop-c1 custom property consumed by the Glow/Sunburst/Motes
// fill layers (see global.css). A Tailwind class rather than an inline style
// so the near-black stone-800 entry can carry a dark: override — inline
// styles always beat class rules of equal property, so the swap has to live
// here rather than in ItemImageStage's style prop.
export const BACKDROP_COLOR_CLASSES: Record<string, string> = {
  "amber-700": "[--backdrop-c1:var(--color-amber-700)]",
  "amber-600": "[--backdrop-c1:var(--color-amber-600)]",
  "amber-500": "[--backdrop-c1:var(--color-amber-500)]",
  "yellow-600": "[--backdrop-c1:var(--color-yellow-600)]",
  "lime-700": "[--backdrop-c1:var(--color-lime-700)]",
  "green-700": "[--backdrop-c1:var(--color-green-700)]",
  "teal-700": "[--backdrop-c1:var(--color-teal-700)]",
  "blue-600": "[--backdrop-c1:var(--color-blue-600)]",
  "indigo-700": "[--backdrop-c1:var(--color-indigo-700)]",
  "violet-600": "[--backdrop-c1:var(--color-violet-600)]",
  "fuchsia-600": "[--backdrop-c1:var(--color-fuchsia-600)]",
  "pink-700": "[--backdrop-c1:var(--color-pink-700)]",
  "red-700": "[--backdrop-c1:var(--color-red-700)]",
  "stone-500": "[--backdrop-c1:var(--color-stone-500)]",
  // near-black: same dark-mode swap as FG_COLOR_CLASSES, so the aura stays
  // visible against the (also dark) card background.
  "stone-800":
    "[--backdrop-c1:var(--color-stone-800)] dark:[--backdrop-c1:var(--color-stone-500)]",
};

// Maps colors from the legacy palette to the nearest color in the new palette
const LEGACY_COLOR_MAP: Record<string, string> = {
  "rose-200": "pink-700",
  "rose-400": "pink-700",
  "rose-600": "pink-700",
  "red-100": "red-700",
  "red-200": "red-700",
  "red-400": "red-700",
  "red-600": "red-700",
  "amber-200": "amber-500",
  "amber-400": "amber-600",
  "lime-200": "lime-700",
  "lime-400": "lime-700",
  "lime-600": "lime-700",
  "teal-200": "teal-700",
  "teal-400": "teal-700",
  "teal-600": "teal-700",
  "blue-200": "blue-600",
  "blue-400": "blue-600",
  "purple-100": "violet-600",
  "purple-200": "violet-600",
  "purple-400": "violet-600",
  "purple-600": "violet-600",
  "slate-200": "stone-500",
  "slate-400": "stone-500",
  "slate-600": "stone-500",
  "neutral-200": "stone-500",
  "neutral-400": "stone-500",
  "neutral-600": "stone-500",
};

// Resolves any stored color key  to a key in the current palette.
export function resolveItemColor(key?: string): string | undefined {
  if (!key) return undefined;
  if (key in FG_COLOR_CLASSES) return key;
  return LEGACY_COLOR_MAP[key];
}

// Backdrop options, in the order they're presented in the picker.
export const BACKDROP_OPTIONS: { value: ItemBackdrop; label: string }[] = [
  { value: "bare", label: "None" },
  { value: "glow", label: "Glow" },
  { value: "sunburst", label: "Sunburst" },
  { value: "motes", label: "Motes" },
  { value: "icon", label: "Icon" },
];

function isItemBackdrop(value: string): value is ItemBackdrop {
  return BACKDROP_OPTIONS.some((option) => option.value === value);
}

export const BACKDROP_FILL_CLASSES: Partial<Record<ItemBackdrop, string>> = {
  glow: "item-backdrop-glow-fill",
  sunburst: "item-backdrop-sunburst-fill",
};

// Resolves a stored backdrop value, falling back for items that predate the
// imageBackdrop field. A stored color alone does not imply a backdrop.
export function resolveItemBackdrop(item: {
  imageBackdrop?: string;
  imageBgIcon?: string;
}): ItemBackdrop {
  if (item.imageBackdrop && isItemBackdrop(item.imageBackdrop)) {
    return item.imageBackdrop;
  }
  if (item.imageBgIcon) return "icon";
  return "bare";
}
