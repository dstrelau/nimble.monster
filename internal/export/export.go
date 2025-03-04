package export

type OBRCompendiumPack struct {
	Name      string                       `json:"name"`
	ID        string                       `json:"id"`
	Version   string                       `json:"version"`
	Documents []OBRCompendiumNimbleMonster `json:"documents"`
}

type OBRCompendiumNimbleMonster struct {
	Name string `json:"name"`
	Type string `json:"type"`

	Level    string                 `json:"level,omitempty"`
	HP       int                    `json:"hp,omitempty"`
	Armor    *string                `json:"armor"`
	Features []OBRCompendiumFeature `json:"features,omitempty"`
	Actions  []OBRCompendiumFeature `json:"actions,omitempty"`
	Attacks  []OBRCompendiumFeature `json:"attacks,omitempty"`
}

type OBRCompendiumFeature struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}
