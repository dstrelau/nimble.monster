import type { AttackMetadata } from "@/lib/types/attack";

export const maybePeriod = (s: string | undefined) => {
  if (!s) return "";
  if (s && (s.endsWith(".") || s.endsWith("!") || s.endsWith("?"))) {
    return s;
  }
  return `${s}.`;
};

export const formatAttackName = (attack: {
  name: string;
  attackCount?: number;
}) =>
  attack.attackCount && attack.attackCount > 1
    ? `${attack.name} (${attack.attackCount}×)`
    : attack.name;

const formatTarget = (target: NonNullable<AttackMetadata["target"]>) => {
  if ("reach" in target) return `Reach ${target.reach}`;
  if ("range" in target) return `Range ${target.range}`;
  return `Aura ${target.aura}`;
};

export const formatAttackDetails = (
  attack: AttackMetadata & { range?: string }
): string => {
  const parts: string[] = [];
  if (attack.target) parts.push(formatTarget(attack.target));
  else if (attack.range) parts.push(attack.range);
  if (attack.area) {
    const area = attack.area;
    switch (area.shape) {
      case "square":
        parts.push(`${area.size}×${area.size} AoE`);
        break;
      case "line":
        parts.push(
          (area.width ?? 1) === 1
            ? `Line ${area.size}`
            : `Line ${area.width}×${area.size}`
        );
        break;
      case "cone":
        parts.push(`Cone ${area.size}`);
        break;
    }
  } else if (attack.aoe) parts.push("AoE");
  if (attack.alternative) {
    parts.push(
      `or ${attack.alternative.name}, ${formatTarget(attack.alternative.target)}`
    );
  }
  return parts.length ? `(${parts.join(", ")})` : "";
};
