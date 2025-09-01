export const CONDITION_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function extractConditions(text: string): string[] {
  const matches = Array.from(text.matchAll(CONDITION_REGEX));
  return matches.map((match) => match[1].trim().toLowerCase());
}

export async function validateCondition(name: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/conditions/${encodeURIComponent(name)}`);
    return response.ok;
  } catch {
    return false;
  }
}
