package app_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"nimble.monster/internal/app"
	"nimble.monster/internal/memdb"
	"nimble.monster/internal/nimble"
	"nimble.monster/internal/sqldb"
)

func TestMonstersHandler_CreateMonster_Standard(t *testing.T) {
	db := memdb.New()
	handler := app.NewMonstersHandler(db)

	monster := nimble.Monster{
		Name:  "Goblin",
		HP:    12,
		Speed: 6,
		Armor: nimble.ArmorNone,
		Size:  nimble.SizeSmall,
		Level: "1/3",
		Actions: []nimble.Action{
			{
				Name:   "Slash",
				Damage: "1d6",
				Range:  "5ft",
			},
		},
	}

	body, err := json.Marshal(monster)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/monsters", bytes.NewReader(body))
	req = req.WithContext(withTestUser(req.Context()))
	w := httptest.NewRecorder()

	handler.CreateMonster(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response nimble.Monster
	err = json.NewDecoder(w.Body).Decode(&response)
	require.NoError(t, err)

	assert.NotEmpty(t, response.ID)
	assert.Equal(t, monster.Name, response.Name)
	assert.Equal(t, monster.HP, response.HP)
	assert.Equal(t, monster.Speed, response.Speed)
	assert.Equal(t, monster.Armor, response.Armor)
	assert.Equal(t, monster.Size, response.Size)
	assert.False(t, response.Legendary)
}

func TestMonstersHandler_CreateMonster_Legendary(t *testing.T) {
	db := memdb.New()
	handler := app.NewMonstersHandler(db)

	monster := nimble.Monster{
		Name:      "Ancient Dragon",
		HP:        300,
		Speed:     8,
		Fly:       10,
		Armor:     nimble.ArmorHeavy,
		Size:      nimble.SizeHuge,
		Level:     "14",
		Legendary: true,
		Kind:      "Dragon",
		Bloodied:  "When bloodied, gains +2 to AC",
		LastStand: "When reduced to 0 HP, makes one final attack",
		Saves:     "STR++, DEX+, WIL+++",
		Actions: []nimble.Action{
			{
				Name:   "Breath Weapon",
				Damage: "8d6",
				Range:  "Cone 8",
			},
		},
	}

	body, err := json.Marshal(monster)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/monsters", bytes.NewReader(body))
	req = req.WithContext(withTestUser(req.Context()))
	w := httptest.NewRecorder()

	handler.CreateMonster(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response nimble.Monster
	err = json.NewDecoder(w.Body).Decode(&response)
	require.NoError(t, err)

	assert.NotEmpty(t, response.ID)
	assert.Equal(t, monster.Name, response.Name)
	assert.Equal(t, monster.HP, response.HP)
	assert.Equal(t, monster.Armor, response.Armor)
	assert.Equal(t, monster.Size, response.Size)
	assert.True(t, response.Legendary)
	assert.Equal(t, monster.Kind, response.Kind)
	assert.Equal(t, monster.Bloodied, response.Bloodied)
	assert.Equal(t, monster.LastStand, response.LastStand)
	assert.Equal(t, monster.Saves, response.Saves)
}

func TestMonstersHandler_ListMyMonsters(t *testing.T) {
	t.Run("lists all user monsters", func(t *testing.T) {
		db := memdb.New()
		handler := app.NewMonstersHandler(db)
		ctx := withTestUser(context.Background())
		user := app.CurrentUser(ctx)

		standardMonsters := []struct {
			name   string
			hp     int32
			level  string
			size   sqldb.SizeType
			userID uuid.UUID
		}{
			{
				name:   "Goblin",
				hp:     12,
				level:  "1/3",
				size:   sqldb.SizeTypeSmall,
				userID: user.ID,
			},
			{
				name:   "Orc",
				hp:     20,
				level:  "1",
				size:   sqldb.SizeTypeMedium,
				userID: user.ID,
			},
			{
				name:   "Troll",
				hp:     30,
				level:  "2",
				size:   sqldb.SizeTypeLarge,
				userID: uuid.Must(uuid.NewV4()),
			},
		}

		for _, m := range standardMonsters {
			_, err := db.CreateMonster(ctx, sqldb.CreateMonsterParams{
				UserID: m.userID,
				Name:   m.name,
				Hp:     m.hp,
				Level:  m.level,
				Size:   m.size,
			})
			require.NoError(t, err)
		}

		_, err := db.CreateLegendaryMonster(ctx, sqldb.CreateLegendaryMonsterParams{
			UserID: user.ID,
			Name:   "Dragon",
			Hp:     300,
			Level:  "14",
			Size:   sqldb.SizeTypeHuge,
		})
		require.NoError(t, err)

		// Test listing endpoint
		req := httptest.NewRequest(http.MethodGet, "/monsters", nil)
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()

		handler.ListMyMonsters(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Monsters []nimble.Monster `json:"monsters"`
		}
		err = json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.Len(t, response.Monsters, 3)
		assert.Equal(t, "Dragon", response.Monsters[0].Name) // Should be sorted by name
		assert.Equal(t, "Goblin", response.Monsters[1].Name)
		assert.Equal(t, "Orc", response.Monsters[2].Name)
	})

	t.Run("filters monsters by IDs", func(t *testing.T) {
		db := memdb.New()
		handler := app.NewMonstersHandler(db)
		ctx := withTestUser(context.Background())
		user := app.CurrentUser(ctx)

		// Create test monsters directly in db
		goblin, err := db.CreateMonster(ctx, sqldb.CreateMonsterParams{
			UserID: user.ID,
			Name:   "Goblin",
			Hp:     12,
			Level:  "1/3",
		})
		require.NoError(t, err)

		_, err = db.CreateMonster(ctx, sqldb.CreateMonsterParams{
			UserID: user.ID,
			Name:   "Dragon",
			Hp:     300,
			Level:  "14",
		})
		require.NoError(t, err)

		orc, err := db.CreateMonster(ctx, sqldb.CreateMonsterParams{
			UserID: user.ID,
			Name:   "Orc",
			Hp:     20,
			Level:  "1",
		})
		require.NoError(t, err)

		// Test listing with ID filter (just first and last monster)
		req := httptest.NewRequest(http.MethodGet, "/monsters?ids="+goblin.ID.String()+"&ids="+orc.ID.String(), nil)
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()

		handler.ListMyMonsters(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Monsters []nimble.Monster `json:"monsters"`
		}
		err = json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.Len(t, response.Monsters, 2)
		assert.Equal(t, goblin.ID.String(), response.Monsters[0].ID)
		assert.Equal(t, orc.ID.String(), response.Monsters[1].ID)
	})

	t.Run("returns empty list when no monsters exist", func(t *testing.T) {
		db := memdb.New()
		handler := app.NewMonstersHandler(db)

		req := httptest.NewRequest(http.MethodGet, "/monsters", nil)
		req = req.WithContext(withTestUser(req.Context()))
		w := httptest.NewRecorder()

		handler.ListMyMonsters(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Monsters []nimble.Monster `json:"monsters"`
		}
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.Empty(t, response.Monsters)
	})
}

// Helper function to create a context with a test user
func TestMonstersHandler_GetMonster(t *testing.T) {
	t.Run("get existing monster", func(t *testing.T) {
		db := memdb.New()
		handler := app.NewMonstersHandler(db)
		ctx := withTestUser(context.Background())

		// Create a test monster first
		monster := nimble.Monster{
			Name:  "Goblin",
			HP:    12,
			Level: "1/3",
			Size:  nimble.SizeSmall,
		}
		body, err := json.Marshal(monster)
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodPost, "/monsters", bytes.NewReader(body))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.CreateMonster(w, req)
		require.Equal(t, http.StatusOK, w.Code)

		var created nimble.Monster
		err = json.NewDecoder(w.Body).Decode(&created)
		require.NoError(t, err)

		// Test getting the monster
		req = httptest.NewRequest(http.MethodGet, "/monsters/"+created.ID, nil)
		req = req.WithContext(ctx)
		w = httptest.NewRecorder()

		handler.GetMonster(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response nimble.Monster
		err = json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.Equal(t, created.ID, response.ID)
		assert.Equal(t, monster.Name, response.Name)
		assert.Equal(t, monster.HP, response.HP)
		assert.Equal(t, monster.Level, response.Level)
		assert.Equal(t, monster.Size, response.Size)
	})

	t.Run("monster not found", func(t *testing.T) {
		db := memdb.New()
		handler := app.NewMonstersHandler(db)
		ctx := withTestUser(context.Background())

		id := uuid.Must(uuid.NewV4())
		req := httptest.NewRequest(http.MethodGet, "/monsters/"+id.String(), nil)
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()

		handler.GetMonster(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("invalid monster ID", func(t *testing.T) {
		db := memdb.New()
		handler := app.NewMonstersHandler(db)
		ctx := withTestUser(context.Background())

		req := httptest.NewRequest(http.MethodGet, "/monsters/not-a-uuid", nil)
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()

		handler.GetMonster(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

// Helper function to create a context with a test user
func withTestUser(ctx context.Context) context.Context {
	testUser := nimble.User{
		ID:        uuid.Must(uuid.NewV4()),
		Username:  "testuser",
		DiscordID: "123456789",
	}
	return app.SetCurrentUser(ctx, testUser)
}
