# Litestream 0.5 cutover and recovery

The runner uses Litestream **0.5.17**. SQLite remains on `/data/db.sqlite`;
neither the database schema nor application queries change.

## Storage boundaries

| Purpose | Tigris prefix in `nimble-nexus-litestream` | Local metadata |
| --- | --- | --- |
| Previous 0.3 stream | `db.sqlite/` | `/data/.db.sqlite-litestream` |
| New 0.5 stream | `db.sqlite-v0.5/` | `/data/.db.sqlite-litestream-v0.5` |

The separate prefixes and metadata avoid reusing positions from a different
backup stream. Leave the previous prefix and metadata untouched during the
rollback window. The old backup stops advancing at cutover; it **cannot recover
post-cutover writes**. Litestream 0.5 can restore 0.3 backups, but 0.3 cannot
restore 0.5 LTX backups.

Snapshot configuration is now global: `snapshot.interval: 24h` and
`snapshot.retention: 168h`. Replica-level retention is not honored by 0.5.
Retention keeps the latest snapshot and its restore dependencies, so seven days
is not a hard maximum object age. The previous prefix is not pruned by the new
stream; retiring it later is a separate, explicitly approved operation.

## Before approving cutover

1. Run `make check` and `pnpm run test:run`. Build the Docker runner and verify
   `litestream version` reports `0.5.17`; start it as `node` with a writable
   disposable volume, the migrated config, and a restored application database.
   Check public data routes and the anonymous auth-session boundary.
2. Restore a current production backup to a disposable file using both 0.3.13
   and 0.5.17. Run `PRAGMA integrity_check` and check schema/content. This is a
   read of the backup, not a restore over the live database.
3. Against isolated S3 storage, verify old-format restores, new snapshots and
   incremental writes, updates/deletes/rolled-back transactions, a payload over
   16 MiB, concurrent writes, WAL checkpoints, graceful shutdown, forced
   termination/restart, and restoring a missing database before `-exec` starts.
   Unavailable storage must prevent missing-database startup, not create an
   empty replacement. Verify retention with shortened test intervals and rehearse
   rollback using the current database, not the old snapshot.
4. With explicit permission, repeat candidate upload/restore tests against a
   disposable **Tigris** prefix using the production backup credential scope.
   Confirm both upload and delete permissions apply to the new production
   prefix, and review bucket lifecycle rules. A local S3 emulator does not prove
   Tigris behavior or IAM permissions.
5. Confirm the production volume contains the current, healthy SQLite database.
   The new prefix is initially empty: if the local DB is missing at the first
   cutover, recover it from the **old** prefix first. Automatic restore consults
   only the configured new prefix; an empty prefix permits fresh initialization.

Do not push to `main` until cutover is approved: the workflow deploys on push.
Do not run two Litestream processes against the same SQLite file or new prefix.

## Cutover

1. Record the running Fly image reference and retain the old config/binary.
   Capture a final consistent recovery point. Do not copy a live SQLite file
   without its WAL; use SQLite backup or a verified Litestream restore.
2. Deploy the approved image through the normal deployment workflow. Let Fly
   terminate the old Litestream process gracefully; its `-exec` child receives
   the shutdown signal. Do not delete the database, WAL, SHM, or old metadata.
3. Verify the running binary version, app health, and startup logs. Confirm
   snapshot interval/retention and the new prefix. `litestream databases` only
   validates configuration; it does not establish backup freshness.
4. Wait for the first new LTX backup, then restore the new prefix to a disposable
   path. Check integrity and compare a known committed record to the live DB.
   Check logs for sync/upload errors and observe subsequent writes backing up.
5. Keep both backup formats and the previous image until this restore succeeds
   and the rollback window is explicitly closed.

## Recovery

`restore-if-db-not-exists: true` restores from the **new** prefix before the
Node child starts. It does not replace an existing database. Restore errors
abort startup, but no backup at all allows fresh initialization.

For a manual restore, first stop application writes and replication. Use a
maintenance session with the correct config/credentials and run as `node` (or
restore ownership afterward). Never overwrite the live file while the app runs.
Restore to a disposable path and verify it before replacing the database:

```sh
litestream restore -config /etc/litestream.yml \
  -o /data/recovered.sqlite /data/db.sqlite
sqlite3 /data/recovered.sqlite 'PRAGMA integrity_check;'
```

To restore the pre-cutover stream, use a **copy** of the config with replica
`path: db.sqlite` instead. Keep the actual production config unchanged until
the recovery decision is made. Explicit config preserves the Tigris endpoint
and the `LITESTREAM_*` credentials; a bare S3 URL does not supply those settings.

## Rollback without losing newer writes

Stop the candidate cleanly and retain the current SQLite file and WAL. Start
0.3.13 with a saved 0.3-format config, **fresh local metadata** and a fresh
rollback prefix. Preserve the original metadata rather than deleting it. Verify
a new write can be backed up and restored by 0.3 before declaring rollback
complete. Merely deploying the old image reuses stale metadata and is not the
rehearsed rollback procedure.

If the volume is lost after cutover, recover the latest 0.5 backup with the 0.5
binary first, then start 0.3 replication from that recovered SQLite file. Falling
back directly to the frozen 0.3 backup loses post-cutover writes.

Upstream reference: <https://litestream.io/docs/migration/>.
