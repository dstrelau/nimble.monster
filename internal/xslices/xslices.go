package xslices

import (
	"slices"
)

func Map[T, U any](s []T, f func(T) U) []U {
	m := make([]U, len(s))
	for i, v := range s {
		m[i] = f(v)
	}
	return m
}

func Map2[T, U, V any](s []T, f func(T) (U, V)) ([]U, []V) {
	u := make([]U, len(s))
	v := make([]V, len(s))
	for i, e := range s {
		u[i], v[i] = f(e)
	}
	return u, v
}

func Difference[T comparable](s1, s2 []T) []T {
	m := make([]T, 0)
	for _, v := range s1 {
		if !slices.Contains(s2, v) {
			m = append(m, v)
		}
	}
	return m
}
