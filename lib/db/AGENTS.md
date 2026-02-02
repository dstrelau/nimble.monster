# Database Layer

## Architecture

- **ORM**: Drizzle ORM
- **Database**: Turso (hosted SQLite via libsql)
- **Production mode**: Embedded replicas
  - Local SQLite file at `/data/db.sqlite` for fast reads
  - Syncs with remote Turso for writes
  - Configured via `DATABASE_URL` (local) + `DATABASE_SYNC_URL` (remote)

## Key Files

- `client.ts` - libsql client with auto-retry wrapper
- `drizzle.ts` - Drizzle ORM instance
- `schema.ts` - Database schema definitions
- `entity-images.ts` - Image generation claim/status tracking

## Hrana Stream Errors

Turso uses the Hrana protocol over HTTP/WebSocket. Connections can go stale
when Turso expires them server-side but the client doesn't know.

**Symptom**: `Hrana(Api("status=404 Not Found, body={"error":"stream not found: ..."}")))`

**Solution**: The client in `client.ts` wraps all async methods with retry logic.
On Hrana stream errors, it resets the connection and retries once.

**Important**: Transaction objects returned by `client.transaction()` are NOT
wrapped. If a Hrana error occurs mid-transaction, the transaction is invalid
and the caller must retry their entire transaction logic.

## Debugging Database Issues

```bash
# Check Fly.io logs for database errors
fly logs -a nimble-nexus --no-tail | grep -i "hrana\|stream not found\|Failed query"

# Look for the [cause] in error logs - it contains the actual database error
fly logs -a nimble-nexus --no-tail | grep -B2 -A2 "cause"
```

## Transactions

When using `db.transaction()`:
- All operations go through the remote Turso (not local replica)
- This ensures consistency for read-after-write scenarios
- If the transaction fails mid-way, nothing is committed
- The caller is responsible for retry logic if needed
