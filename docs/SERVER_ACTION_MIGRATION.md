# Server Action migration plan

## Decision

Nimble Nexus will gradually remove Next.js Server Actions from browser-to-server
communication. New interactive features should use stable Route Handler URLs
instead.

This is a reliability decision, not a claim that Server Actions never work. A
Server Action's client reference contains a build-specific action ID. Next.js
documents that deployments can generate new IDs and that a client running an
older build can then fail with `Failed to find Server Action`. We have seen the
same failure class in long-lived editor tabs: the request can fail before
application validation or persistence code runs.

Stable HTTP routes avoid that build-ID coupling. They also give us explicit
request validation, status codes, serialization, observability, and testable
security boundaries.

The target is **zero application Server Actions**, reached incrementally rather
than through a flag-day rewrite.

## Keep the two HTTP surfaces separate

"Move to JSON APIs" does not mean putting every operation under `/api`.

| Surface | Purpose | Contract | Access |
| --- | --- | --- | --- |
| `/api/*` | Public, third-party API | JSON:API v1.1, documented in `docs/API.md` | Public reads are CORS-enabled; mutation auth and CORS must be designed before exposing third-party writes |
| `/_actions/*` | Internal web UI backend | Plain JSON with typed, colocated contracts | Same-origin; cookie-authenticated when needed; no CORS |

The on-disk directory for the internal surface is `app/%5Factions`, because a
literal `app/_actions` directory is private to the Next.js router. Despite the
URL name, these are ordinary Route Handlers and do not use the `next-action`
transport.

Use these rules to choose a destination:

1. A public resource read that already has a public API should use `/api`.
2. A generally useful public resource read that belongs in the supported API
   may extend `/api` and `docs/API.md`.
3. A private, session-specific, or UI-specific read or mutation should use
   `/_actions`.
4. Server Components should call the service or repository directly. Do not
   add an HTTP round trip merely to avoid a Server Action directive.
5. Internal fetch operations should use JSON. File uploads may use multipart
   form data, and deliberately retained native HTML forms may use URL-encoded
   data, at stable `/_actions` routes.

Until a public mutation model exists, browser mutations belong under
`/_actions`. A true third-party `/api` mutation requires non-cookie credentials
(for example, bearer or API tokens), an explicit origin and preflight policy,
allowed methods and headers, JSON:API request documents and responses, and API
documentation. A same-origin session-cookie mutation placed under `/api` is
still an internal web mutation and must have the same CSRF protection as
`/_actions`; its path does not make it safe or public. Wildcard CORS cannot be
combined with credentialed cross-origin cookie requests.

## Existing transport precedent

The stable-route transport has working precedents in:

- Adventure create/update: `app/%5Factions/createAdventure` and
  `app/%5Factions/updateAdventure`
- Statblock picker reads: `app/%5Factions/statblockPickerSearch`
- Typed client transport: `lib/contract.ts`
- The `/_actions/` exception to the Server Action-specific gate in `proxy.ts`
- Route, transport, ownership, cache-isolation, and JSON date-revival tests
  under `app/%5Factions`
- Deployment polling and the manual refresh prompt in
  `components/layout/StaleDeploymentBanner.tsx`

Wave 0 brought every existing state-changing internal handler up to the
security and error contract below. They now use the shared `internalAction`
boundary for exact-origin and media-type checks, record unexpected failures in
telemetry, and return generic `500` responses instead of exposing exception
messages as `400` responses.

The stale-deployment banner remains useful during the migration and for stale
assets generally. It is not the primary fix: users should not have to refresh
before a stable-route save.

## Baseline inventory (August 2026)

An automated scan currently finds 45 modules with a module-level
`"use server"` directive:

- 37 action/boundary modules, with about 126 exported functions
- 8 repository modules, with about 78 exported functions

Not every export necessarily reaches a client bundle, and export count is not
the unit of delivery. Inline function-level directives are also possible and
must be inventoried separately. A migration slice is a complete user flow and
all of its callers. The counts are a progress indicator and should trend to
zero.

### User-facing writes

- Core content CRUD: `app/actions/{monster,item,encounter,collection}.ts`
- Character options: `app/actions/{ancestry,background,class,subclass}.ts`
- Other builders: `app/actions/companion.ts`, `app/families/actions.ts`,
  `app/spell-schools/actions.ts`, and `app/custom-rules/actions.ts`
- Duplicate edit actions: `app/collections/[id]/edit/actions.ts` and
  `app/encounters/[id]/edit/actions.ts`
- Drafts and secondary writes: `app/actions/classDraft.ts`,
  `app/actions/{conditions,reactions,reports,user}.ts`
- Relationship writes: collection membership operations in
  `app/actions/collection.ts` and encounter membership in
  `app/actions/encounter.ts`

### Browser-invoked reads

- Public and owner pagination in `app/{monsters,items,encounters,ancestries,backgrounds,hazards,companions}/actions.ts`,
  `app/my/*/actions.ts`, and `app/u/[username]/actions.ts`
- Entity/options/search loaders in `lib/actions/entities.ts`,
  `lib/services/sources/actions.ts`, `components/shared/search-creators-action.ts`,
  and several content action files
- User-specific reads for reactions, reports, conditions, drafts, navigation
  counts, collections, encounters, families, and spell schools

### Admin workflows

`app/admin/actions.ts` contains 22 actions for awards, sources, entity search,
and six upload-preview-commit/cancel workflows. These use native form actions,
redirects, multipart uploads, preview sessions, bulk writes, and broad cache
invalidation. They are a distinct, high-complexity migration wave.

### Repository directives

Eight files under `lib/services/*/repository.ts` use `"use server"` as a
server-only marker. That directive means "make exported async functions Server
Actions," not merely "keep this code off the client." After browser callers
have been removed, select a real server-only boundary and replace these
directives. The choice must work for both Next.js and CLI tooling such as seed
scripts; adding `import "server-only"` indiscriminately may break non-Next
entrypoints. Audit and test the import graph so client modules cannot pull
database code into their bundles.

## Required internal-route contract

Every migrated `/_actions` operation must preserve these properties.

### Request and response

- Define the typed client contract next to the route, following the existing
  `app/%5Factions/<feature>/contract.ts` pattern.
- Validate the request body at the route boundary with Zod. Types alone are not
  validation.
- Treat malformed JSON separately from a schema mismatch; neither should become
  an unhandled 500.
- Return only the data the client needs, not raw database rows.
- Use a consistent status vocabulary:
  - `400` malformed JSON or request shape
  - `401` unauthenticated
  - `403` authenticated but not allowed
  - `404` resource not found or deliberately hidden
  - `409` state conflict
  - `413` request exceeds an explicit payload limit
  - `415` unsupported request media type
  - `422` well-formed input rejected by domain validation, when distinguishing
    it from malformed input helps the caller
  - `429` rate limited, with `Retry-After` when applicable
  - `500` unexpected failure with a generic client message
- Use `204` for successful operations with no response body. Extend
  `lib/contract.ts` before the first such route so `call()` does not try to parse
  an empty response.
- Before Wave 3, make the typed transport support bodyless `GET`, `204`/`void`,
  `AbortSignal`, and typed failures that retain HTTP status and a stable error
  code. Use `GET` for safe reads that fit in URL parameters rather than making
  `POST` the default merely because the picker precedent uses it.

The exact error envelope may remain the established internal `{ error: string }`
shape. Do not reuse the public JSON:API error envelope for private routes.

### Authentication and security

- Treat every route as a public entry point, even when the UI only renders it
  for authenticated users.
- Authenticate in the handler with `auth()` and authorize the specific
  resource operation. Rendering-time checks are not authorization.
- Derive user and owner identity from the session. Never accept an owner ID from
  a client as authority.
- Keep `/_actions` free of CORS headers.
- Every cookie-authenticated `POST`, `PUT`, `PATCH`, or `DELETE` must pass an
  exact same-origin check before its body is parsed. Compare `Origin` with the
  trusted externally visible origin, including scheme and port. The only
  fallback for clients that omit `Origin` requires both
  `Sec-Fetch-Site: same-origin` and an exact-origin `Referer`; missing or
  malformed evidence fails closed. Do not reuse the existing Server Action
  hostname/suffix allowlist, which has different semantics.
- Enforce `application/json` for JSON fetches, `multipart/form-data` for
  uploads, and `application/x-www-form-urlencoded` only for explicitly retained
  native forms. Return `415` for a mismatch. No-CORS responses alone are not
  CSRF protection because browsers can still submit credentialed simple forms.
- Validate IDs and relationship targets, then enforce ownership in the service
  or repository query. A valid UUID is not authorization.
- Do not return exception messages that may reveal database or infrastructure
  details. Record unexpected exceptions in telemetry and return a generic
  message.

The visible origin follows the app's reverse-proxy convention:
`X-Forwarded-Proto` and `X-Forwarded-Host` take precedence over the direct URL
and `Host`. This is secure only when the trusted edge overwrites or strips
client-supplied forwarded headers. Fly.io provides that boundary in production;
alternate deployments must preserve the same invariant.

### Data and caching

- Model the JSON wire type separately when domain values contain `Date` or other
  non-JSON values. Revive values before they reach components that expect domain
  types, as the statblock picker does.
- Include authenticated user identity in React Query keys for private data, but
  do not send that cache-only identity as authority in the request.
- Return `Cache-Control: private, no-store` for authenticated private reads
  unless a different cache policy is explicitly justified and tested.
- Preserve every current `revalidatePath`/tag side effect in the handler.
- After a successful mutation, explicitly invalidate/update relevant React
  Query caches and use `router.push`, `router.replace`, or `router.refresh` when
  navigation or an RSC refresh is required. A Route Handler response does not
  carry Server Action Flight re-render behavior.
- Once a client version uses a stable route, keep its request and response
  contract compatible with the next server deployment. Compatibility includes
  fields, enums, statuses/error codes, route retention, and expand/contract
  database migrations. Default to at least one full deployment interval; use a
  longer documented window for tabs commonly left open longer.

The first Server Action-to-route cutover cannot make a tab loaded before that
migration use the new route. Keeping the source export also does not preserve
its build-specific action ID. For that one deployment, preserve drafts and show
a refresh/retry path. If uninterrupted operation from the old action is a hard
requirement, retain and version-route the old built deployment. The normal
compatibility promise begins with client N on the stable route against server
N+1.

### Observability and UX

- Wrap handlers in `telemetry()` and attach resource/user identifiers that are
  safe to record.
- Unexpected errors that are converted to responses must still be recorded on
  the active span; `telemetry()` can only record errors allowed to escape its
  handler. Prefer a shared conversion wrapper once that pattern repeats.
- Preserve pending-state controls and the user's unsaved input on transport
  errors.
- Show actionable errors at the operation's existing UI location. Avoid both an
  inline error and a duplicate global toast.
- Do not automatically retry non-idempotent creates. Deletes and updates should
  only retry when their idempotency is established.

## Migration waves

Each wave consists of small, reviewable vertical slices. Do not migrate every
file in a wave in one change.

### Wave 0 — harden and prevent growth

Complete:

1. This document and `CONTRIBUTING.md` prohibit new interactive Server Actions.
2. `internalAction` enforces exact origin and media type on every existing
   state-changing `/_actions` handler, including JSON, multipart, and bodyless
   delete operations.
3. Malformed bodies have intentional `400` responses; known domain input errors
   remain actionable; unexpected errors are recorded and converted to generic
   `500` responses.
4. The AST inventory ratchet runs in `make check`, tracks module and inline
   directives, and separates application actions from repository-marker misuse.
5. Focused, full-suite, live HTTP, and browser checks cover allowed and rejected
   requests without adding CORS.

### Wave 1 — saves in long-lived editors

Migrate create and update flows first, because losing an edit is the highest
user impact:

1. Monster and hazard builders (partially mixed today between actions and the
   existing public monster mutation routes)
2. Item builder
3. Encounter and collection editors, consolidating their duplicate update
   implementations
4. Ancestry, background, class, subclass, companion, family, spell-school, and
   custom-rule builders
5. Class draft save/load/delete

For each entity, decide explicitly whether existing `/api` mutation handlers
are truly supported public JSON:API operations. Do not make a client depend on
an inconsistent or undocumented public mutation merely because it already
exists. The current monster POST/DELETE responses need runtime validation,
JSON:API contract alignment, and a deliberate auth/CORS design before they can
serve that role. Until then, use `/_actions`.

### Wave 2 — secondary mutations

Migrate destructive and small writes:

1. Entity deletes
2. Add/remove collection members and add/remove encounter members
3. Reaction toggles and reports
4. Conditions
5. Banner dismissal and other user preferences

Where many relationship actions differ only by entity type, use one validated
discriminated request and one authorization path rather than recreating eight
near-identical handlers. Keep service-level domain operations separate when
their authorization or side effects genuinely differ.

### Wave 3 — browser reads

Server Actions serialize client reads sequentially and retain the same stale-ID
risk, so migrate them even though they do not write data.

1. Switch public lists/details already represented by `/api` to the existing
   JSON:API client modules.
2. Add missing public API reads only when they are appropriate as supported
   third-party contracts; document them in `docs/API.md`.
3. Move private "my content," draft, reaction/report state, and UI-only option
   lookups to stable `/_actions` handlers.
4. Replace browser action calls with React Query query options. Preserve cursor
   semantics, filters, private cache identity, and JSON wire conversion.
5. Replace Server Component action imports with direct service calls instead of
   HTTP calls.
6. Add a client-N-contract-against-server-N+1 test for routes whose contracts
   change, and retain old accepted shapes for the documented compatibility
   window.

Likely slices are public/owner pagination by entity family, then sources and
creator search, then generic entity/option loaders, navigation counts, and
other session-specific reads.

### Wave 4 — admin workflows

Migrate `app/admin/actions.ts` by workflow, not by individual function:

1. Awards and entity search
2. Source CRUD
3. Upload-to-preview session creation
4. Commit/cancel for each official-content type

Use stable internal handlers with explicit admin checks. Choose one submission
model for each workflow:

- convert it to a Client Component/fetch operation using JSON; or
- retain native forms with validated URL-encoded or multipart bodies and a
  `303 See Other` post/redirect/get response (not `307`, which preserves POST).

Bound action arguments must become route parameters or validated hidden fields.
Upload handlers must enforce same-origin requests and hard ingress/application
limits even when `Content-Length` is missing or dishonest. Test `413` plus file
count, individual size, aggregate size, and parsed-content limits; Route
Handlers do not inherit the Server Action 1 MB limit.

The current preview sessions are short-lived bearer references usable by any
authenticated admin, not owner-bound sessions. Decide whether to bind them to
the initiating admin; either way, specify expiry, one-time commit/cancel,
replay, and concurrency behavior. Likewise, current bulk imports use sequential
upserts rather than one transaction. Decide whether atomicity is required or
preserve and test partial-progress/idempotent-retry behavior. Preserve all cache
invalidation and add route tests before removing the native form actions.

### Wave 5 — framework and repository cleanup

1. Replace the remaining sign-in action with the supported Auth.js route/client
   flow after verifying its redirect behavior.
2. Remove any action wrappers left only for Server Component callers and call
   services directly.
3. Select and test a server-only import boundary compatible with Next.js and
   CLI tooling, then replace repository `"use server"` directives after
   auditing all callers.
4. Remove the Server Action branch from `proxy.ts`, its allowed-origin
   configuration, and action-specific tests only after the inventory reaches
   zero and production traffic shows no `next-action` requests.
5. Retain the deployment banner if it remains valuable for stale assets; assess
   it independently from this migration.

## Vertical-slice checklist

Use this checklist in every migration change:

- [ ] Find every caller of the action export, including server components,
      query option factories, forms, bound actions, and tests.
- [ ] Record current auth, ownership, validation, return/error, navigation,
      revalidation, and telemetry behavior.
- [ ] Choose public `/api`, internal `/_actions`, or a direct server-only service
      call using the rules above.
- [ ] Add a runtime request schema and a minimal typed wire contract.
- [ ] Enforce exact same-origin and the intended request media type for a
      cookie-authenticated mutation.
- [ ] Implement the handler by delegating to the existing service/repository;
      do not duplicate persistence logic.
- [ ] Preserve authorization and derive identity from the session.
- [ ] Preserve cache invalidation and replace implicit Flight refresh/navigation
      with explicit client behavior.
- [ ] Handle JSON serialization and private React Query cache keys.
- [ ] Add route tests for success, malformed input, unauthenticated,
      unauthorized/not-found, wrong origin/media type, service failure, and
      invalidation.
- [ ] Add client transport/query tests proving a stable URL and no
      `next-action` header.
- [ ] Browser-test create/update/error or read/filter/pagination states as
      applicable, including normal navigation and full reload.
- [ ] Remove all migrated callers and the old action export in the same slice;
      do not leave a permanent dual transport. Document that pre-migration tabs
      need the refresh/retry path for this first cutover.
- [ ] Run the required formatter, focused tests, and `make check`.
- [ ] Lower the Server Action inventory baseline.

## Definition of done

An operation is migrated when:

1. Browser traffic uses a stable route URL and carries no `next-action` header.
2. The handler validates, authenticates, authorizes, records telemetry, and
   enforces origin/media type before returning an intentional HTTP contract.
3. Existing navigation, cache freshness, pending state, and errors still work.
4. Tests cover the route boundary and client transport, not only the service.
5. The old action export and all browser imports are removed.

The global migration is complete when:

- no module-level or inline `"use server"` directives remain in application
  code;
- production browser traffic contains no `next-action` requests;
- the Server Action proxy/configuration code is removed;
- all public endpoints used by the UI conform to and are documented as
  JSON:API, while private UI endpoints remain same-origin and undocumented as a
  public contract; and
- an open tab running one deployed client version can continue its supported
  reads and writes after the next compatible server deployment without a
  refresh.

## Progress log

Update this table when a vertical slice lands. Link the change and note any
contract compatibility window that a future migration must preserve.

| Area | Status | Notes |
| --- | --- | --- |
| Wave 0 boundary hardening | Complete | Shared guard, safe errors, telemetry, tests, and CI ratchet |
| Adventure create/update | Complete | Stable, hardened `/_actions` JSON routes |
| Adventure statblock picker | Complete | Hardened internal search route; private cache isolation and date revival covered |
| Adventure image operations | Complete | Hardened upload and delete route handlers |
| Core content builders | Complete | Monster, hazard, item, encounter, and collection create/update use stable `/_actions` JSON routes |
| Character-option builders | Not started | Wave 1 |
| Drafts | Not started | Wave 1 |
| Deletes and relationship writes | Not started | Wave 2 |
| Reactions, reports, conditions, preferences | Not started | Wave 2 |
| Public browser reads | Not started | Wave 3; prefer existing JSON:API |
| Private/UI-specific browser reads | Partially complete | Picker complete; remaining reads are Wave 3 |
| Admin workflows | Not started | Wave 4 |
| Auth/framework cleanup | Not started | Wave 5 |
| Repository directives | Not started | Wave 5 |
