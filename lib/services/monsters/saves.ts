/**
 * Parsed saves object with ability score modifiers.
 * Each key is an ability abbreviation (str, dex, con, int, wis, cha).
 * Values are integers: positive for bonuses, negative for penalties.
 */
export type ParsedSaves = {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
};

const ABILITY_ABBREVIATIONS = ["str", "dex", "con", "int", "wis", "cha"];

/**
 * Parses a save string like "STR++ DEX-" into an object like { str: 2, dex: -1 }.
 *
 * Format:
 * - Each save is an ability abbreviation (STR, DEX, CON, INT, WIS, CHA) followed by + or - symbols
 * - "STR+" = { str: 1 }, "STR++" = { str: 2 }
 * - "DEX-" = { dex: -1 }, "DEX--" = { dex: -2 }
 * - Multiple saves can be separated by spaces or commas
 *
 * @param savesString - The raw saves string from the database
 * @returns An object with ability abbreviations as keys and modifiers as values
 */
export function parseSaves(savesString: string | undefined): ParsedSaves {
  if (!savesString || savesString.trim() === "") {
    return {};
  }

  const result: ParsedSaves = {};

  // Split on spaces and/or commas, filter empty strings
  const parts = savesString.split(/[\s,]+/).filter(Boolean);

  for (const part of parts) {
    // Match pattern: ability abbreviation followed by + or - symbols
    const match = part.match(/^([a-zA-Z]{3})([+-]+)$/);
    if (!match) {
      continue;
    }

    const ability = match[1].toLowerCase();
    const modifierStr = match[2];

    if (!ABILITY_ABBREVIATIONS.includes(ability)) {
      continue;
    }

    // Count the modifier: each + adds 1, each - subtracts 1
    let modifier = 0;
    for (const char of modifierStr) {
      if (char === "+") {
        modifier += 1;
      } else if (char === "-") {
        modifier -= 1;
      }
    }

    if (modifier !== 0) {
      result[ability as keyof ParsedSaves] = modifier;
    }
  }

  return result;
}
