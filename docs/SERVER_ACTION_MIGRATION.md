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

## Traffic-first migration priority

Select remaining browser operations by observed production root-request volume,
not wave number or the number of unused exports that can be deleted. Aggregate
build-specific IDs by verified manifest filename/export name; never rank stale
IDs as separate operations. Use a fixed recent 24-hour window, with seven days
as a tie-breaker when sparse. Waves below remain architecture/scope guidance,
not the execution queue. Historical "next" notes in the progress log describe
the ordering at that time and are superseded by this section.

Host measurement: Honeycomb environment/dataset `nimble.monster`, fixed window
**2026-10-25T12:00:00Z–2026-10-26T12:00:00Z**, root HTTP spans only
(`trace.parent_id` does not exist; `http.request.header.next-action` exists).

| Priority | Verified named operation | Observed requests | HTTP <400 | HTTP ≥400 |
| --- | --- | ---: | ---: | ---: |
| Migrated | `getMyReactions` | 6,171 | 6,005 | 166 |
| Migrated | `loadConditionsForDiscordId` | 4,783 | 4,604 | 179 |
| Migrated | `loadOfficialConditions` | 1,452 | 1,309 | 143 |
| Migrated in navigation-count slice | `getNavCountsAction` | 1,174 | 1,005 | 169 |

Total observed action root requests: **16,687**. The remaining **3,107** include
other operations, older references and invalid/unmapped IDs; this is not a
complete mapping of every ID or historical alias. No sampling banner was returned.
These are observed requests, not unique users; QA/bot traffic is not excluded.
[24-hour results](https://ui.honeycomb.io/strelau-45/environments/nimble.monster/datasets/nimble.monster/result/JvkrCgnqMx),
[initial seven-day ID results](https://ui.honeycomb.io/strelau-45/environments/nimble.monster/datasets/nimble.monster/result/pQkrFW2AbzZ).

The official-condition and navigation-count slices reuse this recent fixed-window
evidence on October 27 (UTC), rather than presenting it as a fresh measurement.
Navigation counts are the highest-volume remaining verified named operation
after the preceding three migrations; 1,174 attempts are not sparse and require
no seven-day tie-breaker. The residual 3,107 attempts are not assigned to named
actions, and absence of a sampling banner is not proof of unsampled coverage.
After navigation counts, refresh the fixed-window ranking and map the remaining
IDs before choosing another slice: this table does not establish the next action
among that residual volume. Do not fall back to unused-export cleanup or wave
order in place of measuring live browser calls.

### Refreshed source-read selection — October 27, 2026

Fixed window **2026-10-26T15:00:00Z–2026-10-27T15:00:00Z**, same dataset and
root HTTP filters (`trace.parent_id` absent, `http.request.header.next-action`
present), grouped by action ID and HTTP response status:
[query results](https://ui.honeycomb.io/strelau-45/environments/nimble.monster/datasets/nimble.monster/result/4Z9R4XqWt5k).
The result JSON reports **mean sample rate 1**, 1,441,876 rows examined and
**7,835 matching root HTTP attempts**. These are observed requests, not users;
QA/bots are not excluded. HTTP <400 and HTTP ≥400 classify transport status,
not domain success encoded inside a legacy Flight response.

| Priority | Verified named operation | Attempts | HTTP <400 | HTTP ≥400 |
| --- | --- | ---: | ---: | ---: |
| Already migrated | `loadConditionsForDiscordId` | 2,654 | 2,502 | 152 |
| Already migrated | `getNavCountsAction` | 1,177 | 876 | 301 |
| Already migrated | `loadOfficialConditions` | 991 | 834 | 157 |
| Selected source-read slice | `getSourcesForEntityType` | 544 | 437 | 107 |
| Remaining | `paginatePublicAncestries` | 347 | 237 | 110 |
| Remaining | `searchPublicItems` | 279 | 276 | 3 |
| Remaining | `paginatePublicMonsters` | 265 | 250 | 15 |
| Remaining | `listOwnCollections` | 211 | 200 | 11 |
| Remaining | `getMyReport` | 200 | 187 | 13 |
| Remaining | `getAllSources` | 183 | 179 | 4 |
| Remaining | `listOwnEncounters` | 134 | 131 | 3 |
| Remaining | `getUserFamilies` | 110 | 109 | 1 |
| Remaining | `paginatePublicBackgrounds` | 84 | 83 | 1 |

Read-only extraction of the 16 deployed OCI manifests from `57d2ffa5` through
`ac33c540` verifies image `GH_SHA`, compressed standalone-layer SHA256, filename
and export name. IDs are deduplicated and aggregated by filename/export, never
treated as different operations. These manifests map **7,319 attempts**; **516
attempts across 54 IDs remain unmapped by this extraction**, including 40 with
the invalid probe ID `x` (HTTP 200 is not evidence it names an action). Older
historical aliases are deliberately not guessed. All remaining mapped operations
below the table have ≤35 attempts. Even the entire unmapped residual is smaller
than the selected action's 544 attempts, establishing its priority among remaining
operations without a sparse-volume seven-day tie-breaker. Residual coverage must
be revisited before selecting the next slice; 516 could change the next ranking.

For `lib/services/sources/actions.ts#getSourcesForEntityType`, observed aliases
include `404c8e7e1d6d79deaa32986e803e7c5efbc31f0465` in `67eeed9e`,
`40d2987c376d7b84dd54d698531addc5ddfdd85776` in `9f7e5731`,
`40c868436c254c432aed4df2de6f3e77d9177b06f0` in `33054557`,
`4030b16fd63d165fc1d2ca7b892cca591bfc240d71` in `7b6577da`, and
`40d67b5b120329c4508424a72a71be0a802acff56b` in `ac33c540`.
The [source-read run](https://ampcode.com/threads/T-01a17e0b-5c7a-730e-9ee7-df31b084d6ff)
records the full safe mapping/volume export and verification evidence.

Read-only extraction of five deployed manifests verified OCI layer digests,
image `GH_SHA`, filename and exported name. For builds `e64c54dd`, `cb96d2c9`,
`35d84cdc`, `1b63297b`, `57d2ffa5`, respectively, `app/actions/reactions.ts#getMyReactions`
maps to `609056db60741f152861289bde55e76b2ddaeff6ce`,
`607cacdbd2a01b7d3748b299f79f3acc0efa051bf4`,
`600d2b014595ec347bbcfd14d8f15cccc841b64072`,
`60ebb8262efa7c194bc8fc5d4279b4eea243cd1128`, and
`602178c695f7dfa0033935b6087223e1323fa6eeb0`. The last mapping was also
read directly from the running production manifest over Fly SSH. Counts above
aggregate verified IDs rather than treating them as five different actions.

## Migration waves (scope guidance)

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

Public/owner pagination by entity family, sources and creator search, generic
entity/option loaders, navigation counts and other session-specific reads are
separate bounded slices. Choose among them using the traffic-first queue above.

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
| Reactions, reports, conditions, preferences | Complete | [Reaction toggles](https://ampcode.com/threads/T-01a169aa-0746-735a-a7c0-8446cab7f985), [report submission](https://ampcode.com/threads/T-01a16abb-6ac1-760e-8159-aadec433f0f8), [condition deletion](https://ampcode.com/threads/T-01a16bce-4053-76b1-b007-b48b240ab139), [condition creation](https://ampcode.com/threads/T-01a16ce0-e547-7735-82bf-72d6eea5d24f) and [banner dismissal](https://ampcode.com/threads/T-01a16df3-8e79-70c7-a4e7-ed05493c11b8) use stable JSON; Wave 3 browser reads are next |
| Public browser reads | Cleanup started | [Unused monster-source prefetch removed](https://ampcode.com/threads/T-01a16f06-5748-72da-8161-a6c2b4a60465), [unused monster lookup/search removed](https://ampcode.com/threads/T-01a17019-c140-715a-b92e-9c7ea7cf8e9c), and [unused class/subclass lookup/search removed](https://ampcode.com/threads/T-01a1712b-65a5-72de-94ed-eac19100526f); active pagination remains next in Wave 3; prefer existing JSON:API |
| Private/UI-specific browser reads | Partially complete | Picker, [reaction summary reads](https://ampcode.com/threads/T-01a1781c-f9af-7729-a9fb-5deda49e493a), [creator/viewer conditions](https://ampcode.com/threads/T-01a178af-d558-748e-876d-ea6e1b43b5ed) and [official conditions](https://ampcode.com/threads/T-01a17ad3-4ab5-7205-a5f9-9405ebba43db) use stable routes; navigation counts are next by recorded traffic |
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

### Report submission — October 2026

- The sole browser mutation caller, `useEntityReport`, now sends typed JSON
  POSTs to `/_actions/reportEntity`: `{ entityType, entityId: UUID, reason,
  details: string }`, returning 200 `{ success: true }`. The shared dialog is
  reached through `EntityDetailActions` and the spell-school/custom-rule pages;
  hazards use the `monster` entity type, as before.
- The route validates the entity/reason enums, UUID and details string, derives
  reporter identity from the session, and delegates to the unchanged report
  service. One-report-per-user/entity idempotency and original reason/details
  retention on duplicates remain unchanged. Existing reporting does not enforce
  entity ownership or visibility; this transport cutover does not introduce new
  resource authorization semantics or a public moderation API.
- Exact-origin/JSON enforcement, no CORS, telemetry identifiers (not report
  details), and generic unexpected 500s reuse `internalAction`. The hook keeps
  its report-summary cache update and no navigation/revalidation. The dialog
  retains pending disable and now catches HTTP/network failures inline, keeping
  reason/details for manual retry rather than closing or losing the draft.
- Removed `reportEntity` from `app/actions/reports.ts`, obsolete action tests
  and the hook's action import/call. `getMyReport` remains for Wave 3.
  Application ratchet: **70 → 69**; report service/database, admin moderation,
  public APIs and repository boundaries are unchanged.
- Route-boundary and real-dialog fetch tests cover stable URL/no `next-action`,
  all entity types/reasons, session identity, malformed input, origin/media
  rejection, safe failures, cache updates and pending/error/manual retry UX.
  Live authenticated HTTP checks verify persisted reason/details, duplicate
  idempotency and independent reporters. Browser QA covers existing report
  surfaces, draft retention, manual retry and Reported state after reload.
  Disposable non-admin users and copies of seeded/existing content are used;
  production uses short-lived Auth.js sessions, never a dev-login bypass.
  Request/deployment evidence and explicit zero-count cleanup checks are
  recorded in the linked run thread above.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path; the remaining report read still uses legacy Server Action transport.
  Conditions and preferences are next in Wave 2.

### Condition deletion — October 2026

- `ConditionsLibrary`, the sole browser caller, sends a typed JSON POST to
  `/_actions/deleteCondition` with `{ id: UUID }`, returning 200
  `{ success: true }`. The unchanged database helper derives the owner from the
  session's Discord ID and scopes deletion to that user's conditions. Submitted
  owner identity is ignored. Missing, non-owned and already-deleted conditions
  return the same 404, consistent with the other migrated deletion routes;
  unlike the old silent no-op, the UI retains confirmation for a failed delete.
- UUID validation, exact-origin/JSON enforcement, no CORS, identifier telemetry
  and generic unexpected 500s reuse `internalAction`. Existing `/my` layout
  invalidation, condition-query invalidation and explicit router refresh remain.
  Fresh usage lookup, reference warning, cancellation, pending disable, the
  existing inline error and manual retry are unchanged. There are no automatic
  mutation retries or navigation changes.
- Condition membership links cascade on deletion; referenced monsters and their
  name-based text remain unchanged, as described by the existing usage warning.
  The database/service boundary, public APIs and existing condition edit/usage
  routes are unchanged. This is a transport cutover, not a new condition feature.
- Removed `deleteCondition` from `app/actions/conditions.ts` and its only browser
  import/call. Application ratchet: **69 → 68**; repository markers unchanged.
  Condition creation remains in Wave 2, with its two reads retained for Wave 3.
- Route-boundary and real-library transport tests cover stable URL/no
  `next-action`, auth/ownership, malformed input, origin/media rejection, safe
  failures and pending/error/manual retry. Live HTTP checks verify rejected
  request retention, owner deletion, repeat-delete 404, membership cascade and
  monster/text retention. Browser QA covers cancellation, failure/retry, fresh
  usage warning, refreshed library, client navigation and full reload. Disposable
  non-admin users and a copy of seeded/existing content are used; production
  verification uses short-lived Auth.js sessions, not a dev-login bypass.
  Deployment/request evidence and zero-count cleanup checks belong to the linked
  run thread above.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Condition creation is the next bounded Wave 2 slice, then preferences.

### Condition creation — October 2026

- `ConditionManagementDialog`, the only browser caller, sends a typed JSON POST
  to `/_actions/createCondition` with `{ name: string, description: string }`,
  returning 201 `{ success: true }`. The caller never consumed the former row
  result, so no database row or ownership metadata crosses this new contract.
- The route preserves trimming, the 1–100-character name limit, prohibition of
  brackets/pipes/newlines, nonempty descriptions and the existing owner-scoped,
  case-insensitive duplicate check. Duplicates return 409 without modifying the
  original. Session-derived Discord identity remains authoritative; submitted
  identity and official status are ignored. Different owners can use the same
  name. The database helper and existing duplicate-check concurrency semantics
  are unchanged; this slice does not introduce a uniqueness constraint.
- Exact-origin/JSON enforcement, no CORS, identifier-only telemetry and generic
  unexpected 500s reuse `internalAction`. Existing `/my` layout revalidation,
  condition-query invalidation and explicit router refresh remain. The dialog
  retains cancellation, pending disable, its inline error, draft retention and
  manual retry with no automatic creation retry or navigation change.
- Removed `createCondition` from `app/actions/conditions.ts` and its sole browser
  import/call, plus the obsolete test mock. Application ratchet: **68 → 67**;
  the two condition reads remain for Wave 3. Public APIs, edit/usage/deletion
  routes, repository markers and shared transport are unchanged.
- Route-boundary and real-library fetch tests cover stable URL/no `next-action`,
  session identity, malformed JSON/types, validation boundaries, duplicate
  rejection, origin/media rejection, safe failures and pending/error/manual retry.
  Live development HTTP checks independently verify persisted ownership, trimmed
  multiline/Unicode content, rejected-request no-writes, duplicate retention and
  separate-owner names. Browser QA covers cancellation, network failure/retry,
  pending controls, refreshed counts, active navigation, client navigation and
  full reload without page/console/hydration errors in the successful flow.
- Disposable non-admin users/conditions are removed with explicit zero-count
  checks. Production verification uses one-hour Auth.js sessions, never a dev
  login bypass or real-user content; deployment, functional request and cleanup
  evidence is recorded in the run thread linked above.
- Retain this URL and accepted request/response shapes for at least one full
  deployment interval. Pre-cutover tabs still need the existing refresh/retry
  path. Preferences are the next bounded Wave 2 work.

### Banner dismissal — October 2026

- `FreeBanner`, the sole caller, sends a typed JSON POST to
  `/_actions/dismissBanner` with `{}`, returning 200 `{ success: true }`.
  The existing database update remains scoped to the session user ID and only
  sets `banner_dismissed=true`; repeated calls are idempotent. Client-supplied
  identity/preference fields are ignored. Unauthenticated calls return 401.
- The shared `internalAction` boundary enforces exact origin, JSON media type,
  no CORS, telemetry and generic unexpected 500s. Malformed JSON and non-object
  bodies return 400. No cache revalidation, session-token refresh or navigation
  existed in this flow, and none is introduced. Existing session snapshots retain
  their banner flag until sign-in refresh; browser-local storage immediately
  retains dismissal independently, as before.
- Dismissal remains local-first, including signed-out usage: hide immediately
  and store the browser preference without waiting for a server response.
  Signed-out clicks make no request. HTTP/network failures now settle safely
  rather than becoming unhandled rejections; they do not undo local dismissal,
  show an error for an already-dismissed banner, or automatically retry.
- Removed `dismissBanner` and the now-empty `app/actions/user.ts` module.
  Application ratchet: **67 → 66**. No other preference Server Actions remain;
  Wave 2 is complete. Public browser reads are next in documented Wave 3 order.
- Route tests use real in-memory SQL to verify owner isolation, idempotency and
  rejected-request retention; real-component tests cover stable URL/no
  `next-action`, pending local dismissal, signed-out behavior and HTTP/network
  failures. Live development and authenticated production requests independently
  verify persisted preferences and unchanged second-user state. Browser QA
  verifies dismissal, failure retention, normal navigation and reload.
  Disposable non-admin users are removed with explicit absence checks;
  production uses one-hour Auth.js sessions, never a dev-login bypass or real-user
  content. Request/deployment/cleanup evidence is recorded in the linked run.
- Retain this URL and accepted shapes for at least one full deployment interval.
  Pre-cutover tabs retain the existing refresh/retry requirement.

### Unused monster-source prefetch — October 2026

- The full caller/cache-key audit found no consumer of `monster-sources`.
  `useMonsterSourcesQuery` was unused; its query options only prefetched an
  unconsumed result in monster/hazard new/edit pages and the shared profile
  entity page. The actual `SourceSelect` uses the independent `sources` query
  and shared source service, neither of which changes in this slice.
- Removed `listAllMonsterSources` from `app/monsters/actions.ts`, the unused
  hook/query factory, all five prefetch calls, and the exclusively used monster
  service/repository `listAllSources` helpers. Application ratchet: **66 → 65**;
  monster repository exports: **29 → 28**. Repository directives remain for
  Wave 5. No new endpoint, wire contract, UI behavior or source API is invented
  for a result with no consumer; existing read/write transports are unchanged.
- Existing bestiary route/component tests and the full suite verify the retained
  stable save flow. No new route-boundary/client-transport test is needed for a
  deletion-only cleanup that adds no transport. Live authenticated page reads
  and browser QA cover monster/hazard creation/editing, available Source options,
  profile entity routes and reload. Disposable non-admin users and copies of
  existing content are used; production sessions are one-hour Auth.js tokens,
  never a development bypass or real-user content. Request/deployment evidence
  and explicit zero-count cleanup checks are recorded in the linked run.
- Active public pagination remains next in Wave 3. Before its first transport
  cutover, complete the shared transport prerequisites above (`204`/void,
  `AbortSignal` and typed failures); bodyless GET is already supported.
  The live shared source query still uses legacy Server Action transport and
  remains a later Wave 3 slice. Pre-cutover tabs retain refresh/retry handling.

### Unused monster lookup and search — October 2026

- The full caller audit found no imports or calls for `findPublicMonster` or
  `searchPublicMonsters` in `app/actions/monster.ts`. The search action was the
  only consumer of `MonstersService.searchMonsters` and the repository's
  `searchPublicMonsterMinis`; their search parameter/filter types were also
  exclusively used by that chain. None is the active pagination or picker path.
- Removed the empty action module, the unused service/repository search methods
  and their exclusive types. Application ratchet: **65 → 63**; monster repository
  exports: **28 → 27**. The shared mini converter and `listPublicMonsterMinis`
  remain because they still have consumers. Repository directives remain for
  Wave 5. No replacement endpoint, new UI, authorization change or wire contract
  is invented for unused exports.
- Existing picker boundary/query transport tests, public monster API tests and
  bestiary tests cover the retained flows. No new permanent tests are needed for
  this deletion-only cleanup. Live HTTP checks exercise public/owner picker
  search, filters, cursor pagination, private exclusion, session-derived owner
  isolation, origin/media/shape rejection and public/private detail reads.
  Stable picker requests use JSON with no `next-action` header. Browser QA covers
  search/selection, detail navigation and full reload without page errors.
- Disposable non-admin users and private copies of existing content are used,
  with independent SQL ownership/visibility and zero-count cleanup checks.
  Production authentication uses one-hour Auth.js sessions, never a dev-login
  bypass or real-user writes. Request, deployment and cleanup evidence is
  recorded in the linked run thread.
- Active public pagination remains next in Wave 3, after the documented shared
  transport prerequisites (`204`/void, `AbortSignal`, typed failures). The existing
  monster JSON:API client needs a field-parity audit before replacing pagination:
  creator, source, awards, families, teams and timestamps cannot be dropped or
  fabricated. Server Components must keep direct service reads, not relative HTTP
  fetches. Existing active reads and their pre-cutover refresh/retry requirement
  are unchanged by this cleanup.

### Unused class/subclass lookup and search — October 2026

- The full caller audit found no imports or calls for `searchPublicClasses`,
  `findPublicClass`, `searchPublicSubclasses` or `findPublicSubclass`. Removed
  those four exports and their exclusively used database functions
  `searchPublicClassMinis`, `findPublicClassById`, `searchPublicSubclassMinis`,
  `findPublicSubclassById` and search parameter types. Application ratchet:
  **63 → 59**; repository directives and counts are unchanged.
- Retained public lists, subclass class-option search, direct server detail
  reads and stable `saveCollection` remain unchanged. No replacement endpoint
  or new UI is needed for unused exports. Existing route/client tests cover
  the retained contracts; this deletion-only cleanup adds no transport or tests.
- The initial browser QA exposed pre-existing nested interactive elements in
  selectable subclass cards. The separately authorized and deployed
  [UI fix](https://github.com/dstrelau/nimble.monster/commit/e64c54dd0937971945bcf0d78aa6ed88d141da65)
  resolves that blocker; it is not part of this cleanup. Repeated local browser
  QA verifies Classes/Subclasses new/edit/reload with zero nested buttons/links
  and no console warnings/errors or page errors. Mouse and Space selection,
  independent source controls, save navigation and membership persistence pass.
  Known Companion nested creator links and the Heroes source-filter
  abbreviation/ID mismatch are unrelated, unchanged, and not claimed clean.
- Focused tests: 66 passed. Full suite: 1,974 passed, seven skipped. `make check`
  and `git diff --check` pass. The live HTTP matrix uses 15 stable JSON collection
  saves/rejections plus public/private detail reads, checking session ownership,
  visibility filtering, creation/addition/repetition/replacement/removal and
  independent SQL persistence. Browser Create/Save use 201/200 JSON without
  `next-action`, confirmed with raw CDP request and extra-header events.
- Disposable non-admin users and copies of existing class/subclass rows are
  used, never real-user edits. Cleanup checks users, entities, collections,
  memberships, search catalog and FTS with zero-count assertions and compares
  original rows unchanged. Production authentication uses one-hour Auth.js
  sessions, not a development bypass. The [run thread](https://ampcode.com/threads/T-01a1712b-65a5-72de-94ed-eac19100526f)
  records deployment, functional production requests and cleanup evidence.
- Active public pagination remains next in Wave 3 after the documented shared
  transport prerequisites and JSON:API field-parity work. Existing stable
  contracts and legacy-read refresh/retry handling remain unchanged.

### Unused public item lookup — October 2026

- The full caller audit found no imports or calls for `findPublicItem` in
  `app/actions/item.ts`. Removed that export and its now-empty module, including
  the already-commented-out search/pagination implementations. Application
  ratchet: **59 → 58**; repository directives and counts are unchanged.
- The item service and repository public lookup still serve the public item
  API, metadata, legacy list redirects and image routes, so they remain. Active
  detail pages retain their direct service reads and existing visibility checks.
  No replacement endpoint, new UI, wire contract, auth or cache behavior is
  introduced for a caller-free export. Existing route/client tests cover the
  retained contracts; this deletion-only cleanup adds no transport or tests.
- Focused checks cover the item JSON:API routes, repository and stable item
  editor contracts/transport. The full suite passes 1,974 tests, with seven
  skipped; `make check` and `git diff --check` pass. Live development and
  production verification exercise public item lookup with/without creator
  inclusion, invalid include/identifier and missing-item errors, canonical UUID
  redirects, list-to-detail client navigation and full reload. Raw CDP request
  and extra-header events verify the public API GET has no `next-action` header.
- QA uses existing public content read-only: no fixtures, real-user writes,
  sessions minted for production, or database cleanup are needed. Development
  browser QA uses the configured dev session; production checks are anonymous,
  matching the public lookup contract. An initial development-only metadataBase
  warning comes from the unchanged environment-dependent root metadata; the
  settled browser run has no console/page/hydration errors or failed requests.
  The [run thread](https://ampcode.com/threads/T-01a17576-b201-73e8-9fee-450c5039275d)
  records exact requests, deployment identity and final production evidence.
- Active public pagination remains next in Wave 3 after the documented shared
  transport prerequisites (`204`/void, `AbortSignal`, typed failures) and
  JSON:API field-parity audit. Other unused lookups can be removed without
  inventing endpoints. Existing legacy reads retain refresh/retry handling.

### Unused public background lookup — October 2026

- The full caller audit found no imports or calls for `findPublicBackground` in
  `app/actions/background.ts`. Removed the export and its empty module.
  Application ratchet: **58 → 57**; repository directives/counts are unchanged.
- `findBackground` remains shared by direct server detail/metadata reads and
  the service. Active public pagination and stable background saves remain
  unchanged. No replacement endpoint, new UI, wire contract, auth, telemetry,
  cache or navigation behavior is introduced for a caller-free export. Existing
  background route/client tests cover retained boundaries and stable JSON
  transport; this deletion-only cleanup needs no new permanent tests.
- Focused tests: 15 passed. Full suite: 1,974 passed, seven skipped.
  `make check` and `git diff --check` pass. Live development verification checks
  background list/detail HTML, malformed/missing identifiers (404), legacy UUID
  canonical redirects (308), client list-to-detail navigation and full reload.
  Raw CDP request and extra-header events confirm detail GETs have no
  `next-action` header; Heroes navigation is active on the list and creator
  attribution loads, with no browser console/page errors or failed requests.
- QA reads existing public content only; no fixtures or production-auth sessions
  are needed and no database writes require cleanup. Development browser QA
  uses the configured dev session; production QA is anonymous, matching the
  removed public lookup. The [run thread](https://ampcode.com/threads/T-01a17688-d6a7-763e-bdc6-bc26356b0608)
  records deployment identity, exact post-deployment functional requests and
  cleanup. Other legacy action reads remain intentionally outside this slice.
- Active public pagination remains next in Wave 3 after shared transport
  prerequisites (`204`/void, `AbortSignal`, typed failures) and JSON:API
  field-parity work. Unused lookups may be removed without inventing endpoints.

### Entity-specific source options — October 2026

- Selected `getSourcesForEntityType` using the refreshed traffic evidence above:
  544 root HTTP attempts, 437 HTTP <400 and 107 HTTP ≥400, aggregated across
  verified deployed aliases. Coordination found no other unarchived slice owner.
- `sourcesForEntityTypeQueryOptions`, the sole browser transport owner, now
  sends a cancellable, bodyless GET to
  `/_actions/getSourcesForEntityType?entityType=…`, returning `SourceOption[]`
  (`id`, `name`, `abbreviation`). The shared `SourceFilter` serves monsters,
  hazards (using `monsters`), ancestries, backgrounds, classes, subclasses and
  spell schools, both public lists and collection selectors.
- The route validates the six existing entity types, returns 400 for missing,
  empty or unsupported values and generic telemetry-recorded 500s on unexpected
  failures. Success/errors use `private, no-store` without CORS. Unsupported
  writes receive framework 405s. This is a safe anonymous-readable metadata
  query, not a mutation; no session, origin/media gate or public JSON:API is
  introduced. The unchanged repository selects distinct, name-sorted sources
  referenced by that entity table, including private references as before, but
  exposes no entity rows, owners or internal source metadata. Submitted identity
  and visibility parameters do not alter the result.
- Four list pages plus the shared collection new/edit hydrator override the
  browser query function with direct `listSourcesForEntityType` calls at all
  nine prefetch sites. SSR never fetches a relative URL. The same query keys and
  five-minute freshness remain, including entity separation, disabled all-source
  queries, initial empty fallback, retained background data and query retry/error
  recovery. Filtering, navigation, selection and mutation caches are unchanged.
- Removed only `getSourcesForEntityType` from `lib/services/sources/actions.ts`;
  `getAllSources` remains for a later slice. Application ratchet **52 → 51**.
  Repository markers/counts, SQL, public APIs and shared transport are unchanged.
- Real-SQL route tests cover all types, asymmetric references, deduplication,
  sorting, empty results, validation and safe errors. Hook transport tests cover
  stable GET/no `next-action`, all six types, cancellation, cache isolation,
  disabled/fresh queries and failed-read data retention/recovery. Focused tests:
  21 passed. Full suite: 1,953 passed, seven skipped; `make check` and
  `git diff --check` pass. Live local HTTP checks compare all six results with
  independent SQL and verify validation/405 responses. Browser QA exercises
  seven lists and collection source selectors, reload and actual fetch headers.
- Local collection Monsters-tab QA also exposes unchanged selectable-card
  nested source buttons in `components/monster/Card.tsx`. This is a separately
  suggested UI fix, not a source transport failure or a claim of clean markup.
  Public-list source-menu QA has no console/page/hydration errors.
- QA is read-only against seeded/existing content: no disposable entities,
  production sessions or database writes are needed, so no fixture deletion is
  required. The [run thread](https://ampcode.com/threads/T-01a17e0b-5c7a-730e-9ee7-df31b084d6ff)
  records deployment identity, exact functional production requests, inspected
  visual evidence and cleanup. Retain this URL and response shape for at least
  one deployment interval. Legacy tabs still need refresh/retry for other action
  IDs. Migration remains incomplete; revisit residual mapping before selection.

### Public navigation counts — October 2026

- Selected `getNavCountsAction` from the recorded traffic-first ranking: 1,174
  root HTTP attempts (1,005 HTTP <400; 169 HTTP ≥400). This is reused recent
  fixed-window evidence, not a new query; coverage and unmapped volume remain
  disclosed above. Coordination found no other unarchived owner of this slice.
  The official-condition run retains its own disclosed closeout exceptions;
  this run neither reopens nor claims to resolve them.
- Caller audit found only `Header` (its shared query plus four `CountedNavMenu`
  observers) and the root layout. The header now uses a bodyless typed GET to
  `/_actions/getNavCounts`, sharing its unchanged `["nav-counts"]` cache key,
  one-minute freshness, initial server counts and existing bestiary-save
  invalidation. The transport supports cancellation. Background pending/failure
  retains existing counts; normal query retries/recovery and navigation remain
  unchanged. This read has no mutation, persistence or redirect contract.
- These are public catalogue totals, not My Library counts. The prior action
  performed no auth check: anonymous and signed-in viewers deliberately receive
  the same 13 numeric fields. Existing SQL helpers still exclude private rows,
  separate monsters/hazards and add filesystem rules to public custom rules.
  Arbitrary query parameters cannot select a user or private data. There is no
  new session-only authorization, identity-scoped cache key or supported public
  JSON:API endpoint. Safe parameterless GETs need no mutation-origin/media gate
  or input schema. Responses and generic unexpected 500s are `private, no-store`,
  with no CORS and existing error telemetry; unsupported writes return 405.
- Moved the existing aggregation into `lib/db/nav.ts` without `use server`.
  The root layout calls it directly; the browser contract imports only its type,
  never its database implementation. No relative HTTP occurs in SSR. Removed
  the final export and empty `app/actions/nav.ts`; application ratchet **53 → 52**.
  Repository directives/counts, underlying SQL, admin actions and other browser
  reads are unchanged. Route tests use real SQLite with asymmetric public/private
  counts, empty results and safe errors; real-header transport tests verify
  stable URL/no `next-action`, pending retention, invalidation and error recovery.
- The [run thread](https://ampcode.com/threads/T-01a17cf8-91c8-72f6-b8e8-8eeecea072a1)
  records local/full checks, independent SQL totals, live HTTP and browser
  navigation/reload, deployed identity, exact production requests and cleanup.
  QA reads existing public content only: no production fixtures, auth tokens or
  database writes are necessary for this anonymous-readable operation. Local
  browser QA uses the configured development session. Retain the URL and response
  shape for at least one deployment interval; old action tabs still need refresh.
  Refresh traffic evidence for the next slice; the migration is not complete.

### Official condition reads — October 2026

- Selected `loadOfficialConditions`, the highest-volume remaining named action
  in the recent fixed-window ranking: 1,452 attempts, 1,309 HTTP <400 and 143
  HTTP ≥400. No other unarchived scheduled run owns this operation. The priority
  section records evidence reuse, mapping/coverage limitations and residual
  unmapped volume; these are request counts, not distinct actions or users.
- The shared `officialConditionsQueryOptions` browser query now uses a bodyless,
  cancellable GET to `/_actions/loadOfficialConditions`. Its parameterless typed
  contract returns `Condition[]`; no body, owner identity or lookup parameters
  are accepted as authority. Anonymous and authenticated readers get the same
  official definitions. Extra query parameters cannot alter the selection.
  This UI-specific read does not introduce a supported public JSON:API endpoint.
- `listOfficialConditions` now projects exactly `id`, `name`, `description` and
  `official`, shared by server hydration and browser JSON. The consumer audit
  found no need for creator IDs or timestamps. Custom conditions stay excluded;
  an empty database returns `[]`. The GET uses `private, no-store`, no CORS,
  telemetry and generic unexpected 500s, following the creator-condition read.
  Safe, parameterless GETs require neither mutation-origin/media checks nor a
  request-body schema; unsupported writes return framework 405s.
- Nine server prefetch sites retain the same query key and override the browser
  query function with direct `listOfficialConditions`: shared builder/detail
  hydration, monster/hazard lists, new/edit pages and profile entity pages.
  Existing direct reads for companions, tables, collections and encounters remain
  direct. Server Components do not fetch relative HTTP. Shared cards/detail
  rendering, builder validation, creator → viewer → official precedence, query
  freshness/retry, loading/error fallbacks and navigation remain unchanged.
- Removed the final `loadOfficialConditions` export and now-empty
  `app/actions/conditions.ts`. Application ratchet: **54 → 53**. Repository markers,
  mutation contracts, public APIs, schema and cache invalidation are unchanged.
  Real-SQL route tests cover official/custom separation, minimal serialization,
  empty results and safe failures. Hook tests cover the actual stable URL, no
  body/`next-action`, cancellation, pending/error recovery and shared cache use.
- The [run thread](https://ampcode.com/threads/T-01a17ad3-4ab5-7205-a5f9-9405ebba43db)
  records focused/full checks, live HTTP, browser navigation/reload and definition
  rendering, deployment identity, exact production requests and cleanup evidence.
  Development QA uses disposable local condition copies from existing public
  definitions. Production QA is anonymous and read-only, matching the existing
  access contract: no production fixtures, minted sessions or real-user writes
  are needed. Existing unrelated/deferred closeouts are not claimed completed.
- Retain this URL and response shape for at least one deployment interval.
  Pre-cutover tabs retain refresh/retry handling for legacy action references.
  Navigation counts are next by the recorded traffic ranking, subject to refresh
  when the evidence is no longer representative; migration is not yet complete.

### Creator and viewer condition reads — October 2026

- Selected `loadConditionsForDiscordId` using the recorded fixed-window ranking:
  4,783 root HTTP attempts (4,604 HTTP <400; 179 HTTP ≥400), the highest-volume
  remaining named action after reactions. The window, mapping coverage and
  sampling limitations remain recorded above; these counts are not a fresh
  measurement or distinct-user counts.
- The sole browser transport owner, `userConditionsQueryOptions` in
  `lib/hooks/useConditions.ts`, now uses bodyless typed GETs to
  `/_actions/loadConditionsForDiscordId?discordId=…` with cancellation. Its shared
  hook serves monster/hazard, item, companion, ancestry, background, class,
  subclass, school, family, collection, encounter, table, custom-rule and
  adventure rendering, plus condition validation in builders.
- Preserved the existing creator-plus-viewer contract, including anonymous
  creator reads. Discord ID is a lookup key, not session authority. There is no
  new own-session-only restriction, ownership check or public JSON:API endpoint.
  Unknown and empty lookup keys retain empty arrays; a missing parameter returns
  400. Query keys remain scoped by requested Discord ID, independent of session,
  because the same creator result is deliberately available to every viewer.
  Signing out disables/removes the viewer query from the hook's result; changing
  accounts selects that viewer's cache entry without relabeling in-flight data.
- The database helper now projects exactly `Condition`'s four JSON fields:
  `id`, `name`, `description`, `official`. Internal creator IDs and timestamps
  are not serialized or hydrated. The same projection serves direct server
  reads and browser reads; no date revival is required. All helper consumers
  were audited, including condition creation's name-only duplicate check.
- Both shared hydration components and monster/hazard new pages override the
  browser query function with direct database reads while retaining identical
  cache keys. Other server readers were already direct and remain so. No
  relative HTTP fetch runs in Server Components. `private, no-store`, no CORS,
  identifier telemetry and generic unexpected 500s follow the existing read
  boundary. Safe GETs do not require mutation origin/media headers.
- Removed the `loadConditionsForDiscordId` Server Action export; official
  conditions remain for the next bounded slice. Application ratchet: **55 → 54**;
  repository directives/counts and all mutation transports are unchanged.
  Loading/error fallbacks, condition popovers, query retry defaults, invalidation,
  navigation and creator/viewer/official combination order are unchanged.
- Route tests use real SQLite to distinguish two creators, empty/unknown keys,
  injection-like input, minimal serialization and safe telemetry errors.
  Hook transport tests verify stable GET/no `next-action`, URL encoding,
  cancellation, creator/viewer cache separation, account changes, sign-out and
  recovery after a failed read. Local/full checks, live anonymous/authenticated
  HTTP, inspected browser evidence, deployment and production cleanup results
  are recorded in the [run thread](https://ampcode.com/threads/T-01a178af-d558-748e-876d-ea6e1b43b5ed).
  QA uses disposable non-admin users, custom conditions and copies of existing
  seeded/public monster/hazard content, not real-user mutations. Production
  sessions expire after one hour and are not a dev-login bypass.
- Retain the URL and accepted shape for at least one deployment interval. Old
  tabs still need refresh/retry for legacy action references. Official-condition
  reads are next by recorded traffic, subject to refreshed evidence when stale.
  The owner's accepted/deferred reaction cleanup/recording closeout is not
  claimed completed by this slice.

### Reaction summary reads — October 2026

- Selected `getMyReactions` ahead of pagination using the verified traffic-first
  ranking above: 6,171 requests, the most-called current named operation.
  `useEntityReactions`, shared by list cards and detail controls for all 12
  reactable types (hazards use `monster`), uses a bodyless typed GET to
  `/_actions/getMyReactions?entityType=…&entityId=…`. The response remains
  `{ counts: { thumbs_up, thumbs_down }, mine }`, using JSON primitives only.
- The route validates enums/UUIDs, derives identity only from `auth()`, returns
  `private, no-store` on success and errors, records unexpected failures in
  telemetry and returns generic 500s without CORS. It is a safe read, not a
  mutation: no origin/media-type requirement is added. Anonymous reads retain
  a zero summary; inaccessible ancestries remain hidden by the existing
  repository check. Other types retain existing authorization semantics; this
  migration does not broaden their visibility checks or expose a public API.
- The shared reaction service owns the existing empty/ancestry/read behavior.
  `HydratedEntityDetail` calls it directly, never relative HTTP. Server hydration,
  browser queries and mutation updates share a session-user-scoped key; identity
  is not sent as request authority. In-flight mutation results keep their
  starting cache key even if the account changes. Counts, pending/error fallback,
  query retry defaults, manual mutation retry and navigation remain unchanged.
- The shared transport now accepts `AbortSignal`, handles 204/void and throws
  `RouteError` with HTTP status and a stable code (server code or `HTTP_<status>`),
  completing the documented browser-read prerequisites without changing other
  callers' accepted contracts. Reaction queries consume React Query cancellation.
- Removed `app/actions/reactions.ts` and its obsolete wrapper-only tests.
  Application ratchet: **56 → 55**; repository directives/counts are unchanged.
  Route tests use real SQLite aggregation with asymmetric users/reactions;
  real-component transport tests cover stable GET/no `next-action`, session
  cache isolation, in-flight account switches and pending/error recovery.
- Live development and authenticated production QA, deployment identity,
  inspected browser evidence and explicit zero-residue cleanup are recorded in
  the [run thread](https://ampcode.com/threads/T-01a1781c-f9af-7729-a9fb-5deda49e493a).
  Retain this URL and accepted shape for at least one full deployment interval.
  Pre-cutover tabs still need the existing refresh/retry path for old action IDs.
  `loadConditionsForDiscordId` is the next traffic-ranked slice; other actions
  and the recorded unrelated Companion/Heroes UI issues remain unchanged.

### Unused public ancestry lookup — October 2026

- The full caller audit found no application callers for `findPublicAncestry` in
  `app/actions/ancestry.ts`; its only import was a repository test of the wrapper
  itself. Removed the export, empty module and that exclusive test. Application
  ratchet: **57 → 56**; repository directives/counts are unchanged.
- Retained `findAncestry` serves direct server detail/metadata reads and the
  service. Repository tests still cover anonymous/non-owner private exclusion,
  owner access, public lists, collections and awards. Active pagination and
  stable ancestry saves are unchanged. No replacement endpoint, new UI, wire
  contract, auth, telemetry, cache or navigation behavior is introduced for an
  unused export; existing route/client tests cover retained stable transports.
- Focused tests: 51 passed. Full suite: 1,973 passed, seven skipped (one obsolete
  wrapper-only test removed). Live development checks cover list/detail HTML,
  malformed/missing identifiers (404), legacy UUID canonical redirects (308),
  list-to-detail client navigation and full reload. Raw CDP request and
  extra-header events verify detail GETs without `next-action`; Heroes navigation
  is active and creator attribution renders without console/page errors or
  failed HTTP responses. Chromium-canceled legacy POST reads and an RSC GET
  during navigation are recorded separately, not mistaken for HTTP failures.
- QA reads existing public content only; no fixtures or production-auth sessions
  are needed and no database writes require cleanup. Development browser QA
  uses the configured dev session; production QA is anonymous, matching the
  removed public lookup. The [run thread](https://ampcode.com/threads/T-01a1779d-7aca-77e3-a653-2ee550feb879)
  records checks, deployment identity, exact post-deployment functional requests
  and cleanup. Other legacy reads remain outside this slice.
- Active public pagination remains next in Wave 3 after shared transport
  prerequisites (`204`/void, `AbortSignal`, typed failures) and JSON:API
  field-parity work. Unused lookups may be removed without inventing endpoints.
