package web

import (
	"net/url"

	"nimble.monster/internal/sqldb"
)

type GlobalProps struct {
	CurrentURL  *url.URL
	CurrentUser *sqldb.User
	Title       string
}

func (vd *GlobalProps) IsCurrentURL(s string) bool {
	return vd.CurrentURL.Path == s
}
