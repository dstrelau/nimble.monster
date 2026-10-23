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
| Character-option builders | Complete | [Ancestry create/update](https://ampcode.com/threads/T-01a12d95-8eed-738f-b3d0-5cdd70bde1ce), [background create/update](https://ampcode.com/threads/T-01a12ea6-7074-774d-83e8-fb1aafc4b471), [class create/update](https://ampcode.com/threads/T-01a12fb9-1a91-7239-8aec-2d85c9f642a9), [subclass create/update](https://ampcode.com/threads/T-01a131de-6489-707c-8e6c-58bb0194dc05), [companion create/update](https://ampcode.com/threads/T-01a13403-bbd1-768c-bf19-0288a298516d), [family create/update](https://ampcode.com/threads/T-01a13516-5c8e-72bf-bf74-c2dc2fe983e6), [spell-school create/update](https://ampcode.com/threads/T-01a13629-09df-7764-a771-a0a9c46381aa), and [custom-rule create/update](https://ampcode.com/threads/T-01a1384e-59c8-716d-8cb2-6133f8114ab2) complete |
| Drafts | Complete | Class/subclass draft save/load/delete use stable `/_actions/classDraft` GET/POST/DELETE |
| Deletes and relationship writes | Partially complete | [Monster/hazard deletion](https://ampcode.com/threads/T-01a13a73-a887-7119-b01e-78b7a94f4db6), [item deletion](https://ampcode.com/threads/T-01a13c98-fff1-70db-8069-f73ee3f1805b), [encounter deletion](https://ampcode.com/threads/T-01a13dab-a15d-7443-94f8-d96e9f856073), [collection deletion](https://ampcode.com/threads/T-01a13ebe-4c4c-7488-b3e4-cc6d709ec057), [ancestry deletion](https://ampcode.com/threads/T-01a13fd0-f6d8-71da-90c0-5802c407f5dd), [background deletion](https://ampcode.com/threads/T-01a140e3-9c3e-736f-ae30-237797e4ebc0), [class deletion](https://ampcode.com/threads/T-01a141f6-ab29-7486-a38e-0cf7979d41a5), [subclass deletion](https://ampcode.com/threads/T-01a1441b-eb0c-739a-9999-8b3be511c56c), [companion deletion](https://ampcode.com/threads/T-01a1452e-6f24-7362-a486-d87159dee0a1), [family deletion](https://ampcode.com/threads/T-01a14641-5148-70ec-822b-a77be155af1d), [spell-school deletion](https://ampcode.com/threads/T-01a14753-b964-771c-84f1-75ed7ecd56f7), and [custom-rule deletion](https://ampcode.com/threads/T-01a15993-16a3-748b-8f4f-08dfd4c166a5) complete; collection and encounter relationships are next in Wave 2 |
| Collection membership | Complete | Monster/hazard, item, spell-school, companion, ancestry, background and [subclass additions](https://ampcode.com/threads/T-01a16113-ad31-73be-bbe1-1162b11fed6d) use stable JSON; [unused class action removed](https://ampcode.com/threads/T-01a16671-16c8-767b-b110-eb5a4fc52e2f); editor-based class additions/replacement/removal already use `saveCollection` |
| Encounter membership | Complete | [Monster/hazard additions and count updates](https://ampcode.com/threads/T-01a1655e-8e04-772b-a2ed-9a26ffdf8f83) use stable JSON; editor-based replacement/removal already uses `saveEncounter` |
| Reactions, reports, conditions, preferences | Partially complete | [Reaction toggles](https://ampcode.com/threads/T-01a169aa-0746-735a-a7c0-8446cab7f985) use stable JSON; reports are next in Wave 2 |
| Public browser reads | Not started | Wave 3; prefer existing JSON:API |
| Private/UI-specific browser reads | Partially complete | Picker complete; remaining reads are Wave 3 |
| Admin workflows | Not started | Wave 4 |
| Auth/framework cleanup | Not started | Wave 5 |
| Repository directives | Not started | Wave 5 |

### Ancestry saves — October 2026

- `BuildAncestryView` (the only create/update caller) uses typed JSON POSTs to
  `/_actions/createAncestry` (201) and `/_actions/updateAncestry` (200), returning
  only `{ id, name }`. The service/repository still derives ownership from the
  session and hides non-owned/missing updates behind 404. No public API mutation
  or repository Server Action boundary changed.
- Runtime validation matches builder fields; exact-origin/media-type checks,
  telemetry-safe 500s, list/detail revalidation, both React Query invalidations,
  canonical navigation and explicit refresh are preserved. Failed requests keep
  the draft, show one inline error and re-enable retry without automatic creates.
- Removed `createAncestry` and `updateAncestry` from `app/actions/ancestry.ts`;
  that module retains only public lookup and delete. Application ratchet:
  **112 → 110** exports; repository markers remain unchanged.
- Route-boundary, stable-URL/no-`next-action`, pending/error/navigation tests
  accompany live authenticated create/update, persistence/reload, malformed-input,
  unauthorized, non-owner, wrong-origin and wrong-media checks. QA data is removed
  after verification.
- Retain both URLs and these accepted request/response shapes for at least one
  full deployment interval. Tabs loaded before this cutover still need the
  existing refresh/retry path; subsequent compatible deployments must preserve
  stable-route saves. Background saves are the next bounded Wave 1 slice.

### Background saves — October 2026

- The only create/update caller, `BuildBackgroundView`, now uses typed JSON
  POSTs to `/_actions/createBackground` (201) and `/_actions/updateBackground`
  (200), returning only `{ id, name }`. Ownership remains session-derived in
  the existing service/repository; missing and non-owned updates return 404.
- Runtime schemas validate and trim builder fields and validate IDs. The shared
  boundary preserves exact-origin/media-type checks, telemetry-safe 500s and
  no CORS. Owner-list and canonical detail invalidation are retained; public
  list invalidation, both React Query invalidations and explicit refresh keep
  post-save navigation fresh. Failures retain the draft, show one inline error
  and re-enable retry without automatically repeating creates.
- Removed `createBackground` and `updateBackground` from
  `app/actions/background.ts`, leaving lookup and delete for later waves.
  Application ratchet: **110 → 108**; repository markers are unchanged.
- Route-boundary and builder/client-transport tests cover both operations,
  stable URLs without `next-action`, pending/error UX, auth, validation,
  ownership, safe failures and cache invalidation. Live HTTP and browser QA
  exercise authenticated create/update and persisted results; QA records are
  removed after verification.
- Retain both URLs and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs need the existing refresh/retry path.
  Class saves are the next bounded Wave 1 slice.

### Class saves — October 2026

- `BuildClassView`, the only create/update caller, uses typed JSON POSTs to
  `/_actions/createClass` (201) and `/_actions/updateClass` (200), returning
  only `{ id, name }`. Routes delegate to the unchanged transactional database
  operations, deriving ownership from the session. Missing and non-owned
  updates return 404, and client-supplied owner identity is ignored.
- Runtime validation covers all builder fields, including nested level abilities,
  all three weapon-spec shapes, saves, option lists/items and visibility.
  Empty editor placeholders are still filtered by the builder before transport.
  Exact-origin/media-type checks, telemetry-safe failures, owner-list and
  canonical detail invalidation remain; public-list invalidation and explicit
  refresh keep navigation fresh without a Flight mutation response.
- Pending controls, inline errors, preserved drafts and successful-save draft
  deletion remain unchanged. Class draft autosave/load/delete still use their
  existing actions and belong to the separate documented draft slice.
- Removed `createClass` and `updateClass` from `app/actions/class.ts`; searches,
  lookup and delete remain for later waves. Application ratchet: **108 → 106**;
  repository markers are unchanged.
- Route-boundary and builder/client-transport tests cover both operations and
  stable URLs without `next-action`. Live authenticated requests verify create,
  replacement updates of ordered abilities/options, ownership, validation,
  origin/media rejection and persisted detail rendering. Browser QA covers
  create/update, navigation/full reload and transport-error draft retention/retry.
  QA users/content and nested records are cleaned up after verification.
- Retain both URLs and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs need the existing refresh/retry path.
  Subclass saves are the next bounded Wave 1 slice.

### Subclass saves — October 2026

- `BuildSubclassView`, the only create/update caller, uses typed JSON POSTs to
  `/_actions/createSubclass` (201) and `/_actions/updateSubclass` (200).
  Responses contain `{ id, name, namePreface? }`; the preface is required for
  correct canonical navigation. Routes delegate to database operations,
  deriving ownership from the session and returning 404 for missing/non-owned
  updates. Class IDs remain optional informational references as before.
- Runtime validation covers all builder fields, nested level abilities and inline
  option lists/items. Descriptive example-ability IDs are accepted because the
  repository generates new persisted UUIDs. Session identity, source IDs and
  existing ability-list links are not accepted as builder authority; only inline
  options are submitted by this caller. No public API or repository boundary changed.
- Follow-up ownership hardening requires every existing option-list reference to
  belong to the subclass creator, validated before create/update writes. Updates
  retain requested list IDs and delete only replaced, exclusively linked lists
  owned by that creator; legacy foreign/shared links are detached without deleting
  their underlying lists. A read-only production audit found 346 subclasses and
  28 links, with zero cross-owner, shared or dangling links; no data repair was
  required. Real SQLite regression tests cover rejection without partial writes,
  retained-list ordering and safe replacement/detachment.
- Exact-origin/media checks, telemetry-safe errors, owner-list and canonical
  detail invalidation remain. Public-list invalidation and explicit refresh keep
  post-save navigation fresh. Pending controls, inline errors, retained input,
  successful-save draft deletion and no automatic create retries are preserved.
  Class draft and class-option lookup actions remain for their separate waves.
- Removed `createSubclass` and `updateSubclass` from `app/actions/subclass.ts`;
  lookup/search/list/delete remain. Application ratchet: **106 → 104** exports;
  repository markers are unchanged.
- Route-boundary and builder transport tests cover both operations and stable
  URLs without `next-action`. Live authenticated requests verify ownership,
  replacement of ordered nested abilities/options, persisted detail rendering,
  malformed/invalid input, unauthorized/non-owner, origin and media rejection.
  Browser QA covers example create, edit, normal navigation/full reload and
  transport-error retained input/retry. Test-owned users/content/nested data are
  removed after verification.
- Retain both URLs and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Companion saves are the next bounded Wave 1 slice.

### Companion saves — October 2026

- `BuildCompanionView`, the only browser save caller, uses typed JSON POSTs to
  `/_actions/createCompanion` (201) and `/_actions/updateCompanion` (200), returning
  only `{ id, name }`. Both routes delegate to the existing database operations;
  ownership comes from the authenticated session, never from the request.
  Updates preserve the owner-scoped lookup before persistence and hide missing
  or non-owned records behind 404. CLI seed calls remain direct database calls.
- Runtime validation covers every builder field, including size, wounds,
  string HP/level expressions, actions, abilities and optional Paperforge images.
  Example/editor action and ability IDs remain strings; persistence retains
  its existing action-ID stripping. Empty optional editor text is still accepted.
  No public API, database schema or repository boundary changed.
- The shared boundary enforces exact origin and JSON media type, records unexpected
  failures and returns generic 500s without CORS. Owner-list and detail revalidation
  remain; public-list revalidation and explicit refresh keep post-save navigation
  fresh. Both query invalidations, pending controls, single inline errors, retained
  input and manual retry remain, without automatic create retries.
- Removed `createCompanion` and `updateCompanion` from `app/actions/companion.ts`;
  public lookup and delete remain for later waves. Application ratchet:
  **104 → 102** exports; repository markers are unchanged.
- Route and builder transport tests cover both stable URLs without `next-action`,
  authentication, owner checks, nested validation, boundary rejection, telemetry-safe
  failures, cache freshness and pending/error/retry behavior. Live authenticated
  requests exercise both operations, persisted scalar/nested fields and error
  statuses; browser QA covers example create, edit, normal navigation/full reload
  and transport-failure retained input/retry. Test-owned content/users are cleaned
  up after verification.
- Retain both URLs and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs need the existing refresh/retry path.
  Family saves are the next bounded Wave 1 slice.

### Family saves — October 2026

- `CreateEditFamily`, the only create/update caller, uses typed JSON POSTs to
  `/_actions/createFamily` (201) and `/_actions/updateFamily` (200), returning
  only `{ id, name }`. Both delegate to the existing database operations;
  ownership remains session-derived and updates remain owner-scoped in SQL.
  Missing/non-owned updates return 404. Public visibility and ability persistence
  are unchanged; no public API or repository boundary changed.
- The form and route share the existing field-validation schema, with ability
  IDs required on the wire and UUID validation for updates. Exact-origin/JSON
  checks, telemetry-safe failures and all existing owner-list, user-profile and
  detail revalidation are preserved. Canonical navigation uses the saved name
  and explicitly refreshes. Failed HTTP/network requests retain input, show one
  inline error and re-enable manual retry without repeating creates automatically.
- Removed `createFamily` and `updateFamily` from `app/families/actions.ts`;
  list and delete remain for later waves. Application ratchet: **102 → 100**
  exports; repository markers are unchanged.
- Route-boundary and real-form client transport tests cover both operations,
  stable URLs without `next-action`, validation/auth/ownership, safe failures,
  pending/error/retry behavior and fresh navigation. Live authenticated HTTP and
  browser QA verify create/update, persisted ability replacement, normal
  navigation/full reload and transport-error draft retention. Test-owned
  content/users are cleaned up after verification.
- Retain both URLs and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs need the existing refresh/retry path.
  Spell-school saves are the next bounded Wave 1 slice.

### Spell-school saves — October 2026

- `BuildSchoolView`, the only create/update caller, uses typed JSON POSTs to
  `/_actions/createSpellSchool` (201) and `/_actions/updateSpellSchool` (200),
  returning only `{ id, name }`. Routes reuse the existing database operations;
  ownership remains session-derived and missing/non-owned updates return 404.
  School visibility, nested spell replacement and legacy/current spell versions
  are preserved. No public API or repository boundary changed.
- Runtime validation matches the editor fields, including all target variants,
  tier/action bounds, optional text and spell versions. Editor IDs and untrusted
  owner/source fields are stripped at the boundary. Exact-origin/JSON enforcement,
  telemetry-safe failures and all existing list/profile/detail revalidation remain.
  Canonical navigation explicitly refreshes; failures keep school/spell input,
  display one inline error and enable manual retry without automatic creates.
- Removed `createSpellSchool` and `updateSpellSchool` from
  `app/spell-schools/actions.ts`; reads and delete remain for later waves.
  Application ratchet: **100 → 98** exports; repository markers are unchanged.
- Route-boundary and real-builder transport tests cover both stable URLs without
  `next-action`, validation/auth/ownership, safe failures, pending/error/retry
  behavior and fresh navigation. Live authenticated HTTP and browser QA verify
  create/update, persisted replacement spells, versions and targeting, normal
  navigation/full reload and transport-error retained input. Test-owned users,
  schools and spells are cleaned up after verification.
- Retain both URLs and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs need the existing refresh/retry path.
  Custom-rule saves are the next bounded Wave 1 slice.

### Custom-rule saves — October 2026

- `CustomRuleForm`, the sole create/update caller, uses typed JSON POSTs to
  `/_actions/createCustomRule` (201) and `/_actions/updateCustomRule` (200),
  returning only `{ id, name }`. Existing database operations retain
  session-derived ownership, transactional writes and official-rule link
  normalization, validation and replacement. Missing/non-owned updates return
  404; unknown official-rule links return actionable 422 errors before writes.
- Runtime schemas validate every editor field, link relation and update UUID;
  untrusted owner identity is stripped. Exact-origin/JSON enforcement and
  telemetry-safe generic failures use the shared internal boundary without CORS.
  Existing list/detail revalidation remains; canonical navigation explicitly
  refreshes. Pending controls, retained input, one inline error and manual retry
  work for HTTP and network failures without automatically repeating creates.
- Removed `createCustomRuleAction` and `updateCustomRuleAction` from
  `app/custom-rules/actions.ts`; delete remains for Wave 2. Application ratchet:
  **98 → 96** exports; repository markers and public APIs are unchanged.
- Route-boundary and real-form transport tests cover both stable URLs without
  `next-action`, validation/auth/ownership, safe failures and fresh navigation.
  Live authenticated HTTP and browser QA cover both saves, persisted text and
  link replacement, navigation/full reload and failure input retention/retry.
  Test-owned rules, links and users are removed after verification.
- Retain both URLs and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs need the existing refresh/retry path.
  Class draft save/load/delete is the next bounded Wave 1 slice.

### Class drafts — October 2026

- The shared `useClassDraft` hook, used by both `BuildClassView` and
  `BuildSubclassView`, uses typed GET/POST/DELETE requests to
  `/_actions/classDraft`. GET takes an optional UUID `classId` query parameter;
  POST accepts `{ classId: UUID | null, data: JSON object }`; DELETE accepts
  `{ classId: UUID | null }`. Responses are 200 JSON: `{ draft: { data,
  updatedAt } | null }`, `{ updatedAt }`, and `{ success: true }`, respectively.
- Authentication and the `class-draft-autosave` feature flag are enforced on
  every request. The existing service/repository scopes all operations to the
  session's Discord identity, not a supplied owner. Drafts are private per-user
  scratch space, not changes to the referenced class. New-class and new-subclass
  forms retain their existing shared null/`__new__` key; separating these draft
  namespaces is outside this transport migration.
- Runtime validation accepts incomplete editor JSON objects and validates IDs.
  Mutations use the shared exact-origin/JSON boundary; reads return private,
  no-store responses including errors. Unexpected failures are recorded in
  telemetry with generic 500s and no CORS. There was no path/tag or React Query
  cache invalidation in the old draft flow; none is added.
- Three-second debounce, restore/stale comparison, discard and successful-save
  cleanup remain in the existing hook. Best-effort failures preserve editing
  and the last confirmed save time, with no unhandled fetch rejection, global
  toast or automatic retry; a subsequent edit can save again. Successful entity
  saves still proceed if draft cleanup fails, matching the former action result.
- Removed all three Server Actions and their module `app/actions/classDraft.ts`;
  action tests are replaced by route-boundary tests and the hook tests now use
  the real typed fetch transport. Application ratchet: **96 → 93** exports;
  repository markers and public APIs are unchanged.
- Tests cover auth/flag gating, validation, mutation origin/media rejection,
  generic telemetry-safe failures, JSON dates and stable URLs with no
  `next-action`. Live requests cover save/replacement/load/delete for null and
  UUID keys, per-user read/delete isolation, SQLite persistence and cleanup.
  Browser QA covers both builders, reload/restore/discard, draft removal after
  entity saves and retained input/retry after transport failure.
- Retain the URL, methods and accepted shapes for at least one full deployment
  interval. Pre-cutover tabs require the existing refresh/retry path. Wave 1 is
  complete; entity deletes are the next bounded Wave 2 slice.

### Monster and hazard deletion — October 2026

- `MonsterDetailActions`, the sole browser caller for both kinds, uses typed
  JSON POSTs to `/_actions/deleteBestiaryEntry` with `{ id: UUID, kind:
  "monster" | "hazard" }`, returning 200 `{ success: true }`. The existing
  service/repository deletes only when ID, session-derived owner and stored
  kind all match. Missing, non-owned, wrong-kind and already-deleted entries
  return 404; a client-supplied Discord identity is ignored.
- UUID/kind validation, exact-origin/JSON enforcement and safe unexpected 500s
  use the shared internal boundary. Telemetry records resource/user identifiers
  and deletion results. Owner-list invalidation is preserved and applied to
  hazards too; public lists and the matching detail page are also invalidated.
  Existing database cascades and search-index triggers are unchanged.
- The shared detail UI retains owner-only controls, permanent-delete confirmation,
  pending disable and the correct owner-list navigation. HTTP/network failures
  use its existing single error alert and re-enable manual retry without automatic
  requests. Other entity deletion callers and the public API are unchanged.
- Removed `deleteMonster` from `app/actions/monster.ts` and `deleteHazard` from
  `app/monsters/actions.ts`. Application ratchet: **93 → 91** exports; remaining
  read exports and repository markers are unchanged.
- Route-boundary and real-detail UI transport tests cover both kinds, stable
  URLs without `next-action`, auth, ownership outcomes, validation, safe failures,
  invalidation, confirmation, pending/error and retry. Live authenticated HTTP
  checks verify deletions persist, rejected requests retain data, search entries
  disappear and repeated deletes return 404. Browser QA covers both detail routes,
  cancellation, failure/retry, owner-list navigation and full reload. Test-owned
  copies of existing content and users are cleaned up after verification.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Item deletion is the next bounded Wave 2 slice.

### Item deletion — October 2026

- `ItemDetailActions`, the only browser caller, uses a typed JSON POST to
  `/_actions/deleteItem` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The existing service/repository deletes only when the item ID and session-derived
  owner match. Missing, non-owned and already-deleted items return 404; submitted
  owner identity is ignored. No public API or repository boundary changed.
- Runtime UUID validation, exact-origin/JSON enforcement, telemetry and generic
  unexpected 500s use the shared internal boundary without CORS. Owner-list
  invalidation is preserved; public-list and actual `/items/[itemId]` detail
  invalidation keep subsequent navigation fresh. Database cascades and search
  index triggers are unchanged.
- Owner-only controls, permanent-delete confirmation, pending disable and
  `/my/items` navigation remain in the shared detail UI. HTTP/network failures
  use its existing single error alert and enable manual retry, without automatic
  deletion requests or navigation away from the retained detail.
- Removed `deleteItem` from `app/actions/item.ts`; its public lookup remains
  for Wave 3. Application ratchet: **91 → 90** exports; repository markers remain.
- Route-boundary and real-detail transport tests cover stable URL/no `next-action`,
  auth, ownership outcomes, validation, generic failures, cache invalidation,
  confirmation, pending and error/retry UX. Live authenticated requests verify
  deletion persistence, rejected-request data retention, search-index removal,
  detail 404 and repeated-delete 404. Browser QA covers cancellation, network
  failure/manual retry, owner-list navigation and full reload. QA users/items
  and search records are removed and their absence verified.
- This slice reuses the earlier implementation reverted after an image-renderer
  deployment failure, with fresh local and authenticated production verification.
  Production QA uses short-lived sessions for disposable non-admin users, never
  a development-login bypass or a real user's content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Encounter deletion is the next bounded Wave 2 slice.

### Encounter deletion — October 2026

- `EncounterHeader`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteEncounter` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The existing database operation scopes deletion to the session-derived owner.
  Missing, non-owned and already-deleted encounters return 404; submitted owner
  identity is ignored. No public API or repository boundary changed.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s use the shared internal boundary without CORS. The existing recognized
  foreign-key conflict remains actionable as 409. Current monster membership
  cascades and adventure-node set-null behavior are unchanged.
- Owner-list invalidation remains; public-list and detail invalidation plus explicit
  refresh keep post-delete navigation fresh. Owner-only controls, confirmation and
  `/my/encounters` navigation remain. Delete is disabled while pending; HTTP/network
  errors show one actionable alert, retain the detail and enable manual retry.
- Removed `deleteEncounter` from `app/actions/encounter.ts` and its action-only
  tests; list/member actions remain. Application ratchet: **90 → 89** exports;
  repository markers are unchanged.
- Route-boundary and real-header transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, safe failures, conflict, invalidation and pending/error
  UX. Live authenticated requests verify deletion persistence, rejected-request
  retention, membership/search removal, detail 404 and repeated-delete 404. Browser
  QA covers confirmation cancellation, failure/retry, navigation and full reload.
  Disposable QA users/content are removed and their absence verified. Production
  verification uses short-lived sessions for test-owned non-admin users, not a
  development-login bypass or real-user content.
- Retain this URL and accepted shapes for at least one full deployment interval.
  Pre-cutover tabs still need the existing refresh/retry path. Collection deletion
  is the next bounded Wave 2 slice.

### Collection deletion — October 2026

- `CollectionHeader`, the only browser caller, uses a typed JSON POST to
  `/_actions/deleteCollection` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The existing database operation deletes only when the ID and session-derived
  owner match. Missing, non-owned and already-deleted collections return 404;
  submitted owner identity is ignored. Membership cascades remain unchanged;
  member entities are not deleted. No public API or repository boundary changed.
- Runtime UUID validation, exact-origin/JSON enforcement, telemetry and generic
  unexpected 500s use the shared internal boundary without CORS. The existing
  recognized foreign-key conflict remains actionable as 409. Owner-list
  invalidation remains; public-list and detail invalidation plus explicit refresh
  keep post-delete navigation fresh without a Flight mutation response.
- Owner-only controls, confirmation and `/my/collections` navigation remain.
  Delete is disabled while pending. HTTP/network errors show one actionable
  alert, retain the detail and enable manual retry without automatic requests.
- Removed `deleteCollection` from `app/actions/collection.ts` and its action-only
  tests; list/member actions remain. Application ratchet: **89 → 88** exports;
  repository markers are unchanged.
- Route-boundary and real-header transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, conflict, safe failures, invalidation and pending/error
  UX. Live authenticated requests verify rejected-request retention, persisted
  deletion, membership removal, detail 404 and repeated-delete 404. Browser QA
  covers cancellation, failure/manual retry, pending controls, navigation and
  full reload. Disposable users/collections/memberships are removed and their
  absence verified. Production QA uses short-lived sessions for disposable
  non-admin users, never a development-login bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Ancestry deletion is the next bounded Wave 2 slice.

### Ancestry deletion — October 2026

- `AncestryDetailActions`, the only browser caller, uses typed JSON POSTs to
  `/_actions/deleteAncestry` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The existing service/repository scopes deletion to the session-derived owner
  and verifies the session again at the repository boundary. Missing, non-owned
  and already-deleted ancestries return 404; submitted owner identity is ignored.
  Collection-membership cascades are preserved; collections are not deleted.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Existing public/owner-list
  invalidation remains; detail invalidation and explicit refresh keep navigation
  fresh. Owner-only controls, permanent-delete confirmation, pending disable and
  `/my/ancestries` navigation remain. HTTP/network errors retain the detail, show
  one actionable alert and enable manual retry without automatic requests.
- Removed `deleteAncestry` from `app/actions/ancestry.ts`; public lookup remains
  for Wave 3. Application ratchet: **88 → 87** exports; repository markers and
  public APIs are unchanged.
- Route-boundary and real-detail transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, generic failures, invalidation and pending/error UX.
  Live authenticated requests verify rejected-request retention, persisted deletion,
  membership removal, collection retention, detail 404 and repeated-delete 404.
  Browser QA covers cancellation, network failure/manual retry, pending controls,
  owner-list navigation and full reload. Disposable non-admin QA users/content
  are cleaned up with explicit absence checks; production uses short-lived
  Auth.js sessions, not a development-login bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Background deletion is the next bounded Wave 2 slice.

### Background deletion — October 2026

- `BackgroundDetailActions`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteBackground` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The existing service/repository scopes deletion to the session-derived owner.
  Missing, non-owned and already-deleted backgrounds return 404; submitted owner
  identity is ignored. Collection-membership cascades remain unchanged and do
  not delete collections. No public API or repository boundary changed.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner-list invalidation
  remains; public-list and detail invalidation plus explicit refresh keep navigation
  fresh. Owner-only controls, permanent-delete confirmation, pending disable and
  `/my/backgrounds` navigation remain. HTTP/network errors retain the detail,
  show one actionable alert and enable manual retry without automatic requests.
- Removed `deleteBackground` from `app/actions/background.ts`; public lookup
  remains for Wave 3. Application ratchet: **87 → 86** exports; repository markers
  and public APIs are unchanged.
- Route-boundary and real-detail transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, generic failures, invalidation and pending/error UX.
  Live authenticated requests verify rejected-request retention, persisted deletion,
  membership removal, collection retention, detail 404 and repeated-delete 404.
  Browser QA covers cancellation, network failure/manual retry, pending controls,
  owner-list navigation and full reload. Disposable non-admin QA users/content
  are cleaned up with explicit absence checks; production uses short-lived
  Auth.js sessions, not a development-login bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Class deletion is the next bounded Wave 2 slice.

### Class deletion — October 2026

- `ClassDetailActions`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteClass` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The unchanged database operation scopes deletion to the session-derived owner.
  Missing, non-owned and already-deleted classes return 404; submitted owner
  identity is ignored. Class abilities, collection memberships and option-list
  links cascade; collections and reusable option lists/items remain unchanged.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner-list invalidation
  remains; public-list and detail invalidation plus explicit refresh keep navigation
  fresh. Owner-only controls, permanent-delete confirmation, pending disable and
  `/my/classes` navigation remain. HTTP/network errors retain the detail, show
  one actionable alert and enable manual retry without automatic requests.
- Removed `deleteClass` from `app/actions/class.ts`; its four read exports remain
  for Wave 3. Application ratchet: **86 → 85** exports; repository markers and
  public APIs are unchanged.
- Route-boundary and real-detail transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, generic failures, invalidation and pending/error UX.
  Live authenticated requests verify rejected-request retention, persisted deletion,
  ability/membership/link removal, reusable-option and collection retention,
  detail 404 and repeat-delete 404. Browser QA covers cancellation, network
  failure/manual retry, pending controls, owner-list navigation and full reload.
  Disposable non-admin QA users/content are cleaned up with explicit absence
  checks; production uses short-lived Auth.js sessions, not a development-login
  bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Subclass deletion is the next bounded Wave 2 slice.

### Subclass deletion — October 2026

- `SubclassDetailActions`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteSubclass` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The unchanged database operation scopes deletion to the session-derived owner.
  Missing, non-owned and already-deleted subclasses return 404; submitted owner
  identity is ignored. Subclass abilities, collection memberships and option-list
  links cascade; collections and reusable option lists/items remain unchanged.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner-list invalidation
  remains; public-list and detail invalidation plus explicit refresh keep navigation
  fresh. Owner-only controls, permanent-delete confirmation, pending disable and
  `/my/subclasses` navigation remain. HTTP/network errors retain the detail, show
  one actionable alert and enable manual retry without automatic requests.
- Removed `deleteSubclass` from `app/actions/subclass.ts`; its three read exports
  remain for Wave 3. Application ratchet: **85 → 84** exports; repository markers
  and public APIs are unchanged.
- Route-boundary and real-detail transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, generic failures, invalidation and pending/error UX.
  Live authenticated requests verify rejected-request retention, persisted deletion,
  ability/membership/link removal, reusable-option and collection retention,
  detail 404 and repeat-delete 404. Browser QA covers cancellation, network
  failure/manual retry, pending controls, owner-list navigation and full reload.
  Disposable non-admin QA users/content are cleaned up with explicit absence
  checks; production uses short-lived Auth.js sessions, not a development-login
  bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Companion deletion is the next bounded Wave 2 slice.

### Companion deletion — October 2026

- `CompanionDetailActions`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteCompanion` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The unchanged database operation scopes deletion to the session-derived owner.
  Missing, non-owned and already-deleted companions return 404; submitted owner
  identity is ignored. Collection-membership cascades and search-index removal
  remain unchanged; collections are not deleted.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner-list invalidation
  remains; public-list and actual `/companions/[companionId]` detail invalidation
  plus explicit refresh keep navigation fresh. Owner-only controls, permanent-delete
  confirmation, pending disable and `/my/companions` navigation remain. HTTP/network
  errors retain the detail, show one actionable alert and enable manual retry.
- Removed `deleteCompanion` from `app/actions/companion.ts`; public lookup remains
  for Wave 3. Application ratchet: **84 → 83** exports; repository markers and
  public APIs are unchanged.
- Route-boundary and real-detail transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, safe failures, invalidation and pending/error UX.
  Live authenticated requests verify rejected-request retention, persisted deletion,
  membership/search removal, collection retention, detail 404 and repeat-delete 404.
  Browser QA covers cancellation, network failure/manual retry, pending controls,
  owner-list navigation and full reload. Disposable non-admin QA users/content
  are removed with explicit absence checks. Production uses short-lived Auth.js
  sessions, not a development-login bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Family deletion is the next bounded Wave 2 slice.

### Family deletion — October 2026

- `FamilyHeader`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteFamily` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The unchanged database operation scopes deletion to the session-derived owner.
  Missing, non-owned and already-deleted families return 404; submitted owner
  identity is ignored. Monster-family links cascade; linked monsters are retained.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner-list invalidation
  remains; public-list and `/families/[id]` detail invalidation plus explicit refresh
  keep navigation fresh. Owner-only controls, confirmation and `/my/families`
  navigation remain. Delete is now disabled while pending. HTTP/network errors
  preserve the existing single alert, retain the detail and enable manual retry.
- Removed `deleteFamily` from `app/families/actions.ts`; its owner-list read
  remains for Wave 3. Application ratchet: **83 → 82** exports; repository markers
  and public APIs are unchanged.
- Route-boundary and real-header transport tests cover stable URL/no `next-action`,
  auth, ownership, validation, safe failures, invalidation and pending/error UX.
  Live authenticated requests verify rejected-request retention, persisted deletion,
  membership removal, monster retention, detail 404 and repeat-delete 404. Browser
  QA covers cancellation, network failure/manual retry, pending controls, owner-list
  navigation and full reload. Disposable non-admin QA users/content are removed
  with explicit absence checks. Production verification uses short-lived Auth.js
  sessions, not a development-login bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Spell-school deletion is the next bounded Wave 2 slice.

### Spell-school deletion — October 2026

- `SchoolActions`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteSpellSchool` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The unchanged database operation scopes deletion to the session-derived owner.
  Missing, non-owned and already-deleted schools return 404; submitted owner
  identity is ignored. Spells and collection memberships cascade; collections remain.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Existing public/owner-list
  and detail invalidation remain; explicit refresh keeps post-delete navigation
  fresh. Owner-only controls, the spell-cascade warning and confirmation dialog,
  pending disable and `/my/spell-schools` navigation remain. HTTP/network errors
  now show one inline alert instead of console-only failures, retaining the detail
  and allowing manual retry without automatic deletion requests.
- Removed `deleteSpellSchool` from `app/spell-schools/actions.ts`; its two read
  exports remain for Wave 3. Application ratchet: **82 → 81** exports; repository
  markers and public APIs are unchanged.
- Route-boundary and real-component transport tests cover stable URL/no
  `next-action`, auth, ownership, validation, safe failures, invalidation and
  confirmation/pending/error/retry UX. Live authenticated requests verify rejected
  request retention, persisted deletion, spell/membership removal, collection
  retention, detail 404 and repeat-delete 404. Browser QA covers cancellation,
  network failure/manual retry, pending controls, owner-list navigation and reload.
  Disposable non-admin QA users/content are cleaned up with explicit absence
  checks; production uses short-lived Auth.js sessions, not a dev-login bypass
  or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Custom-rule deletion is the next bounded Wave 2 slice.

### Custom-rule deletion — October 2026

- `CustomRuleActions`, the sole browser caller, uses a typed JSON POST to
  `/_actions/deleteCustomRule` with `{ id: UUID }`, returning 200 `{ success: true }`.
  The unchanged database operation scopes deletion to the session-derived user ID.
  Missing, non-owned and already-deleted rules return 404; submitted owner identity
  is ignored. Official-rule links cascade and search-index removal is preserved;
  official rules are not modified. No public API or repository boundary changed.
- UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Existing list invalidation
  remains, with owner-list and detail invalidation plus explicit refresh. Successful
  deletion navigates to the existing `/my/rules` owner list: the former
  `/custom-rules` destination was verified to return 404 on current main.
- Owner-only controls, permanent-delete confirmation and pending disable remain.
  HTTP/network failures now show one readable inline alert beneath the controls,
  retain the detail and enable manual retry without automatic deletion requests.
- Removed `deleteCustomRuleAction` and its now-empty module
  `app/custom-rules/actions.ts`. Application ratchet: **81 → 80** exports;
  repository markers are unchanged. Route-boundary and real-component transport
  tests cover stable URL/no `next-action`, auth, ownership, validation, safe failures,
  invalidation and confirmation/pending/error/retry behavior.
- Live authenticated requests verify rejected-request retention, persisted deletion,
  link/search removal, detail 404 and repeat-delete 404. Browser QA covers
  cancellation, network failure/manual retry, pending controls, correct owner-list
  navigation and full reload without console/page/hydration errors. Disposable
  non-admin QA users/content are removed with explicit absence checks. Production
  verification uses short-lived Auth.js sessions, not a dev-login bypass or
  real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Collection/encounter relationship writes are the next bounded Wave 2 work.

### Monster and hazard collection membership — October 2026

- `AddToCollectionDialog`, the only browser caller, uses typed JSON POSTs to
  `/_actions/addMonsterToCollection` with `{ monsterId: UUID, collectionId: UUID }`,
  returning 200 `{ success: true }` for both monsters and hazards. Existing
  collection lookup/ownership and public-or-session-owned content checks remain;
  foreign private collections return 404, foreign public collections and
  inaccessible content return 403. Submitted owner identity is ignored.
- The unchanged database operation preserves idempotent membership insertion.
  UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner/public collection
  lists and detail pages are revalidated; the existing owner-collection query
  invalidation refreshes duplicate detection without a Flight mutation response.
- The shared dialog retains selection, pending disable and duplicate warnings.
  HTTP/network failures now show one inline alert, retain the dialog and selected
  collection, and permit manual retry without automatic mutation retries.
  Successful additions close/reset the dialog without navigating away.
- Removed `addMonsterToCollection` from `app/actions/collection.ts`, its old
  action-only tests and both monster/hazard action callers. Application ratchet:
  **80 → 79** exports; other entity membership actions, public APIs and repository
  markers are unchanged. Route-boundary and real-dialog transport tests cover
  stable URL/no `next-action`, auth/ownership, validation, safe failures,
  invalidation and pending/error/retry behavior.
- Live authenticated HTTP and browser QA exercise both entity kinds, rejection
  without writes, duplicate idempotency, persisted membership, cache freshness,
  retained selection/retry, normal navigation and full reload. Disposable non-admin
  users, copied existing content, collections, memberships and search entries are
  cleaned up with explicit absence checks. Production uses short-lived Auth.js
  sessions, not a dev-login bypass or real-user content.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Item collection membership is the next bounded Wave 2 slice; remaining
  collection/encounter relationship writes follow before reactions and preferences.

### Item collection membership — October 2026

- `AddToCollectionDialog`, reached from the item detail page and the sole browser
  caller, uses a typed JSON POST to `/_actions/addItemToCollection` with
  `{ itemId: UUID, collectionId: UUID }`, returning 200 `{ success: true }`.
  Existing collection lookup/ownership and public-or-session-owned item checks
  remain: foreign private collections return 404; foreign public collections and
  inaccessible or missing items return 403. Submitted owner identity is ignored.
- The unchanged database operation preserves idempotent membership insertion.
  Runtime UUID validation, exact-origin/JSON enforcement, telemetry and generic
  unexpected 500s reuse the shared internal boundary without CORS. Owner/public
  collection lists and detail pages are revalidated; the existing owner-collection
  query invalidation refreshes duplicate detection without a Flight response.
- The shared dialog retains pending disable, duplicate warnings, selection and
  single inline error/manual retry behavior for HTTP/network failures. Success
  closes/resets the dialog without navigation or automatic mutation retries.
- Removed `addItemToCollection` from `app/actions/collection.ts`, its action-only
  tests and the dialog's action import/call. Application ratchet: **79 → 78**
  exports; other membership actions, public APIs, database/repository boundaries
  and repository markers are unchanged.
- Route-boundary and real-dialog transport tests cover stable URL/no `next-action`,
  auth/ownership, validation, safe failures, invalidation and pending/error/retry
  behavior. Live development HTTP checks verify rejection without writes, owned
  private/foreign public items, duplicate idempotency and persisted membership.
  Browser QA verifies failure/selection retention/manual retry, refreshed duplicate
  detection, normal navigation, active owner navigation and collection reload.
  Disposable non-admin users, copied items, collections, memberships and search
  entries are removed with explicit absence checks. Production verification uses
  short-lived Auth.js sessions for test-owned non-admin users, not a dev-login
  bypass or real-user content; deployment evidence is recorded in the run thread.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Spell-school collection membership is the next bounded Wave 2 slice; remaining
  collection/encounter relationship writes follow before reactions and preferences.

### Spell-school collection membership — October 2026

- `AddToCollectionDialog`, reached from the spell-school detail page and the sole
  browser caller, uses typed JSON POSTs to `/_actions/addSpellSchoolToCollection`
  with `{ spellSchoolId: UUID, collectionId: UUID }`, returning 200
  `{ success: true }`. Existing collection lookup/ownership and public-or-owned
  school checks remain: foreign private collections return 404; foreign public
  collections and inaccessible/missing schools return 403. Session identity is
  authoritative; submitted owner identity is ignored.
- The unchanged database operation preserves idempotent membership insertion.
  Runtime UUID validation, exact-origin/JSON enforcement, telemetry and generic
  unexpected 500s reuse the shared internal boundary without CORS. Owner/public
  collection lists and detail pages are revalidated; the existing owner-collection
  query invalidation refreshes duplicate detection without a Flight response.
- The shared dialog retains pending disable, duplicate warnings, selection and
  one inline error/manual retry for HTTP/network failures. Success closes/resets
  the dialog without navigation or automatic mutation retries.
- Removed `addSpellSchoolToCollection` from `app/actions/collection.ts`, its
  action-only tests and the dialog's action import/call. Application ratchet:
  **78 → 77** exports; other membership actions, public APIs, database/repository
  boundaries and repository markers are unchanged.
- Route-boundary and real-dialog transport tests cover stable URL/no `next-action`,
  auth/ownership, validation, safe failures, invalidation and pending/error/retry
  behavior. Live development HTTP checks verify rejection without writes, owned
  private/foreign public schools, duplicate idempotency and persisted membership.
  Browser QA verifies retained selection/manual retry, refreshed duplicate
  detection, normal navigation, active owner navigation and collection reload.
  Disposable non-admin users, copied schools, collections, memberships and search
  entries are removed with explicit absence checks. Production verification uses
  short-lived Auth.js sessions for test-owned non-admin users, not a dev-login
  bypass or real-user content; deployment evidence is recorded in the run thread.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Companion collection membership is the next bounded Wave 2 slice; remaining
  collection/encounter relationship writes follow before reactions and preferences.

### Companion collection membership — October 2026

- `AddToCollectionDialog`, reached from the companion detail page and the sole
  browser caller, uses a typed JSON POST to `/_actions/addCompanionToCollection`
  with `{ companionId: UUID, collectionId: UUID }`, returning 200
  `{ success: true }`. Existing collection lookup/ownership and public-or-owned
  companion checks remain: foreign private collections return 404; foreign public
  collections and inaccessible/missing companions return 403. Session identity
  remains authoritative; submitted owner identity is ignored.
- The unchanged database operation preserves idempotent membership insertion.
  UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner/public collection
  lists and detail pages are revalidated; the existing owner-collection query
  invalidation refreshes duplicate detection without a Flight mutation response.
- The shared dialog retains pending disable, duplicate warnings, selection and
  one inline error/manual retry for HTTP/network failures. Success closes/resets
  the dialog without navigation or automatic mutation retries.
- Removed `addCompanionToCollection` from `app/actions/collection.ts`, its old
  action-only tests and the dialog's action import/call. Application ratchet:
  **77 → 76** exports; other membership actions, public APIs, database/repository
  boundaries and repository markers are unchanged.
- Route-boundary and real-dialog transport tests cover stable URL/no `next-action`,
  auth/ownership, validation, safe failures, invalidation and pending/error/retry
  behavior. Live development HTTP checks verify rejection without writes, owned
  private/foreign public companions, duplicate idempotency and persisted membership.
  Browser QA verifies retained selection/manual retry, refreshed duplicate
  detection, normal navigation, active owner navigation and collection reload.
  Disposable non-admin users, copied companions, collections and memberships are
  cleaned up with explicit absence checks. Production verification uses short-lived
  Auth.js sessions for test-owned non-admin users, not a dev-login bypass or real
  user content; deployment evidence is recorded in the run thread.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Ancestry collection membership is the next bounded Wave 2 slice; remaining
  collection/encounter relationship writes follow before reactions and preferences.

### Ancestry collection membership — October 2026

- `AddToCollectionDialog`, reached from the ancestry detail page and the sole
  browser caller, uses typed JSON POSTs to `/_actions/addAncestryToCollection`
  with `{ ancestryId: UUID, collectionId: UUID }`, returning 200
  `{ success: true }`. Existing collection lookup/ownership and public-or-owned
  ancestry checks remain: foreign private collections return 404; foreign public
  collections and inaccessible/missing ancestries return 403. Session identity
  remains authoritative; submitted owner identity is ignored.
- The unchanged database operation preserves idempotent membership insertion.
  UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner/public collection
  lists and detail pages are revalidated; the existing owner-collection query
  invalidation refreshes duplicate detection without a Flight mutation response.
- The dialog retains pending disable, duplicate warnings, selection and one inline
  error/manual retry for HTTP/network failures. Success closes/resets the dialog
  without navigation or automatic mutation retries.
- Removed `addAncestryToCollection` from `app/actions/collection.ts`, its old
  action-only test and the dialog's action import/call. Application ratchet:
  **76 → 75** exports; other membership actions, public APIs, database/repository
  boundaries and repository markers are unchanged.
- Route-boundary and real-dialog transport tests cover stable URL/no `next-action`,
  auth/ownership, validation, safe failures, invalidation and pending/error/retry
  behavior. Live development HTTP checks verify rejection without writes, owned
  private/foreign public ancestries, duplicate idempotency and persisted membership.
  Browser QA verifies retained selection/manual retry, refreshed duplicate
  detection, normal navigation, active owner navigation and collection reload.
  Disposable non-admin users, copied ancestries, collections, memberships and search
  entries are cleaned up with explicit absence checks. Production verification uses
  short-lived Auth.js sessions for test-owned non-admin users, not a dev-login
  bypass or real-user content; deployment evidence is recorded in the run thread.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Background collection membership is the next bounded Wave 2 slice; remaining
  collection/encounter relationship writes follow before reactions and preferences.

### Background collection membership — October 2026

- `AddToCollectionDialog`, reached from the background detail page and the sole
  browser caller, uses typed JSON POSTs to `/_actions/addBackgroundToCollection`
  with `{ backgroundId: UUID, collectionId: UUID }`, returning 200
  `{ success: true }`. Existing collection lookup/ownership and public-or-owned
  background checks remain: foreign private collections return 404; foreign public
  collections and inaccessible/missing backgrounds return 403. Session identity
  remains authoritative; submitted owner identity is ignored.
- The unchanged database operation preserves idempotent membership insertion.
  UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner/public collection
  lists and detail pages are revalidated; the existing owner-collection query
  invalidation refreshes duplicate detection without a Flight mutation response.
- The dialog retains pending disable, duplicate warnings, selection and one inline
  error/manual retry for HTTP/network failures. Success closes/resets the dialog
  without navigation or automatic mutation retries.
- Removed `addBackgroundToCollection` from `app/actions/collection.ts`, its old
  action-only test and the dialog's action import/call. Application ratchet:
  **75 → 74** exports; other membership actions, public APIs, database/repository
  boundaries and repository markers are unchanged.
- Route-boundary and real-dialog transport tests cover stable URL/no `next-action`,
  auth/ownership, validation, safe failures, invalidation and pending/error/retry
  behavior. Live development HTTP checks verify rejection without writes, owned
  private/foreign public backgrounds, duplicate idempotency and persisted membership.
  Browser QA verifies retained selection/manual retry, refreshed duplicate
  detection, normal navigation, active owner navigation and collection reload.
  Disposable non-admin users, copied backgrounds, collections, memberships and
  search entries are cleaned up with explicit absence checks. Production
  verification uses short-lived Auth.js sessions for test-owned non-admin users,
  not a dev-login bypass or real-user content; deployment evidence is recorded
  in the run thread.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Subclass collection membership is the next bounded Wave 2 slice; remaining
  collection/encounter relationship writes follow before reactions and preferences.

### Subclass collection membership — October 2026

- `AddToCollectionDialog`, reached from the subclass detail page and the sole
  browser caller, uses typed JSON POSTs to `/_actions/addSubclassToCollection`
  with `{ subclassId: UUID, collectionId: UUID }`, returning 200
  `{ success: true }`. Existing collection lookup/ownership and public-or-owned
  subclass checks remain: foreign private collections return 404; foreign public
  collections and inaccessible/missing subclasses return 403. Submitted owner
  identity is ignored in favor of the authenticated session.
- The unchanged database operation preserves idempotent membership insertion.
  UUID validation, exact-origin/JSON enforcement, telemetry and generic unexpected
  500s reuse the shared internal boundary without CORS. Owner/public collection
  lists and detail pages are revalidated; owner-collection query invalidation
  refreshes duplicate detection without a Flight mutation response.
- The dialog retains pending disable, duplicate warnings, selection and one inline
  error/manual retry for HTTP/network failures. Success closes/resets the dialog
  without navigation or automatic mutation retries. All dialog writes now use
  typed JSON, so its obsolete FormData construction is removed.
- Removed `addSubclassToCollection` from `app/actions/collection.ts`, its old
  action-only test and the dialog's action import/call. Application ratchet:
  **74 → 73** exports; class membership, public APIs, database/repository boundaries
  and repository markers are unchanged. The existing per-operation stable URL
  pattern is retained; consolidating already-deployed contracts is outside this slice.
- Route-boundary and real-dialog transport tests cover stable URL/no `next-action`,
  auth/ownership, validation, safe failures, invalidation and pending/error/retry
  behavior. Live development HTTP checks verify rejection without writes, owned
  private/foreign public subclasses, duplicate idempotency and persisted membership.
  Browser QA covers retained selection/manual retry, refreshed duplicate detection,
  normal navigation, active owner navigation and collection reload. Disposable
  non-admin users, copied subclasses, collections, memberships and search entries
  are cleaned up with explicit absence checks. Production verification uses
  short-lived Auth.js sessions for test-owned non-admin users, not a dev-login
  bypass or real-user content; deployment evidence is recorded in the run thread.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry path.
  Class collection membership is the next bounded Wave 2 slice; remaining
  collection/encounter relationship writes follow before reactions and preferences.

### Monster and hazard encounter membership — October 2026

- The logged class-collection addition was audited first: `addClassToCollection`
  has no callers, and `AddToCollectionDialog` has no class variant. This run
  leaves that unused export unchanged rather than introducing a new feature.
  The next active Wave 2 relationship flow is encounter membership.
- `AddToEncounterDialog`, used by monster and hazard detail pages, now sends
  typed JSON to `/_actions/addMonsterToEncounter`: `{ monsterId: UUID,
  encounterId: UUID, quantity: number, isPerHero: boolean,
  heroesPerMonster: number }`, returning 200 `{ success: true }`. UUIDs and
  JSON types are runtime-validated; omitted counts retain defaults, and finite
  counts below one retain the existing minimum-one normalization.
- Session-derived ownership and public-or-owned content checks remain. Missing
  or non-owned encounters return 404; inaccessible/missing content returns 403.
  Client identity and legendary claims are ignored. Stored legendary status
  forces quantity one and static counting. The unchanged transactional database
  operation inserts or updates membership and retains encounter-wide privacy
  validation; recognized public/private and unavailable-content errors return
  actionable 400s, while unexpected errors use telemetry and generic 500s.
- Exact-origin/JSON enforcement reuses `internalAction`, without CORS. Owner and
  public encounter lists plus detail pages are revalidated; existing query
  invalidation refreshes membership warnings without a Flight response. Selection,
  count controls, pending disable, inline errors and manual retry remain. Success
  closes/resets the dialog without navigation or automatic mutation retries.
- Removed `addMonsterToEncounter` from `app/actions/encounter.ts`, its old
  action-only tests and the dialog's action import/FormData call. The owner-list
  read remains for Wave 3. Application ratchet: **73 → 72** exports; collection
  actions, public APIs and repository boundaries are unchanged.
- Route-boundary and real-dialog transport tests cover stable URL/no `next-action`,
  validation, auth, privacy, legendary rules, cache invalidation and pending/error
  UX. Live authenticated requests verify rejection without writes, static/per-hero
  count persistence, updates, repeat idempotency, monsters, hazards and legendary
  normalization. Browser QA covers retained counts/selection and manual retry,
  refreshed membership warnings, navigation and full reload. Disposable non-admin
  users and copies of seeded/existing content are cleaned up with explicit absence
  checks. Production uses short-lived Auth.js sessions for test-owned users, not
  a dev-login bypass or real-user content; run evidence is recorded in the linked
  thread above.
- Retain this URL and accepted shapes for at least one full deployment interval.
  Pre-cutover tabs still need the existing refresh/retry path. Resolve the unused
  class-collection export next, then proceed to reactions/reports in Wave 2;
  collection replacement/removal already uses `saveCollection`.

### Unused class collection action — October 2026

- The full caller audit finds no caller for `addClassToCollection` and no class
  variant in `AddToCollectionDialog`. Class selection is already saved through
  the existing `/_actions/saveCollection` JSON contract. Adding an endpoint or
  a dialog variant would introduce behavior rather than migrate it.
- Removed the unused export from `app/actions/collection.ts`, its
  now-unused `lib/db/collection.ts` helper and obsolete test mocks. The owner-list
  read remains for Wave 3. Application ratchet: **72 → 71**. Existing route/transport
  tests now exercise a nonempty `classIds` payload; runtime save, auth, cache and
  UI code are unchanged.
- Live development and authenticated production POSTs verify JSON status codes,
  exact-origin/media rejection, auth/ownership, class visibility filtering,
  persisted addition, repetition, replacement, removal and creation without
  `next-action`. Browser
  selection/save persists both classes, navigates to detail and survives reload.
  Disposable users, copied classes, collections, memberships and search entries
  are removed with explicit zero-count checks. Production uses short-lived
  Auth.js sessions for disposable non-admin users, not a dev-login bypass.
- The initial local run exposed pre-existing nested buttons in selectable class
  cards. The separately deployed [UI fix](https://github.com/dstrelau/nimble.monster/commit/60a7809256212f4edd52cfb9691fece24bb1f2d2)
  keeps native selection and source popover controls as siblings, preserving
  keyboard/touch behavior. Clean browser console/DOM checks now cover Classes,
  selection, save and reload. The cleanup is a separate commit/deployment; test
  counts, request results, cleanup and production evidence are recorded in the
  run thread linked above.
- No new class-detail functionality or stable route is introduced. Existing
  `saveCollection` contracts and cache behavior are unchanged. Reactions and
  reports are next in Wave 2; collection/encounter relationship writes are complete.

### Reaction toggles — October 2026

- The only browser mutation caller, `useEntityReactions`, now sends typed JSON
  POSTs to `/_actions/toggleReaction`: `{ entityType, entityId: UUID,
  reactionType }`, returning 200 `{ success: true, data: { counts, mine } }`.
  The shared hook serves all 12 reactable types, including monsters/hazards,
  badge and labeled controls, list cards and detail pages.
- The route validates both enums and the UUID, derives identity from the session,
  preserves the existing inaccessible-ancestry 404 check, and delegates to the
  unchanged reaction service. Mutual exclusion, toggle-off behavior, aggregate
  counts and denormalized `like_count` synchronization remain unchanged. This
  transport migration does not extend ancestry-specific visibility checks to
  other entity types or introduce new resource authorization semantics.
- Exact-origin/JSON enforcement, no CORS, telemetry identifiers, and generic
  unexpected 500s reuse `internalAction`. The hook keeps the same query-summary
  update, no navigation, no optimistic count change and manual retry behavior;
  no automatic mutation retry or new cache revalidation is introduced. Controls
  retain their existing pending/error presentation.
- Removed `toggleMyReaction` and its obsolete action tests; `getMyReactions`
  remains for Wave 3. Application ratchet: **71 → 70**; repository boundaries,
  public APIs, report actions and shared transport are unchanged.
- Route-boundary and real-component fetch tests cover stable URL/no `next-action`,
  every entity type, auth, ancestry privacy, malformed input, origin/media
  rejection, safe errors, summary updates, failed-request count retention and
  manual retry. Live HTTP checks cover all 12 types plus hazards, upvote/downvote
  replacement/removal, two-user aggregation, spoofed identity and independent SQL
  checks of reactions and `like_count`. Browser QA covers badge/labeled toggles,
  full reload, navigation, failed transport/manual retry and clean successful-flow
  console/page errors. Disposable non-admin users and copied content are used,
  with explicit zero-count cleanup checks; production authentication uses
  short-lived Auth.js sessions, not a development bypass.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path; the remaining reaction read still uses legacy Server Action transport.
  Reports are the next bounded Wave 2 slice.
