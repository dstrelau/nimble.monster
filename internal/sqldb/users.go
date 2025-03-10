package sqldb

import (
	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"nimble.monster/internal/nimble"
)

func userFromSQL(u User) nimble.User {
	return nimble.User{
		ID:        nimble.UserID(u.ID),
		Username:  u.Username,
		Avatar:    u.Avatar.String,
		DiscordID: u.DiscordID,
	}
}

func userToSQL(u nimble.User) User {
	return User{
		ID:        uuid.UUID(u.ID),
		Username:  u.Username,
		Avatar:    pgtype.Text{String: u.Avatar, Valid: u.Avatar != ""},
		DiscordID: u.DiscordID,
	}
}
