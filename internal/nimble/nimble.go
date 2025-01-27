package nimble

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/gofrs/uuid"
	"nimble.monster/internal/sqldb"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	DiscordID string    `json:"discordId"`
	Username  string    `json:"username"`
	Avatar    string    `json:"avatar"`
}

type Family struct {
	Name        string
	Description string
	Ability     *Ability
}

type MonsterArmor string

const (
	ArmorNone   MonsterArmor = "none"
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
	ID        string       `json:"id"`
	Legendary bool         `json:"legendary"`
	Kind      string       `json:"kind"`
	Name      string       `json:"name"`
	HP        int32        `json:"hp"`
	Speed     int32        `json:"speed"`
	Fly       int32        `json:"fly"`
	Swim      int32        `json:"swim"`
	Armor     MonsterArmor `json:"armor"`
	Size      MonsterSize  `json:"size"`
	Level     string       `json:"level"`
	LastStand string       `json:"lastStand"`
	Bloodied  string       `json:"bloodied"`
	Saves     string       `json:"saves"`
	Abilities []Ability    `json:"abilities"`
	Actions   []Action     `json:"actions"`
	Family    *Family      `json:"family"`
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

type Collection struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Creator       string    `json:"creator"`
	Monsters      []Monster `json:"monsters"`
	MonstersCount int       `json:"monsters_count"`
	Public        bool      `json:"public"`
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
	case sqldb.ArmorTypeNone:
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
