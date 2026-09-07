package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/Daniel-M/ys-api/internal/auth"
	"github.com/Daniel-M/ys-api/internal/logger"
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

type statusResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (sw *statusResponseWriter) WriteHeader(code int) {
	sw.statusCode = code
	sw.ResponseWriter.WriteHeader(code)
}

func (sw *statusResponseWriter) Write(b []byte) (int, error) {
	return sw.ResponseWriter.Write(b)
}

// Logger logs the method, path, client IP, Origin, Referer, and execution duration of incoming HTTP requests using slog.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		traceID := logger.GenerateTraceID()
		ctx := logger.WithTraceID(r.Context(), traceID)

		w.Header().Set("X-Trace-ID", traceID)

		sw := &statusResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		ip := getClientIP(r)
		origin := r.Header.Get("Origin")
		referer := r.Header.Get("Referer")

		slog.DebugContext(ctx, "Request started",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.String("ip", ip),
			slog.String("origin", origin),
			slog.String("referer", referer),
		)

		next.ServeHTTP(sw, r.WithContext(ctx))

		latency := time.Since(start)

		slog.InfoContext(ctx, "Request completed",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.String("ip", ip),
			slog.String("origin", origin),
			slog.String("referer", referer),
			slog.Int("status_code", sw.statusCode),
			slog.Float64("latency_ms", float64(latency.Nanoseconds())/1e6),
		)
	})
}

func getClientIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		parts := strings.Split(ip, ",")
		return strings.TrimSpace(parts[0])
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	return r.RemoteAddr
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
