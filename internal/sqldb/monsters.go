package sqldb

import (
	"context"
	"encoding/json"
	"errors"
	"maps"
	"slices"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"nimble.monster/internal/nimble"
	"nimble.monster/internal/xslices"
)

var _ nimble.MonsterStore = (*MonsterStore)(nil)

type MonsterStore struct {
	db Querier
}

func NewMonsterStore(db Querier) *MonsterStore {
	return &MonsterStore{
		db: db,
	}
}

func (s *MonsterStore) Create(ctx context.Context, in nimble.Monster) (nimble.Monster, error) {
	toCreate, err := monsterToSQL(in)
	if err != nil {
		return nimble.Monster{}, err
	}

	var created Monster
	if toCreate.Legendary {
		created, err = s.db.CreateLegendaryMonster(ctx, CreateLegendaryMonsterParams{
			Actions:   toCreate.Actions,
			Abilities: toCreate.Abilities,
			Name:      toCreate.Name,
			Level:     toCreate.Level,
			Hp:        toCreate.Hp,
			Armor:     toCreate.Armor,
			Kind:      toCreate.Kind,
			Size:      toCreate.Size,
			Bloodied:  toCreate.Bloodied,
			LastStand: toCreate.LastStand,
			Saves:     toCreate.Saves,
			UserID:    toCreate.UserID,
		})
	} else {
		created, err = s.db.CreateMonster(ctx, CreateMonsterParams{
			Name:      toCreate.Name,
			Level:     toCreate.Level,
			Hp:        toCreate.Hp,
			Armor:     toCreate.Armor,
			Size:      toCreate.Size,
			Speed:     toCreate.Speed,
			Fly:       toCreate.Fly,
			Swim:      toCreate.Swim,
			Actions:   toCreate.Actions,
			Abilities: toCreate.Abilities,
			FamilyID:  toCreate.FamilyID,
			UserID:    toCreate.UserID,
		})
	}
	if err != nil {
		return nimble.Monster{}, nil
	}

	var family *Family
	if created.FamilyID.Valid {
		f, err := s.db.GetFamily(ctx, uuid.UUID(created.FamilyID.Bytes))
		// we just created this monster with a valid family, so it should exist
		if err != nil {
			return nimble.Monster{}, err
		}
		family = &f
	}

	return monsterFromSQL(created, family), nil
}

func (s *MonsterStore) Get(ctx context.Context, id nimble.MonsterID) (nimble.Monster, error) {
	var zero nimble.Monster
	cuser := nimble.CurrentUser(ctx)
	if cuser == nil {
		return zero, nimble.ErrNotAllowed
	}
	monster, err := s.db.GetMonster(ctx, uuid.UUID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return zero, nimble.ErrNotFound
	} else if err != nil {
		return zero, err
	}

	return s.monsterWithFamily(ctx, monster)
}

func (s *MonsterStore) ListForUser(ctx context.Context, userID nimble.UserID) ([]nimble.Monster, error) {
	dbmonsters, err := s.db.ListMonstersForUser(ctx, uuid.UUID(userID))
	if err != nil {
		return nil, err
	}

	return s.monstersWithFamilies(ctx, dbmonsters)
}

func (s *MonsterStore) ListPublic(ctx context.Context) ([]nimble.Monster, error) {
	dbmonsters, err := s.db.ListPublicMonsters(ctx)
	if err != nil {
		return nil, err
	}

	return s.monstersWithFamilies(ctx, dbmonsters)
}

func (s *MonsterStore) Update(ctx context.Context, monster nimble.Monster) (nimble.Monster, error) {
	update, err := monsterToSQL(monster)
	if err != nil {
		return nimble.Monster{}, err
	}

	if monster.Legendary {
		update, err = s.db.UpdateLegendaryMonster(ctx, UpdateLegendaryMonsterParams{
			ID:         update.ID,
			Actions:    update.Actions,
			Abilities:  update.Abilities,
			Name:       update.Name,
			Level:      update.Level,
			Hp:         update.Hp,
			Armor:      update.Armor,
			Kind:       update.Kind,
			Size:       update.Size,
			Bloodied:   update.Bloodied,
			LastStand:  update.LastStand,
			Saves:      update.Saves,
			Visibility: update.Visibility,
		})
	} else {
		update, err = s.db.UpdateMonster(ctx, UpdateMonsterParams{
			ID:         update.ID,
			Name:       update.Name,
			Level:      update.Level,
			Hp:         update.Hp,
			Armor:      update.Armor,
			Size:       update.Size,
			Speed:      update.Speed,
			Fly:        update.Fly,
			Swim:       update.Swim,
			Actions:    update.Actions,
			Abilities:  update.Abilities,
			Visibility: update.Visibility,
			FamilyID:   update.FamilyID,
		})
	}
	if err != nil {
		return nimble.Monster{}, err
	}

	return s.monsterWithFamily(ctx, update)
}

func (s *MonsterStore) Delete(ctx context.Context, id nimble.MonsterID) error {
	_, err := s.db.DeleteMonster(ctx, uuid.UUID(id))
	return err
}

func (s *MonsterStore) monsterWithFamily(ctx context.Context, m Monster) (nimble.Monster, error) {
	var family *Family
	if m.FamilyID.Valid {
		f, err := s.db.GetFamily(ctx, uuid.FromBytesOrNil(m.FamilyID.Bytes[:]))
		if err != nil {
			// FK should make not found impossible here
			return nimble.Monster{}, err
		}
		family = &f
	}

	return monsterFromSQL(m, family), nil
}

func (s *MonsterStore) monstersWithFamilies(ctx context.Context, monsters []Monster) ([]nimble.Monster, error) {
	familyIDs := make(map[uuid.UUID]struct{})
	for _, m := range monsters {
		if m.FamilyID.Valid {
			familyIDs[m.FamilyID.Bytes] = struct{}{}
		}
	}
	fams, err := s.db.FindFamilies(ctx, slices.Collect(maps.Keys(familyIDs)))
	if err != nil {
		return nil, err
	}

	famsByID := make(map[uuid.UUID]Family)
	for _, f := range fams {
		famsByID[f.ID] = f
	}

	return xslices.Map(monsters, func(m Monster) nimble.Monster {
		family := new(Family)
		if m.FamilyID.Valid {
			*family = famsByID[m.FamilyID.Bytes]
		}
		return monsterFromSQL(m, family)
	}), nil
}

func monsterFromSQL(in Monster, f *Family) nimble.Monster {
	var size nimble.MonsterSize
	switch in.Size {
	case SizeTypeTiny:
		size = nimble.SizeTiny
	case SizeTypeSmall:
		size = nimble.SizeSmall
	case SizeTypeMedium:
		size = nimble.SizeMedium
	case SizeTypeLarge:
		size = nimble.SizeLarge
	case SizeTypeHuge:
		size = nimble.SizeHuge
	case SizeTypeGargantuan:
		size = nimble.SizeGargantuan
	default:
		panic("unknown monster size" + in.Size)
	}

	var armor nimble.MonsterArmor
	switch in.Armor {
	case ArmorTypeValue0:
		armor = nimble.ArmorNone
	case ArmorTypeMedium:
		armor = nimble.ArmorMedium
	case ArmorTypeHeavy:
		armor = nimble.ArmorHeavy
	default:
		panic("unknown monster armor" + in.Armor)
	}

	out := nimble.Monster{
		ID:         nimble.MonsterID(in.ID),
		Legendary:  in.Legendary,
		Kind:       in.Kind,
		Name:       in.Name,
		HP:         in.Hp,
		Speed:      in.Speed,
		Fly:        in.Fly,
		Swim:       in.Swim,
		Armor:      armor,
		Size:       size,
		Level:      in.Level,
		LastStand:  in.LastStand,
		Bloodied:   in.Bloodied,
		Saves:      strings.Join(in.Saves, ", "),
		Visibility: nimble.MonsterVisibility(in.Visibility),
		Creator: nimble.User{
			ID: nimble.UserID(in.UserID),
		},
	}
	var err error
	out.Actions = make([]nimble.Action, len(in.Actions))
	for i, a := range in.Actions {
		err = errors.Join(err, json.Unmarshal(a, &out.Actions[i]))
	}
	out.Abilities = make([]nimble.Ability, len(in.Abilities))
	for i, a := range in.Abilities {
		err = errors.Join(err, json.Unmarshal(a, &out.Abilities[i]))
	}
	if f != nil {
		abilities := make([]nimble.Ability, len(f.Abilities))
		for i, a := range f.Abilities {
			err = errors.Join(err, json.Unmarshal(a, &abilities[i]))
		}
		out.Family = &nimble.Family{
			ID:        nimble.FamilyID(f.ID),
			Abilities: abilities,
			Name:      f.Name,
		}
	}
	return out
}

func monsterToSQL(m nimble.Monster) (Monster, error) {
	actions := make([][]byte, 0, len(m.Actions))
	for _, action := range m.Actions {
		b, _ := json.Marshal(action)
		actions = append(actions, json.RawMessage(b))
	}
	abilities := make([][]byte, 0, len(m.Abilities))
	for _, activity := range m.Abilities {
		b, _ := json.Marshal(activity)
		abilities = append(abilities, json.RawMessage(b))
	}
	var armor ArmorType
	switch m.Armor {
	case nimble.ArmorNone:
		armor = ArmorTypeValue0
	case nimble.ArmorMedium:
		armor = ArmorTypeMedium
	case nimble.ArmorHeavy:
		armor = ArmorTypeHeavy
	default:
		panic("unknown monster armor " + m.Armor)
	}

	var familyID pgtype.UUID
	if m.Family != nil && !uuid.UUID(m.Family.ID).IsNil() {
		familyID = pgtype.UUID{Valid: true, Bytes: [16]byte(m.Family.ID)}
	}
	return Monster{
		ID:         uuid.UUID(m.ID),
		Name:       m.Name,
		Level:      m.Level,
		Hp:         m.HP,
		Armor:      armor,
		Size:       SizeType(m.Size),
		Speed:      m.Speed,
		Fly:        m.Fly,
		Swim:       m.Swim,
		FamilyID:   familyID,
		Actions:    actions,
		Abilities:  abilities,
		Legendary:  m.Legendary,
		Kind:       m.Kind,
		Bloodied:   m.Bloodied,
		LastStand:  m.LastStand,
		Saves:      xslices.Map(strings.Split(m.Saves, ","), strings.TrimSpace),
		Visibility: MonsterVisibility(m.Visibility),
		UserID:     uuid.UUID(m.Creator.ID),
	}, nil
}
