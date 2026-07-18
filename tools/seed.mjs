// Bootstrap for tools/seed-official.ts.
//
// The seed script imports application modules that use the `@/` path alias.
// jiti's CLI does not read tsconfig `paths`, so we boot jiti programmatically
// with the alias configured, then run the seeder.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createJiti } from "jiti";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load env for standalone runs. Existing env (e.g. DATABASE_URL exported by the
// Makefile) is not overridden.
config({ path: path.join(root, ".env.local") });

const jiti = createJiti(import.meta.url, { alias: { "@": root } });
const { seedOfficial } = await jiti.import(
  path.join(root, "tools/seed-official.ts")
);
const { seedDevData } = await jiti.import(path.join(root, "tools/seed-dev.ts"));

await seedOfficial();
await seedDevData();
process.exit(0);
