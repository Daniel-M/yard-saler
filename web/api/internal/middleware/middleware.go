package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/Daniel-M/ys-api/internal/auth"
)

type contextKey string

const (
	userIDKey   contextKey = "userID"
	userRoleKey contextKey = "userRole"
)

// Middleware defines the function signature for HTTP middleware.
type Middleware func(http.Handler) http.Handler

// Chain chains multiple middlewares, executing them in the order they are passed.
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		h = middlewares[i](h)
	}
	return h
}

// Logger logs the method, path, and execution duration of incoming HTTP requests.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("Started %s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
		log.Printf("Completed %s %s in %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// Auth verifies the PASETO token in Authorization header.
func Auth(issuer auth.AccessTokenIssuer) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "unauthorized: missing auth header", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, "unauthorized: invalid auth header format", http.StatusUnauthorized)
				return
			}

			token := parts[1]
			userID, role, err := issuer.ParseAndValidate(token)
			if err != nil {
				http.Error(w, "unauthorized: invalid or expired token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, userID)
			ctx = context.WithValue(ctx, userRoleKey, role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID retrieves the authenticated user ID from context.
func GetUserID(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(userIDKey).(string)
	return val, ok
}

// GetUserRole retrieves the authenticated user role from context.
func GetUserRole(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(userRoleKey).(string)
	return val, ok
}
