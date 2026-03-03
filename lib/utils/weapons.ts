import type { WeaponSpec } from "@/lib/types";

export const WEAPON_DISPLAY_NAMES: Record<string, string> = {
  blade: "Blades",
  stave: "Staves",
  wand: "Wands",
  simple: "Simple",
  martial: "Martial",
  STR: "STR",
  DEX: "DEX",
  melee: "Melee",
  ranged: "Ranged",
};

export function normalizeWeapons(raw: unknown): WeaponSpec[] {
  if (Array.isArray(raw)) return raw as WeaponSpec[];
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  const result: WeaponSpec[] = [];
  if (obj.kind) {
    const kinds = Array.isArray(obj.kind) ? obj.kind : [obj.kind];
    for (const k of kinds)
      result.push({ kind: k as "blade" | "stave" | "wand" });
  }
  if (obj.type) {
    const types = Array.isArray(obj.type) ? obj.type : [obj.type];
    for (const t of types) result.push({ type: t as "STR" | "DEX" });
  }
  if (obj.range) {
    const ranges = Array.isArray(obj.range) ? obj.range : [obj.range];
    for (const r of ranges) result.push({ range: r as "melee" | "ranged" });
  }
  return result;
}

export function formatWeaponsDisplay(weapons: WeaponSpec[]): string | null {
  if (!weapons.length) return null;
  const kinds = weapons.filter(
    (s): s is { kind: "blade" | "stave" | "wand" } => "kind" in s
  );
  const types = weapons.filter(
    (s): s is { type: "STR" | "DEX" } => "type" in s
  );
  const ranges = weapons.filter(
    (s): s is { range: "melee" | "ranged" } => "range" in s
  );
  const parts: string[] = [];
  if (kinds.length)
    parts.push(
      kinds.map((s) => WEAPON_DISPLAY_NAMES[s.kind] || s.kind).join(", ")
    );
  if (types.length)
    parts.push(
      types.map((s) => WEAPON_DISPLAY_NAMES[s.type] || s.type).join(", ")
    );
  if (ranges.length)
    parts.push(
      ranges.map((s) => WEAPON_DISPLAY_NAMES[s.range] || s.range).join(", ")
    );
  return parts.join(" / ");
}
