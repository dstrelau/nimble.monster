package memdb

import (
	"cmp"
	"context"
	"slices"

	"github.com/gofrs/uuid"

	"nimble.monster/internal/sqldb"
)

// MemDB implements the minimum required DB interface for testing
type MemDB struct {
	sqldb.Querier
	monsters map[uuid.UUID]sqldb.Monster
}

var _ sqldb.Querier = (*MemDB)(nil)

func New() *MemDB {
	return &MemDB{
		monsters: make(map[uuid.UUID]sqldb.Monster),
	}
}

func (m *MemDB) CreateMonster(ctx context.Context, arg sqldb.CreateMonsterParams) (sqldb.Monster, error) {
	id, _ := uuid.NewV4()
	monster := sqldb.Monster{
		ID:        id,
		Name:      arg.Name,
		Level:     arg.Level,
		Hp:        arg.Hp,
		Armor:     arg.Armor,
		Size:      arg.Size,
		Speed:     arg.Speed,
		Fly:       arg.Fly,
		Swim:      arg.Swim,
		Actions:   arg.Actions,
		Abilities: arg.Abilities,
		UserID:    arg.UserID,
	}
	m.monsters[id] = monster
	return monster, nil
}

func (m *MemDB) CreateLegendaryMonster(ctx context.Context, arg sqldb.CreateLegendaryMonsterParams) (sqldb.Monster, error) {
	id, _ := uuid.NewV4()
	monster := sqldb.Monster{
		ID:        id,
		Name:      arg.Name,
		Level:     arg.Level,
		Hp:        arg.Hp,
		Armor:     arg.Armor,
		Size:      arg.Size,
		Actions:   arg.Actions,
		Abilities: arg.Abilities,
		UserID:    arg.UserID,
		Legendary: true,
		Kind:      arg.Kind,
		Bloodied:  arg.Bloodied,
		LastStand: arg.LastStand,
		Saves:     arg.Saves,
	}
	m.monsters[id] = monster
	return monster, nil
}

func (m *MemDB) DeleteMonster(ctx context.Context, id uuid.UUID) (sqldb.Monster, error) {
	monster := m.monsters[id]
	delete(m.monsters, id)
	return monster, nil
}

func (m *MemDB) GetMonster(ctx context.Context, id uuid.UUID) (sqldb.Monster, error) {
	return m.monsters[id], nil
}

func (m *MemDB) ListMonsters(ctx context.Context, userID uuid.UUID) ([]sqldb.Monster, error) {
	var monsters []sqldb.Monster
	for _, monster := range m.monsters {
		if monster.UserID == userID {
			monsters = append(monsters, monster)
		}
	}
	slices.SortFunc(monsters, func(a, b sqldb.Monster) int {
		return cmp.Compare(a.Name, b.Name)
	})
	return monsters, nil
}

func (m *MemDB) SearchMonsters(ctx context.Context, lower string) ([]sqldb.Monster, error) {
	var monsters []sqldb.Monster
	for _, monster := range m.monsters {
		monsters = append(monsters, monster)
	}
	return monsters, nil
}

func (m *MemDB) UpdateMonster(ctx context.Context, arg sqldb.UpdateMonsterParams) (sqldb.Monster, error) {
	monster := m.monsters[arg.ID]
	monster.Name = arg.Name
	monster.Level = arg.Level
	monster.Hp = arg.Hp
	monster.Armor = arg.Armor
	monster.Size = arg.Size
	monster.Speed = arg.Speed
	monster.Fly = arg.Fly
	monster.Swim = arg.Swim
	monster.Actions = arg.Actions
	monster.Abilities = arg.Abilities
	m.monsters[arg.ID] = monster
	return monster, nil
}

func (m *MemDB) UpdateLegendaryMonster(ctx context.Context, arg sqldb.UpdateLegendaryMonsterParams) (sqldb.Monster, error) {
	monster := m.monsters[arg.ID]
	monster.Name = arg.Name
	monster.Level = arg.Level
	monster.Hp = arg.Hp
	monster.Armor = arg.Armor
	monster.Size = arg.Size
	monster.Actions = arg.Actions
	monster.Abilities = arg.Abilities
	monster.Kind = arg.Kind
	monster.Bloodied = arg.Bloodied
	monster.LastStand = arg.LastStand
	monster.Saves = arg.Saves
	m.monsters[arg.ID] = monster
	return monster, nil
}
