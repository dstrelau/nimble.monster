# Database Layer

## Architecture

- **ORM**: Drizzle ORM
- **Database**: Plain SQLite via libsql client (no remote sync)
  - Local SQLite file at `/data/db.sqlite` on the Fly volume
  - Configured via `DATABASE_URL=file:/data/db.sqlite`
- **Backup**: [Litestream](https://litestream.io) streams the WAL to Tigris
  (Fly's S3-compatible storage) for point-in-time recovery. Litestream runs
  in the same container as the Node process, wrapping it via
  `litestream replicate -exec "node server.js"`. See `litestream.yml` and
  the `runner` stage of the `Dockerfile`.

## Key Files

- `client.ts` - libsql client (plain local file)
- `drizzle.ts` - Drizzle ORM instance
- `schema.ts` - Database schema definitions
- `entity-images.ts` - Image generation claim/status tracking

## WAL Checkpoints

Auto-checkpoint is on for plain SQLite, but after bulk writes (e.g. admin
imports) call `checkpoint()` from `client.ts` explicitly to truncate the WAL
and keep Litestream snapshots small.

## Restoring from Backup

If `/data/db.sqlite` is lost (volume failure, fresh machine, etc.) Litestream
will restore from S3 on first run. To restore manually:

```bash
fly ssh console -a nimble-nexus
litestream restore -o /data/db.sqlite s3://nimble-nexus-litestream/db.sqlite
```

## Debugging Database Issues

```bash
# Tail fly logs for db / litestream errors
fly logs -a nimble-nexus --no-tail | grep -iE "litestream|sqlite|Failed query"
```

## Transactions

When using `db.transaction()`:
- All operations are local (no network round-trip)
- If the transaction fails mid-way, nothing is committed
- Litestream replicates committed WAL frames; in-flight transactions are not
  visible to replicas until commit
