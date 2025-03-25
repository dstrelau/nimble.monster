package xslices

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMap(t *testing.T) {
	tests := []struct {
		name      string
		input     []int
		transform func(int) string
		want      []string
	}{
		{
			name:  "int to string",
			input: []int{1, 2, 3},
			transform: func(i int) string {
				return string(rune(i + 64))
			},
			want: []string{"A", "B", "C"},
		},
		{
			name:  "empty slice",
			input: []int{},
			transform: func(i int) string {
				return string(rune(i + 64))
			},
			want: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Map(tt.input, tt.transform)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestDifference(t *testing.T) {
	tests := []struct {
		name string
		s1   []int
		s2   []int
		want []int
	}{
		{
			name: "normal case",
			s1:   []int{1, 2, 3, 4, 5},
			s2:   []int{2, 4, 6},
			want: []int{1, 3, 5},
		},
		{
			name: "empty first slice",
			s1:   []int{},
			s2:   []int{1, 2, 3},
			want: []int{},
		},
		{
			name: "empty second slice",
			s1:   []int{1, 2, 3},
			s2:   []int{},
			want: []int{1, 2, 3},
		},
		{
			name: "no difference",
			s1:   []int{1, 2, 3},
			s2:   []int{1, 2, 3},
			want: []int{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Difference(tt.s1, tt.s2)
			assert.Equal(t, tt.want, got)
		})
	}
}
