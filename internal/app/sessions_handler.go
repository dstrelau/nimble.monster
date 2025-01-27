package app

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/oauth2"

	"nimble.monster/internal/sqldb"
)

const (
	sessionCookieName = "session_id"
	sessionDuration   = 72 * time.Hour
)

var discordEnpdoint = oauth2.Endpoint{
	AuthURL:       "https://discord.com/api/oauth2/authorize",
	DeviceAuthURL: "https://discord.com/api/oauth2/device/code",
	TokenURL:      "https://discord.com/api/oauth2/token",
}

type SessionsHandler struct {
	db *sqldb.Queries
	o2 *oauth2.Config
}

func NewSessionsHandler(db *sqldb.Queries) *SessionsHandler {
	return &SessionsHandler{
		db: db,
		o2: &oauth2.Config{
			ClientID:     os.Getenv("DISCORD_CLIENT_ID"),
			ClientSecret: os.Getenv("DISCORD_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("DISCORD_REDIRECT_URI"),
			Scopes:       []string{"identify"},
			Endpoint:     discordEnpdoint,
		},
	}

}

func (h *SessionsHandler) GetLogin(w http.ResponseWriter, r *http.Request) {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		Error(r.Context(), w, err)
		return
	}
	state := base64.URLEncoding.EncodeToString(b)

	cookie := &http.Cookie{
		Name:     "oauth-state",
		Value:    state,
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)

	url := h.o2.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *SessionsHandler) PostLogout(w http.ResponseWriter, r *http.Request) {
	// if any of this fails, nbd, session will be cleaned up when it expires
	cookie, err := r.Cookie(sessionCookieName)
	if err == nil {
		sid, err := uuid.FromString(cookie.Value)
		if err == nil {
			_ = h.db.DeleteSession(r.Context(), sid)
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (h *SessionsHandler) GetCallbackDiscord(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	cookie, err := r.Cookie("oauth-state")
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "State cookie not found", http.StatusBadRequest)
		return
	}

	if r.URL.Query().Get("state") != cookie.Value {
		http.Error(w, "State mismatch", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	token, err := h.o2.Exchange(ctx, code)
	if err != nil {
		Error(ctx, w, err)
		return
	}

	client := h.o2.Client(ctx, token)
	resp, err := client.Get("https://discord.com/api/users/@me")
	if err != nil {
		Error(ctx, w, err)
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID            string `json:"id"`
		Username      string `json:"username"`
		Email         string `json:"email"`
		Discriminator string `json:"discriminator"`
		Avatar        string `json:"avatar"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		http.Error(w, "Failed to decode user info", http.StatusInternalServerError)
		return
	}

	user, err := h.db.UpsertUser(ctx, sqldb.UpsertUserParams{
		DiscordID:    userInfo.ID,
		Username:     userInfo.Username,
		Avatar:       pgtype.Text{String: userInfo.Avatar, Valid: true},
		RefreshToken: pgtype.Text{String: token.RefreshToken, Valid: true},
	})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	expiry := time.Now().Add(sessionDuration)
	session, err := h.db.CreateSession(ctx, sqldb.CreateSessionParams{
		UserID:    user.ID,
		DiscordID: userInfo.ID,
		ExpiresAt: pgtype.Timestamptz{Time: expiry, Valid: true},
	})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	idv, err := session.ID.Value()
	if err != nil {
		Error(ctx, w, err)
		return
	}
	sid := idv.(string)
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sid,
		Path:     "/",
		Expires:  time.Now().AddDate(0, 0, 7),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth-state",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, "/my/monsters", http.StatusTemporaryRedirect)
}

func (h *SessionsHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	u := CurrentUser(r.Context())
	err := json.NewEncoder(w).Encode(u)
	if err != nil {
		trace.SpanFromContext(r.Context()).RecordError(err)
	}
}
