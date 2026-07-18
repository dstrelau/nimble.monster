// Dev-only test users to exercise authenticated flows (official content is
// owned by nimble-co, which you can't log in as). Creates `dev` (normal) and
// `admin`. Log in via /api/auth/dev-login?dev-login&username=dev while running
// `pnpm dev`. Skipped when NODE_ENV=production; idempotent.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { createCollection } from "@/lib/db/collection";
import { getDatabase } from "@/lib/db/drizzle";
import { monsters, users } from "@/lib/db/schema";
import {
  OFFICIAL_USER_ID,
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import { createMonster } from "@/lib/services/monsters/repository";

interface DevUser {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  role: "admin" | null;
}

const DEV_USER: DevUser = {
  id: "11111111-1111-1111-1111-111111111111",
  discordId: "dev-user-1",
  username: "dev",
  displayName: "Dev User",
  role: null,
};

const DEV_ADMIN: DevUser = {
  id: "22222222-2222-2222-2222-222222222222",
  discordId: "dev-admin-1",
  username: "admin",
  displayName: "Dev Admin",
  role: "admin",
};

const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

async function upsertDevUser(u: DevUser): Promise<void> {
  const db = await getDatabase();
  const values = {
    id: u.id,
    discordId: u.discordId,
    username: u.username,
    displayName: u.displayName,
    name: u.displayName,
    role: u.role,
    imageUrl: DEFAULT_AVATAR,
  };
  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        discordId: u.discordId,
        username: u.username,
        displayName: u.displayName,
        name: u.displayName,
        role: u.role,
        imageUrl: DEFAULT_AVATAR,
      },
    });
}

// Two dev-owned monsters built from official stat blocks (avoids hand-crafting).
async function seedDevMonsters(): Promise<string[]> {
  const bestiaryPath = join(
    process.cwd(),
    "data",
    "official",
    "gmg",
    "bestiary.json"
  );
  const json = JSON.parse(readFileSync(bestiaryPath, "utf8"));
  const { monsters: officialMonsters } = validateOfficialMonstersJSON(json);

  const samples = officialMonsters.slice(0, 2);
  const createdIds: string[] = [];

  for (const [index, monsterData] of samples.entries()) {
    const input = parseJSONAPIMonster(monsterData);
    input.name = `Dev's ${input.name}`;
    input.visibility = index === 0 ? "public" : "private";
    input.families = [];
    const created = await createMonster(input, DEV_USER.discordId);
    createdIds.push(created.id);
  }

  return createdIds;
}

export async function seedDevData(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping dev user seed (NODE_ENV=production).");
    return;
  }

  console.log("Seeding dev test users ...");
  await upsertDevUser(DEV_USER);
  await upsertDevUser(DEV_ADMIN);

  const db = await getDatabase();
  const existing = await db
    .select({ id: monsters.id })
    .from(monsters)
    .where(eq(monsters.userId, DEV_USER.id))
    .limit(1);

  if (existing.length === 0) {
    const monsterIds = await seedDevMonsters();

    const officialMonster = await db
      .select({ id: monsters.id })
      .from(monsters)
      .where(eq(monsters.userId, OFFICIAL_USER_ID))
      .limit(1);

    await createCollection({
      name: "Dev's Collection",
      description: "Sample collection owned by the dev user.",
      visibility: "public",
      monsterIds: [
        ...monsterIds,
        ...officialMonster.map((m) => m.id),
      ],
      discordId: DEV_USER.discordId,
    });

    console.log(
      `  created ${monsterIds.length} monsters + 1 collection owned by "dev"`
    );
  } else {
    console.log('  "dev" already owns content — leaving it untouched');
  }

  console.log(
    'Dev users ready. Log in via /api/auth?dev-login&username=dev (or =admin).'
  );
}
