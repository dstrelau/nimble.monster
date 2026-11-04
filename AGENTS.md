# Setup and commands

- Use Node.js 26 and the pnpm version pinned in `package.json`; install with `pnpm install --frozen-lockfile`.
- In Amp orbs, `.agents/setup` installs prerequisites, creates `.env.local`, and runs `make setup`. `.agents/resume` checks prerequisites and starts services; run `.agents/setup` if prerequisites are missing.
- Start the orb web service with `amp orb services ensure` (`.amp/services.yaml`). Use `amp orb service logs web` for logs. Do not start duplicate servers or keep services alive with `nohup`, `&`, or tmux. Share the returned portal URL, not localhost or direct sandbox URLs.
- Preserve the managed service's portal-based `AUTH_URL` and `ALLOWED_DEV_ORIGINS`. It automatically logs in as `admin` in development.
- Outside an orb, copy `.env.example` to `.env.local`, generate `AUTH_SECRET`, configure `PUPPETEER_EXECUTABLE_PATH`, then run `make setup` and `pnpm dev`.
- `make setup` installs dependencies, migrates/seeds `db/dev.db`, and syncs icons; it does not reset an existing DB. `make seed` re-seeds.
- Before `make check`, run `node_modules/.bin/biome check --write <changed supported files>`. Avoid `make fix`: it applies unsafe fixes repo-wide.
- Run `make check` after changes (Server Action ratchet, Biome, TypeScript). Fix all errors, even if pre-existing.
- Run `pnpm run test:run` for non-watch tests (Vitest + Testing Library). Add tests for new functionality; keep mocks narrow and clean up when needed.
- Only run `pnpm run build` when asked; it disrupts the dev server. Run `rm -rf .next` afterward.

# Data and authentication

- Drizzle uses local SQLite via `@libsql/client`. `DATABASE_URL` is required: development uses `file:db/dev.db`; production uses `file:/data/db.sqlite` with Litestream backups to Tigris, not Turso sync. See `lib/db/AGENTS.md` for database-specific guidance.
- Official content is seeded from `data/official`; use it instead of hand-crafting test monsters. Dev seeds also provide users `dev` (normal, owns sample content) and `admin` (admin flows).
- Use `/dev-login` or `/api/auth/dev-login?dev-login&username=dev` (or `=admin`) to switch users. Dev login is disabled outside development. Official content belongs to `nimble-co`, not either test user.
- Development uploads use `public/blob-storage` without Tigris credentials, even when a bucket name is set.
- Keep secrets private. Production writes, deployments, and infrastructure changes require explicit authorization. `make db-from-prod` deletes/replaces the local DB and requires explicit approval before overwriting local data.

## Migrations

1. Edit `lib/db/schema.ts`, then run `pnpm run db:generate`.
2. Review SQL for only intended changes. Generation compares schema to `migrations/meta/` snapshots, not the live DB; changing `DATABASE_URL` cannot repair missing/stale snapshots.
3. If generation recreates existing tables unexpectedly, remove only the new unapplied migration/snapshot/journal entry, restore the matching baseline snapshots from Git, and regenerate. Preserve existing migrations and others' changes. Keep the matching snapshot/journal if correcting SQL by hand.
4. Apply with `DATABASE_URL=file:db/dev.db pnpm run db:migrate`. Verify the full chain against a fresh disposable DB under `tmp/`, then remove it. Never delete an existing DB for this check. `db:push` is for prototyping only; it does not update the migration ledger.

## Feature flags

- Registry/helpers: `lib/services/featureFlags.ts`; CLI: `pnpm feature-flag <username> <feature> <true|false>`. Missing/unknown flags are disabled.
- Client flags refresh after a hard reload. Security-sensitive actions must also call `isFeatureFlagEnabled` server-side; client context is not authorization.
- New flags must update the registry/result map and `tools/set-feature-flag.mjs` validation/usage. Add to `SELF_SERVICE_FEATURE_FLAGS` only when users should control the flag.
- Authorized production changes: `fly ssh console -a nimble-nexus -C 'set-feature-flag <username> <feature> <true|false>'`. The owner's production username is `_byteslicer`.

# Implementation conventions

- Prefer SSR and built-in Next.js features. Await promised route `params`; consult the bundled Next.js docs below before changing framework code.
- Use TypeScript interfaces for props/state. Never use type assertions to bypass checking. Let Biome organize imports.
- Reuse existing entity displays and components in `components/ui`, `components/shared`, and `components/layout` before adding UI. Use standard shadcn controls/default styling, Tailwind, and Lucide icons. Do not modify `components/ui` without explicit confirmation; add shadcn components with `pnpx shadcn@latest add <component>`.
- Use `cn` from `lib/utils.ts` for dynamic classes and its `randomUUID()` in client components (native `crypto.randomUUID()` fails on insecure HTTP). Select values must not be empty strings; use a sentinel such as `"none"`.
- Use OpenTelemetry; do not leave permanent `console.*` calls. Avoid redundant headings, subtitles, and placeholder copy.
- Public API changes must remain backwards compatible, including shared serializers; follow `app/api/AGENTS.md`. Document API changes in `docs/API.md`.
- Reuse `parseInclude`, `jsonApiError`, and `jsonApiHeaders` from `lib/api.ts`; follow `app/api/monsters/route.ts`. Include tokens are relationship names (`creator`, not `creators`). Reuse `collectCreators`/`toJsonApiUser` from `lib/services/users/converters.ts`.
- Add one changelog entry per new user-facing feature, not per commit. No entries for bug fixes, internal work, or API-only changes.

# Browser QA

- Browser-test affected routes/entity types for UI or data-loading changes: loading finishes, active navigation is correct, requests succeed, and no relevant browser/server errors occur. For shared server/client output, test both client navigation and full reload after compilation settles; investigate hydration errors rather than dismissing them as HMR.
- Load the browser skill and use installed `agent-browser` against the managed service. Capture at 2× scale (`agent-browser set viewport 1280 720 2`). Save review media in `.amp/in/artifacts/`, inspect it, and embed screenshots for UI fixes when practical. Keep scratch output in `tmp/`.
- For entity lists, server-load/dehydrate only the active entity's initial page plus shared counts; use client requests for filtering/pagination, not every entity dataset.
- Audit shared URL/rendering helper call sites before changing them. Keep section-specific navigation links local rather than changing canonical entity URLs.
- Verify debugging hypotheses with logs/network evidence. Inspect raw CDP events before concluding security headers such as `Origin` are absent.

# User preferences

- Persist requests to remember guidance in this project-level `AGENTS.md`.
- Show color changes in both light and dark mode.
- After significant functionality changes, explain architecture/data flow, reused or added code, environment-specific behavior, validation/security boundaries, and important limitations.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
