// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0

package sqldb

import (
	"database/sql/driver"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type ArmorType string

const (
	ArmorTypeValue0 ArmorType = ""
	ArmorTypeMedium ArmorType = "medium"
	ArmorTypeHeavy  ArmorType = "heavy"
)

func (e *ArmorType) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = ArmorType(s)
	case string:
		*e = ArmorType(s)
	default:
		return fmt.Errorf("unsupported scan type for ArmorType: %T", src)
	}
	return nil
}

type NullArmorType struct {
	ArmorType ArmorType
	Valid     bool // Valid is true if ArmorType is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullArmorType) Scan(value interface{}) error {
	if value == nil {
		ns.ArmorType, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.ArmorType.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullArmorType) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.ArmorType), nil
}

type CollectionVisibility string

const (
	CollectionVisibilityPublic  CollectionVisibility = "public"
	CollectionVisibilitySecret  CollectionVisibility = "secret"
	CollectionVisibilityPrivate CollectionVisibility = "private"
)

func (e *CollectionVisibility) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = CollectionVisibility(s)
	case string:
		*e = CollectionVisibility(s)
	default:
		return fmt.Errorf("unsupported scan type for CollectionVisibility: %T", src)
	}
	return nil
}

type NullCollectionVisibility struct {
	CollectionVisibility CollectionVisibility
	Valid                bool // Valid is true if CollectionVisibility is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullCollectionVisibility) Scan(value interface{}) error {
	if value == nil {
		ns.CollectionVisibility, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.CollectionVisibility.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullCollectionVisibility) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.CollectionVisibility), nil
}

type FamilyVisibility string

const (
	FamilyVisibilityPublic  FamilyVisibility = "public"
	FamilyVisibilitySecret  FamilyVisibility = "secret"
	FamilyVisibilityPrivate FamilyVisibility = "private"
)

func (e *FamilyVisibility) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = FamilyVisibility(s)
	case string:
		*e = FamilyVisibility(s)
	default:
		return fmt.Errorf("unsupported scan type for FamilyVisibility: %T", src)
	}
	return nil
}

type NullFamilyVisibility struct {
	FamilyVisibility FamilyVisibility
	Valid            bool // Valid is true if FamilyVisibility is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullFamilyVisibility) Scan(value interface{}) error {
	if value == nil {
		ns.FamilyVisibility, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.FamilyVisibility.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullFamilyVisibility) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.FamilyVisibility), nil
}

type MonsterVisibility string

const (
	MonsterVisibilityPublic  MonsterVisibility = "public"
	MonsterVisibilityPrivate MonsterVisibility = "private"
)

func (e *MonsterVisibility) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = MonsterVisibility(s)
	case string:
		*e = MonsterVisibility(s)
	default:
		return fmt.Errorf("unsupported scan type for MonsterVisibility: %T", src)
	}
	return nil
}

type NullMonsterVisibility struct {
	MonsterVisibility MonsterVisibility
	Valid             bool // Valid is true if MonsterVisibility is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullMonsterVisibility) Scan(value interface{}) error {
	if value == nil {
		ns.MonsterVisibility, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.MonsterVisibility.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullMonsterVisibility) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.MonsterVisibility), nil
}

type SizeType string

const (
	SizeTypeTiny       SizeType = "tiny"
	SizeTypeSmall      SizeType = "small"
	SizeTypeMedium     SizeType = "medium"
	SizeTypeLarge      SizeType = "large"
	SizeTypeHuge       SizeType = "huge"
	SizeTypeGargantuan SizeType = "gargantuan"
)

func (e *SizeType) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = SizeType(s)
	case string:
		*e = SizeType(s)
	default:
		return fmt.Errorf("unsupported scan type for SizeType: %T", src)
	}
	return nil
}

type NullSizeType struct {
	SizeType SizeType
	Valid    bool // Valid is true if SizeType is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullSizeType) Scan(value interface{}) error {
	if value == nil {
		ns.SizeType, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.SizeType.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullSizeType) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.SizeType), nil
}

type Collection struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Name        string
	Public      pgtype.Bool
	CreatedAt   pgtype.Timestamptz
	UpdatedAt   pgtype.Timestamptz
	Description string
	Visibility  CollectionVisibility
}

type Family struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	Visibility FamilyVisibility
	Name       string
	Abilities  [][]byte
	CreatedAt  pgtype.Timestamptz
	UpdatedAt  pgtype.Timestamptz
}

type Monster struct {
	ID            uuid.UUID
	Name          string
	Level         string
	Hp            int32
	Armor         ArmorType
	Size          SizeType
	Speed         int32
	Fly           int32
	Swim          int32
	Actions       [][]byte
	Abilities     [][]byte
	Legendary     bool
	Bloodied      string
	LastStand     string
	Saves         []string
	CreatedAt     pgtype.Timestamptz
	UpdatedAt     pgtype.Timestamptz
	UserID        uuid.UUID
	Kind          string
	Visibility    MonsterVisibility
	FamilyID      pgtype.UUID
	ActionPreface pgtype.Text
	MoreInfo      pgtype.Text
}

type MonstersCollection struct {
	MonsterID    uuid.UUID
	CollectionID uuid.UUID
}

type Session struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	DiscordID string
	ExpiresAt pgtype.Timestamptz
}

type User struct {
	ID           uuid.UUID
	DiscordID    string
	Username     string
	Avatar       pgtype.Text
	RefreshToken pgtype.Text
}
