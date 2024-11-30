package nimble

type Family struct {
	Name        string
	Slug        string
	Description string
	Ability     *Ability
}

type MonsterArmor string

const (
	ArmorUnarmored MonsterArmor = "unarmored"
	ArmorMedium    MonsterArmor = "medium"
	ArmorHeavy     MonsterArmor = "heavy"
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
	ID          string
	Name        string
	Slug        string
	HP          int
	Speed       int
	Fly         int
	Swim        int
	Armor       MonsterArmor
	Size        MonsterSize
	Level       string
	LastStand   string
	Bloodied    string
	Contributor string
	Abilities   []Ability
	Actions     []Action
	Family      *Family
}

type Ability struct {
	Name        string
	Description string
}

type Action struct {
	Name        string
	Damage      string
	Range       string
	Description string
}
