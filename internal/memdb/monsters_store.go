package memdb

import (
	"context"
	"errors"
	"sync"

	"nimble.monster/internal/nimble"
)

type MonsterStore struct {
	mu      sync.RWMutex
	storage map[nimble.MonsterID]nimble.Monster
}

func NewMonsterStore() *MonsterStore {
	return &MonsterStore{
		storage: make(map[nimble.MonsterID]nimble.Monster),
	}
}

func (s *MonsterStore) Get(_ context.Context, id nimble.MonsterID) (nimble.Monster, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	monster, ok := s.storage[id]
	if !ok {
		return nimble.Monster{}, errors.New("monster not found")
	}
	return monster, nil
}

func (s *MonsterStore) ListPublic(_ context.Context) ([]nimble.Monster, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []nimble.Monster
	for _, monster := range s.storage {
		if monster.Visibility == nimble.MonsterVisibilityPublic {
			result = append(result, monster)
		}
	}
	return result, nil
}

func (s *MonsterStore) ListForUser(_ context.Context, userID nimble.UserID) ([]nimble.Monster, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []nimble.Monster
	for _, monster := range s.storage {
		if monster.Creator.ID == userID {
			result = append(result, monster)
		}
	}
	return result, nil
}

func (s *MonsterStore) Create(_ context.Context, monster nimble.Monster) (nimble.Monster, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.storage[monster.ID]; exists {
		return nimble.Monster{}, errors.New("monster already exists")
	}

	s.storage[monster.ID] = monster
	return monster, nil
}

func (s *MonsterStore) Update(_ context.Context, monster nimble.Monster) (nimble.Monster, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.storage[monster.ID]; !exists {
		return nimble.Monster{}, errors.New("monster not found")
	}

	s.storage[monster.ID] = monster
	return monster, nil
}

func (s *MonsterStore) Delete(_ context.Context, id nimble.MonsterID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.storage[id]; !exists {
		return errors.New("monster not found")
	}

	delete(s.storage, id)
	return nil
}
