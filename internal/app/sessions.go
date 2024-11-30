package app

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"nimble.monster/internal/sqldb"
)

const (
	sessionCookieName = "session_id"
	sessionDuration   = 24 * time.Hour
)

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session := GetSessionFromContext(r.Context())
		if session == nil {
			http.Redirect(w, r, "/login", http.StatusTemporaryRedirect)
			return
		}
		userID := uuid.UUID(session.UserID.Bytes)
		trace.SpanFromContext(r.Context()).SetAttributes(attribute.String("user.id", userID.String()))
		next.ServeHTTP(w, r)
	})
}

func (a *App) GetLogin(w http.ResponseWriter, r *http.Request) {
	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)

	cookie := &http.Cookie{
		Name:     "oauth-state",
		Value:    state,
		Path:     "/",
		MaxAge:   3600,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)

	url := a.o2.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (a *App) PostLogout(w http.ResponseWriter, r *http.Request) {
	if session := GetSessionFromContext(r.Context()); session != nil {
		a.db.DeleteSession(r.Context(), session.ID)
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

func (a *App) GetCallbackDiscord(w http.ResponseWriter, r *http.Request) {
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
	token, err := a.o2.Exchange(ctx, code)
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
		return
	}

	client := a.o2.Client(ctx, token)
	resp, err := client.Get("https://discord.com/api/users/@me")
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "Failed to get user info", http.StatusInternalServerError)
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

	user, err := a.db.UpsertUser(ctx, sqldb.UpsertUserParams{
		DiscordID: userInfo.ID,
		Username:  userInfo.Username,
		Avatar:    pgtype.Text{String: userInfo.Avatar, Valid: true},
	})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	expiry := time.Now().Add(sessionDuration)
	session, err := a.db.CreateSession(ctx, sqldb.CreateSessionParams{
		UserID:    user.ID,
		DiscordID: userInfo.ID,
		ExpiresAt: pgtype.Timestamptz{Time: expiry, Valid: true},
	})
	if err != nil {
		trace.SpanFromContext(ctx).RecordError(err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Set session cookie
	idv, err := session.ID.Value()
	sid := idv.(string)
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sid,
		Path:     "/",
		Expires:  session.ExpiresAt.Time,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, "/my/monsters", http.StatusTemporaryRedirect)
}

func generateSessionID() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func (a *App) SessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(sessionCookieName)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		u, err := uuid.FromString(cookie.Value)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		session, err := a.db.GetSession(r.Context(), pgtype.UUID{Bytes: u, Valid: true})
		if err != nil {
			http.SetCookie(w, &http.Cookie{
				Name:     sessionCookieName,
				Value:    "",
				Path:     "/",
				MaxAge:   -1,
				HttpOnly: true,
				Secure:   true,
				SameSite: http.SameSiteLaxMode,
			})
			next.ServeHTTP(w, r)
			return
		}

		ctx := ContextWithSession(r.Context(), &session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

type sessionContextKey struct{}

func (a *App) CurrentUser(ctx context.Context) *sqldb.User {
	if s := GetSessionFromContext(ctx); s != nil {
		u, err := a.db.GetUserByDiscordID(ctx, s.DiscordID)
		if err == nil {
			return &u
		}
	}
	return nil
}

func GetSessionFromContext(ctx context.Context) *sqldb.Session {
	if s, ok := ctx.Value(sessionContextKey{}).(*sqldb.Session); ok {
		return s
	}
	return nil
}

func ContextWithSession(ctx context.Context, s *sqldb.Session) context.Context {
	return context.WithValue(ctx, sessionContextKey{}, s)
}

func (a *App) StartSessionCleanup(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	for {
		select {
		case <-ctx.Done():
			ticker.Stop()
			return
		case <-ticker.C:
			if err := a.db.CleanExpiredSessions(ctx); err != nil {
				// Log error
			}
		}
	}
}
