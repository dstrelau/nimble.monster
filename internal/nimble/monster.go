package nimble

import (
	"context"
)

type MonsterStore interface {
	Get(context.Context, MonsterID) (Monster, error)
	ListPublic(context.Context) ([]Monster, error)
	ListForUser(context.Context, UserID) ([]Monster, error)
	Create(context.Context, Monster) (Monster, error)
	Update(context.Context, Monster) (Monster, error)
	Delete(context.Context, MonsterID) error
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

type MonsterVisibility string

const (
	MonsterVisibilityPublic  MonsterVisibility = "public"
	MonsterVisibilityPrivate MonsterVisibility = "private"
)

type Monster struct {
	Creator    User              `json:"-"`
	Family     *Family           `json:"family"`
	Bloodied   string            `json:"bloodied"`
	LastStand  string            `json:"lastStand"`
	Name       string            `json:"name"`
	Saves      string            `json:"saves"`
	Size       MonsterSize       `json:"size"`
	ID         MonsterID         `json:"id"`
	Kind       string            `json:"kind"`
	Armor      MonsterArmor      `json:"armor"`
	Level      string            `json:"level"`
	Abilities  []Ability         `json:"abilities"`
	Actions    []Action          `json:"actions"`
	Speed      int32             `json:"speed"`
	Swim       int32             `json:"swim"`
	Fly        int32             `json:"fly"`
	HP         int32             `json:"hp"`
	Legendary  bool              `json:"legendary"`
	Visibility MonsterVisibility `json:"visibility"`
}

type FamilyStore interface {
	ListPublic(context.Context) ([]Family, error)
}

type FamilyVisibility string

const (
	FamilyVisibilityPublic  FamilyVisibility = "public"
	FamilyVisibilityPrivate FamilyVisibility = "private"
	FamilyVisibilitySecret  FamilyVisibility = "secret"
)

type Family struct {
	ID          FamilyID         `json:"id"`
	Abilities   []Ability        `json:"abilities"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Visibility  FamilyVisibility `json:"visibility"`
}

type Ability struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Action struct {
	Name        string `json:"name"`
	Damage      string `json:"damage"`
	Description string `json:"description"`
}
