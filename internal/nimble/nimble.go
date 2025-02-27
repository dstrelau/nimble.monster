package nimble

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/gofrs/uuid"
	"nimble.monster/internal/sqldb"
)

type User struct {
	DiscordID string    `json:"discordId"`
	Username  string    `json:"username"`
	Avatar    string    `json:"avatar"`
	ID        uuid.UUID `json:"id"`
}

type Family struct {
	Ability     *Ability
	Name        string
	Description string
}

type MonsterArmor string

const (
	ArmorNone   MonsterArmor = ""
	ArmorMedium MonsterArmor = "medium"
	ArmorHeavy  MonsterArmor = "heavy"
)

type MonsterSize string

const (
	SizeTiny       MonsterSize = "tiny"
	SizeSmall      MonsterSize = "small"
	SizeMedium     MonsterSize = "medium"
	SizeLarge      MonsterSize = "large"
	SizeHuge       MonsterSize = "huge"
	SizeGargantuan MonsterSize = "gargantuan"
)

func (s MonsterSize) Display() string {
	switch s {
	case SizeTiny:
		return "Tiny"
	case SizeSmall:
		return "Small"
	case SizeMedium:
		return "Medium"
	case SizeLarge:
		return "Large"
	case SizeHuge:
		return "Huge"
	case SizeGargantuan:
		return "Gargantuan"
	default:
		return "Medium"
	}
}

func MonsterSizeFromString(s string) MonsterSize {
	switch s {
	case "tiny":
		return SizeTiny
	case "small":
		return SizeSmall
	case "medium":
		return SizeMedium
	case "large":
		return SizeLarge
	case "huge":
		return SizeHuge
	case "gargantuan":
		return SizeGargantuan
	default:
		return SizeMedium
	}
}

type Monster struct {
	Family    *Family      `json:"family"`
	Bloodied  string       `json:"bloodied"`
	LastStand string       `json:"lastStand"`
	Name      string       `json:"name"`
	Saves     string       `json:"saves"`
	Size      MonsterSize  `json:"size"`
	ID        string       `json:"id"`
	Kind      string       `json:"kind"`
	Armor     MonsterArmor `json:"armor"`
	Level     string       `json:"level"`
	Abilities []Ability    `json:"abilities"`
	Actions   []Action     `json:"actions"`
	Speed     int32        `json:"speed"`
	Swim      int32        `json:"swim"`
	Fly       int32        `json:"fly"`
	HP        int32        `json:"hp"`
	Legendary bool         `json:"legendary"`
	UserID    uuid.UUID    `json:"-"`
}

type Ability struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Action struct {
	Name        string `json:"name"`
	Damage      string `json:"damage"`
	Range       string `json:"range"`
	Description string `json:"description"`
}

func MonsterFromSQL(in sqldb.Monster) Monster {
	var err error
	var size MonsterSize
	switch in.Size {
	case sqldb.SizeTypeTiny:
		size = SizeTiny
	case sqldb.SizeTypeSmall:
		size = SizeSmall
	case sqldb.SizeTypeMedium:
		size = SizeMedium
	case sqldb.SizeTypeLarge:
		size = SizeLarge
	case sqldb.SizeTypeHuge:
		size = SizeHuge
	case sqldb.SizeTypeGargantuan:
		size = SizeGargantuan
	default:
		panic("unknown monster size" + in.Size)
	}

	var armor MonsterArmor
	switch in.Armor {
	case sqldb.ArmorTypeValue0:
		armor = ArmorNone
	case sqldb.ArmorTypeMedium:
		armor = ArmorMedium
	case sqldb.ArmorTypeHeavy:
		armor = ArmorHeavy
	default:
		panic("unknown monster armor" + in.Armor)
	}

	out := Monster{
		ID:        in.ID.String(),
		Legendary: in.Legendary,
		Kind:      in.Kind,
		Name:      in.Name,
		HP:        in.Hp,
		Speed:     in.Speed,
		Fly:       in.Fly,
		Swim:      in.Swim,
		Armor:     armor,
		Size:      size,
		Level:     in.Level,
		LastStand: in.LastStand,
		Bloodied:  in.Bloodied,
		Saves:     strings.Join(in.Saves, ", "),
	}
	out.Actions = make([]Action, len(in.Actions))
	for i, a := range in.Actions {
		err = errors.Join(err, json.Unmarshal(a, &out.Actions[i]))
	}
	out.Abilities = make([]Ability, len(in.Abilities))
	for i, a := range in.Abilities {
		err = errors.Join(err, json.Unmarshal(a, &out.Abilities[i]))
	}
	return out
}

type CollectionVisibility string

const (
	CollectionVisibilityPublic  CollectionVisibility = "public"
	CollectionVisibilityPrivate CollectionVisibility = "private"
	CollectionVisibilitySecret  CollectionVisibility = "secret"
)

type Collection struct {
	ID            string               `json:"id"`
	Name          string               `json:"name"`
	Creator       string               `json:"creator"`
	Monsters      []Monster            `json:"monsters"`
	MonstersCount int                  `json:"monstersCount"`
	Visibility    CollectionVisibility `json:"visibility"`
}

type PublicCollection struct {
	ID               string               `json:"id"`
	Name             string               `json:"name"`
	Visibility       CollectionVisibility `json:"visibility"`
	MonstersCount    int                  `json:"monstersCount"`
	LegendaryCount   int                  `json:"legendaryCount"`
	StandardCount    int                  `json:"standardCount"`
	Creator          string               `json:"creator"`
	CreatorName      string               `json:"creatorName"`
	CreatorAvatar    string               `json:"creatorAvatar"`
	CreatorDiscordID string               `json:"creatorDiscordId"`
}
