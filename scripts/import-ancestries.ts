import * as fs from "node:fs";
import * as path from "node:path";

const ANCESTRIES_DIR =
  "/Users/dstrelau/Desktop/Nimble Vault non-Obsidian/Heroes/Ancestries";
const USER_ID = "4772b23c-682e-47c1-9b8d-e2efb2792a17"; // _byteslicer

interface Ability {
  name: string;
  description: string;
}

interface Ancestry {
  name: string;
  size: string;
  description: string;
  abilities: Ability[];
}

function parseSizeType(sizeStr: string): string {
  const size = sizeStr.toLowerCase().replace(/[()]/g, "").trim();
  const validSizes = ["tiny", "small", "medium", "large", "huge", "gargantuan"];
  return validSizes.includes(size) ? size : "medium";
}

function parseMarkdownFile(filePath: string): Ancestry | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length < 4) return null;

  const name = lines[0].trim();
  const sizeMatch = lines[1].match(/\(([^)]+)\)/);
  const size = sizeMatch ? parseSizeType(sizeMatch[1]) : "medium";

  const descriptionMatch = lines[2].match(/\*(.+)\*/);
  const description = descriptionMatch ? descriptionMatch[1].trim() : "";

  const abilities: Ability[] = [];

  for (let i = 3; i < lines.length; i++) {
    const abilityNameMatch = lines[i].match(/\*\*(.+)\*\*/);
    if (abilityNameMatch && i + 1 < lines.length) {
      const abilityName = abilityNameMatch[1].trim();
      let abilityDesc = lines[i + 1].trim();
      i++;

      while (i + 1 < lines.length && !lines[i + 1].includes("**")) {
        abilityDesc += ` ${lines[i + 1].trim()}`;
        i++;
      }

      abilities.push({
        name: abilityName,
        description: abilityDesc,
      });
    }
  }

  return { name, size, description, abilities };
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSQL(ancestries: Ancestry[]): string {
  const inserts: string[] = [];

  for (const ancestry of ancestries) {
    const abilitiesArray = ancestry.abilities
      .map((ability) => `'${JSON.stringify(ability).replace(/'/g, "''")}'`)
      .join(", ");

    inserts.push(`
INSERT INTO ancestries (id, name, description, size, abilities, user_id, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  '${escapeSQL(ancestry.name)}',
  '${escapeSQL(ancestry.description)}',
  ARRAY['${ancestry.size}']::size_type[],
  ARRAY[${abilitiesArray}]::jsonb[],
  '${USER_ID}',
  NOW(),
  NOW()
);`);
  }

  return inserts.join("\n");
}

const files = fs.readdirSync(ANCESTRIES_DIR).filter((f) => f.endsWith(".md"));
const ancestries: Ancestry[] = [];

for (const file of files) {
  const ancestry = parseMarkdownFile(path.join(ANCESTRIES_DIR, file));
  if (ancestry) {
    ancestries.push(ancestry);
  }
}

console.log(`-- Importing ${ancestries.length} ancestries`);
console.log(generateSQL(ancestries));
