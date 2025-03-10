package nimble

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFamilyUnmarshalJSON(t *testing.T) {
	var family Family
	err := json.Unmarshal(
		[]byte(`{"id": "f86173cf-3af6-4f9e-8d58-eac1fad60d3d", "name": "Test Family", "description": "Test Description", "visibility": "public"}`),
		&family,
	)
	assert.NoError(t, err)
	assert.Equal(t, "Test Family", family.Name)
	assert.Equal(t, "Test Description", family.Description)
	assert.Equal(t, FamilyVisibilityPublic, family.Visibility)
	assert.Equal(t, "f86173cf-3af6-4f9e-8d58-eac1fad60d3d", family.ID.String())

	family = Family{}
	err = json.Unmarshal([]byte(`{"id": ""}`), &family)
	assert.NoError(t, err)
	assert.True(t, family.ID.IsNil())
}
