import type { Condition, Monster, MonsterMini } from "./types";

export const CONDITION_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function extractConditions(text: string): string[] {
  const matches = Array.from(text.matchAll(CONDITION_REGEX));
  return matches.map((match) => match[1].trim().toLowerCase());
}

/**
 * Extracts unique conditions from an array of monsters, handling both Monster and MonsterMini types
 */
export function extractFamilyConditions(monsters: (Monster | MonsterMini)[] | undefined): Condition[] {
  const familyConditions: Condition[] = [];
  const seenConditions = new Set<string>();

  if (!monsters) return familyConditions;

  for (const monster of monsters) {
    // Check if this is a full Monster object (has conditions)
    if ('conditions' in monster && Array.isArray(monster.conditions)) {
      for (const condition of monster.conditions) {
        const key = condition.name.toLowerCase();
        if (!seenConditions.has(key)) {
          seenConditions.add(key);
          familyConditions.push(condition);
        }
      }
    }
  }

  return familyConditions;
}

export async function validateCondition(name: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/conditions/${encodeURIComponent(name)}`);
    return response.ok;
  } catch {
    return false;
  }
}
