package xslices

import "slices"

func Map[T, U any](s []T, f func(T) U) []U {
	m := make([]U, len(s))
	for i, v := range s {
		m[i] = f(v)
	}
	return m
}

func Difference[T comparable](s1, s2 []T) []T {
	var m []T
	for _, v := range s1 {
		if !slices.Contains(s2, v) {
			m = append(m, v)
		}
	}
	return m
}
