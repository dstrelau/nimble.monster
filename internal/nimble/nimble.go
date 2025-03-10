package nimble

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/gofrs/uuid"
)

type ID uuid.UUID

func (id ID) IsNil() bool {
	return uuid.UUID(id).IsNil()
}

func (id ID) String() string {
	return uuid.UUID(id).String()
}

func (id ID) MarshalJSON() ([]byte, error) {
	return []byte(`"` + id.String() + `"`), nil
}

func (id *ID) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	if s == "" {
		*id = ID(uuid.Nil)
		return nil
	}
	u, err := uuid.FromString(s)
	if err != nil {
		return err
	}
	*id = ID(u)
	return nil
}

type UserID = ID
type MonsterID = ID
type CollectionID = ID
type FamilyID = ID

var (
	ErrNotFound   = errors.New("not found")
	ErrNotAllowed = errors.New("not allowed")
)

type Error struct {
	Message string `json:"message"`
}

func (e Error) Error() string {
	return e.Message
}

type User struct {
	ID        UserID `json:"id"`
	DiscordID string `json:"discordId"`
	Username  string `json:"username"`
	Avatar    string `json:"avatar"`
}

type currentUserCtxKey struct{}

func SetCurrentUser(ctx context.Context, u User) context.Context {
	return context.WithValue(ctx, currentUserCtxKey{}, &u)
}

// might be nil!
func CurrentUser(ctx context.Context) *User {
	u, _ := ctx.Value(currentUserCtxKey{}).(*User)
	return u
}
