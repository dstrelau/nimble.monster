import type { Monster } from "@/lib/services/monsters";

export function formatSizeKind(monster: Monster): string {
  const parts = [];

  if (monster.legendary) {
    if (monster.size !== "medium") {
      parts.push(monster.size.charAt(0).toUpperCase() + monster.size.slice(1));
    }
    parts.push(monster.kind);
    return parts.join(" ");
  }

  if (monster.kind && monster.size !== "medium") {
    parts.push(`${monster.size} ${monster.kind.toLowerCase()}`);
  } else if (monster.kind) {
    parts.push(monster.kind.toLowerCase());
  } else if (monster.size !== "medium") {
    parts.push(monster.size);
  }

  return parts.join(" ");
}
