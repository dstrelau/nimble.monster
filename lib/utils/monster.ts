import type { Monster, MonsterMini } from "@/lib/services/monsters";

export function formatHp(
  monster: Pick<MonsterMini, "hp" | "hpPerHero">
): string {
  return monster.hpPerHero != null
    ? `${monster.hpPerHero}/hero`
    : String(monster.hp);
}

// Fractional legendary levels are stored as negative reciprocals:
// -4 => 1/4, -3 => 1/3, -2 => 1/2 (see MONSTER_LEVELS).
export function monsterLevelValue(levelInt: number): number {
  return levelInt < 0 ? 1 / Math.abs(levelInt) : levelInt;
}

export function resolvedEncounterMonsterCount(
  entry: {
    quantity: number;
    isPerHero: boolean;
    heroesPerMonster?: number;
    monster?: Pick<MonsterMini, "legendary">;
  },
  heroCount: number
): number {
  if (entry.monster?.legendary) return 1;
  if (!entry.isPerHero) return entry.quantity;
  return (entry.quantity * heroCount) / (entry.heroesPerMonster ?? 1);
}

export function encounterMonsterLevelTotal(
  monster: Pick<MonsterMini, "legendary" | "levelInt">,
  count: number,
  heroCount: number
): number {
  const levelMultiplier = monster.legendary ? heroCount : 1;
  return monsterLevelValue(monster.levelInt) * count * levelMultiplier;
}

export function legendaryEncounterDifficulty(
  encounterLevel: number,
  heroLevel: number
): "Easy" | "Medium" | "Hard" | "Deadly" | "Very Deadly" {
  const levelDifference = encounterLevel - heroLevel;
  if (levelDifference <= -2) return "Easy";
  if (levelDifference < 0) return "Medium";
  if (levelDifference === 0) return "Hard";
  if (levelDifference < 2) return "Deadly";
  return "Very Deadly";
}

export function hasLegendaryEncounterConflict(
  entries: Array<{
    monster: Pick<MonsterMini, "legendary" | "minion">;
  }>
): boolean {
  const hasLegendary = entries.some((entry) => entry.monster.legendary);
  const hasOtherNonMinion = entries.some(
    (entry) => !entry.monster.legendary && !entry.monster.minion
  );
  return hasLegendary && hasOtherNonMinion;
}

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

  const result = parts.join(" ");

  if (monster.role) {
    const roleLabel =
      monster.role.charAt(0).toUpperCase() + monster.role.slice(1);
    return result ? `${result} - ${roleLabel}` : roleLabel;
  }

  return result;
}
