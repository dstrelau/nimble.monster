// Temporary: art directions the owner flips between with FieldGuideArtPanel.
// Once a direction is chosen, keep it as fixed markup and delete this module.

export const FIELD_GUIDE_ART_CHOICES = {
  treatment: [
    { value: "filled", label: "Ink on paper fill" },
    { value: "ink", label: "Ink lines only" },
    { value: "plate", label: "Light plate" },
  ],
  tint: [
    { value: "ink", label: "Ink" },
    { value: "rust", label: "Rust" },
  ],
  hero: [
    { value: "lineup", label: "Monster lineup" },
    { value: "floating-eye", label: "Floating eye" },
    { value: "hydra", label: "Hydra" },
    { value: "displacer-beast", label: "Displacer beast" },
    { value: "lich", label: "Lich" },
    { value: "mimic", label: "Mimic" },
  ],
  icons: [
    { value: "supplies", label: "Torch, potion, book" },
    { value: "arms", label: "Banner, axe, shield" },
  ],
  band: [
    { value: "mimic", label: "Mimic" },
    { value: "kobold", label: "Kobold" },
    { value: "gelatinous-cube", label: "Gelatinous cube" },
    { value: "war-banner", label: "War banner" },
  ],
} as const;

type Choices = typeof FIELD_GUIDE_ART_CHOICES;
export type FieldGuideArtOption = keyof Choices;
export type FieldGuideArtOptions = {
  [K in FieldGuideArtOption]: Choices[K][number]["value"];
};

export const DEFAULT_FIELD_GUIDE_ART: FieldGuideArtOptions = {
  treatment: "filled",
  tint: "ink",
  hero: "lineup",
  icons: "supplies",
  band: "mimic",
};

function pick<T extends string>(
  choices: readonly { value: T }[],
  raw: string | string[] | undefined,
  fallback: T
): T {
  return choices.find((choice) => choice.value === raw)?.value ?? fallback;
}

export function parseFieldGuideArtOptions(
  params: Record<string, string | string[] | undefined>
): FieldGuideArtOptions {
  const c = FIELD_GUIDE_ART_CHOICES;
  const d = DEFAULT_FIELD_GUIDE_ART;
  return {
    treatment: pick(c.treatment, params.treatment, d.treatment),
    tint: pick(c.tint, params.tint, d.tint),
    hero: pick(c.hero, params.hero, d.hero),
    icons: pick(c.icons, params.icons, d.icons),
    band: pick(c.band, params.band, d.band),
  };
}
