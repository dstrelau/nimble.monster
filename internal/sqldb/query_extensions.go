package sqldb

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (q *Queries) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return q.DeleteSessionUUID(ctx, pgtype.UUID{Valid: true, Bytes: id})
}
func (q *Queries) GetUserByUnexpiredSessionID(ctx context.Context, id uuid.UUID) (User, error) {
	return q.GetUserByUnexpiredSessionUUID(ctx, pgtype.UUID{Valid: true, Bytes: id})
}
