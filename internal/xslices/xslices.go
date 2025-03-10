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

func MapUniq[T any, U comparable](s []T, f func(T) U) []U {
	m := make(map[U]struct{})
	for _, e := range s {
		m[f(e)] = struct{}{}
	}
	v := make([]U, 0, len(m))
	for k := range m {
		v = append(v, k)
	}
	return v
}

func KeyBy[T any, U comparable](s []T, f func(T) U) map[U]T {
	m := make(map[U]T)
	for _, e := range s {
		m[f(e)] = e
	}
	return m
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
