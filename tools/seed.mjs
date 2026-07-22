// Boots jiti with the `@/` alias (its CLI ignores tsconfig paths), then seeds.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createJiti } from "jiti";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

config({ path: path.join(root, ".env.local") });

const jiti = createJiti(import.meta.url, { alias: { "@": root } });
const { seedOfficial } = await jiti.import(
  path.join(root, "tools/seed-official.ts")
);
const { seedDevData } = await jiti.import(path.join(root, "tools/seed-dev.ts"));

await seedOfficial();
await seedDevData();
process.exit(0);
