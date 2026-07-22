# Worktrees (wt)

This project uses [worktrunk](https://worktrunk.dev) (`wt`) for parallel worktree workflows. Config: `.config/wt.toml`.

- Worktrees are created as sibling directories: `../nimble.nexus.<branch-name>`
- On create, the hook copies `db/dev.db`, `.env.local`, and `data/paperforge` from main, symlinks `public/paperforge`, then runs `make setup`

# Build Commands

- `make check` - Lint and type-check (dev-safe, use this during development)
  - You must run this after making changes to ensure there are no type errors or lint errors.
  - Never dismiss type errors as "pre-existing" and skip them. If `make check` fails, you must fix ALL errors, even if they weren't introduced by your changes.
- `make lint` - Biome check (linting, formatting, import sorting)
- `make setup` - Install deps, set up DB, sync icons
- `pnpm run build` - Production build (breaks dev server. Only run when asked. Always run `rm -rf .next` after.)

# Database

- Uses Drizzle ORM with Turso (SQLite via libsql)
- Schema: `lib/db/schema.ts`
- Client: `lib/db/client.ts` - auto-retries on stale connection errors
- `pnpm run db:generate` - Generate migrations (see workflow below)
- `pnpm run db:migrate` - Run migrations
- `pnpm run db:push` - Push schema changes directly (dev)
- `pnpm run db:seed` - Seed the dev DB with official content from `data/official`
- Production uses embedded replicas (local SQLite + Turso sync)
- See `lib/db/CLAUDE.md` for detailed database architecture info

## Seeding a dev database

The dev DB is seeded from `data/official` (GMG bestiary + character options),
not a production copy. **All official monsters, ancestries, classes, etc. are
available out of the box — never hand-craft test monsters.**

- `make setup` (and the `.claude/hooks/session-init.sh` web-session hook)
  creates an empty DB, migrates, and seeds it.
- `make seed` / `pnpm run db:seed` re-seeds. Idempotent (upserts).
- Logic: `tools/seed-official.ts`, reusing the admin upload path
  (`app/admin/actions.ts`).
- For real production data: `make db-from-prod` (needs `fly` access).

### Testing as an authenticated user

Official content is owned by `nimble-co`, which you can't log in as. The seed
also creates two dev-only users (`tools/seed-dev.ts`, skipped when
`NODE_ENV=production`):

- `dev` — normal user; owns two sample monsters and a collection.
- `admin` — admin user, for the admin upload flow.

While running `pnpm dev` (`NODE_ENV=development`), log in via
`/api/auth/dev-login?dev-login&username=dev` (or `=admin`).

## Creating Migrations

`drizzle-kit generate` diffs `lib/db/schema.ts` against the last snapshot in `migrations/meta/`.
If the snapshot is missing or stale, it will regenerate the entire schema as CREATE TABLE statements
instead of producing incremental ALTER TABLE statements.

Workflow:
1. Edit `lib/db/schema.ts` with your changes
2. Run `pnpm run db:generate` to create a migration
3. **Review the generated SQL** — it should contain only ALTER TABLE / CREATE INDEX etc., not CREATE TABLE for existing tables
4. If it generated a full schema recreate, the snapshot is out of sync. Fix:
   - Delete the bad migration and its snapshot from `migrations/meta/`
   - Revert `migrations/meta/_journal.json` to remove the bad entry
   - Create a fresh temp DB: `rm -f tmp/migrate.db && mkdir -p tmp`
   - Apply existing migrations: `DATABASE_URL=file:tmp/migrate.db pnpm run db:migrate`
   - Regenerate: `DATABASE_URL=file:tmp/migrate.db pnpm run db:generate`
   - If still wrong, write the migration SQL by hand (e.g. `ALTER TABLE x ADD COLUMN y text;`)
   - The generated snapshot in `migrations/meta/` is still needed for future diffs — keep it
5. Run `pnpm run db:push` to apply changes to your dev DB
6. Test: `rm -f tmp/migrate.db && DATABASE_URL=file:tmp/migrate.db pnpm run db:migrate`

# Changelog

- When adding user-facing features or fixes, add an entry to `app/changelog/page.tsx`.
- Changelog entries are per feature, not per change/commit/PR. A single feature developed over many commits gets one entry. Do not add or suggest an entry for each individual change within a feature.
- We generally do NOT changelog API changes (new endpoints, relationships, query params, etc.). The changelog targets end users of the site, not API consumers. Document API changes in `docs/API.md` instead.

# API Routes (app/api)

- Responses follow JSON:API (`application/vnd.api+json`). Shared helpers live in `lib/api.ts` (`apiRedirect`, `fetchApi`).
- `?include=` tokens are JSON:API relationship NAMES, not arbitrary labels. The creator relationship is named `creator` (singular), so the token is `include=creator` even if a request phrases it as "creators". Don't rename to match user phrasing.
- The `include` parse → validate → 400-error and the CORS error-response blocks are duplicated across every route. When adding/editing them, copy an existing route verbatim (e.g. `app/api/monsters/route.ts`) rather than hand-writing — it's faster and avoids subtle drift. A shared `parseInclude(searchParams, validIncludes)` + error helper in `lib/api.ts` would eliminate this boilerplate; consider extracting it if you touch many routes at once.
- Reuse the dedup helper `collectCreators` (in `lib/services/users/converters.ts`) for list endpoints; use `toJsonApiUser` for single-resource endpoints.
- Biome enforces formatting and line length. Run `node_modules/.bin/biome check --write <changed files>` BEFORE `make check` — otherwise `make check` fails on format-only diffs and costs an extra round-trip.

# Code Style

- Prefer SSR when possible
- Use the latest Next.js built-in features over external libraries
- Type all props and state with TypeScript interfaces
- Do NOT use "as <type>" constructs to bypass type checking. EVER.
- Organize imports: React/libraries first, then components, then contexts/types
- File structure: components/, views/, lib/ directories
- Use tailwind and shadcn for styling
  - Add new shadcn components via `pnpx shadcn@latest add <component>`
  - Do not modify shadcn components in components/ui without explicit confirmation
  - Always use standard shadcn form components (Input, Select, Checkbox, Toggle, Button, etc.) with their default styling for form controls. Do not build custom controls (raw `<button>` steppers, hand-styled toggles, custom color overrides) unless explicitly told to build something custom.
- In this version of Next.js, params are a Promise that need to be awaited.
- Use OpenTelemetry.
- Do not add console.\* functions permanently (they may be used for temporary debugging).
- Use `cn` from lib/utils.ts for constructing dynamic className attributes. DO NOT use string concatenation for className.
- Never use `crypto.randomUUID()` directly in client components — it requires a secure context (HTTPS/localhost) and will throw on plain HTTP. Use `randomUUID()` from `lib/utils.ts` instead, which has a `Math.random` fallback.
- You may not use an empty string value="" on a <Select> element. Use "none" and special-case this value to be null/undefined as appropriate.
- Use lucide icons instead of custom SVGs
- Always prefer reusing existing components over creating new ones. Before building a new component to display an entity, search for how that entity is already rendered elsewhere (e.g. detail pages, list cards) and reuse those components.

# Tests

- `pnpm run test` to run tests (or `pnpm run test:run` for a single non-watch run).
- When adding new functionality, make sure you add tests.
- Use @testing-library/react and vitest.
- Make sure to add cleanup after each test whenever necessary.
- When mocking dependencies, use the most narrow, specific mock possible.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
