package web

import (
	"net/url"

	"nimble.monster/internal/sqldb"
)

type ViewData struct {
	CurrentURL  *url.URL
	CurrentUser *sqldb.User
	Title       string
}
