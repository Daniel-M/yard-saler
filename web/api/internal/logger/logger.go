package logger

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log/slog"
	"os"
	"strings"
)

type ctxKey string

const (
	TraceIDKey ctxKey = "trace_id"
)

// WithTraceID adds the trace ID to the context.
func WithTraceID(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, TraceIDKey, traceID)
}

// GetTraceID retrieves the trace ID from context.
func GetTraceID(ctx context.Context) string {
	if v, ok := ctx.Value(TraceIDKey).(string); ok {
		return v
	}
	return ""
}

// TraceHandler is a custom slog.Handler that injects trace_id from context.
type TraceHandler struct {
	slog.Handler
}

// Handle adds the trace_id attribute if present in the context.
func (h *TraceHandler) Handle(ctx context.Context, r slog.Record) error {
	if traceID := GetTraceID(ctx); traceID != "" {
		r.AddAttrs(slog.String("trace_id", traceID))
	}
	return h.Handler.Handle(ctx, r)
}

// NewTraceHandler wraps an existing slog.Handler.
func NewTraceHandler(h slog.Handler) *TraceHandler {
	return &TraceHandler{Handler: h}
}

// GenerateTraceID generates a 16-byte hex trace ID.
func GenerateTraceID() string {
	b := make([]byte, 16)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "unknown-trace-id"
	}
	return hex.EncodeToString(b)
}

// ParseLevel converts a string representation of a log level into slog.Level.
// Defaults to slog.LevelDebug if level is empty or invalid.
func ParseLevel(lvl string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(lvl)) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelDebug
	}
}

// Setup configures the default slog JSON logger with a TraceHandler and level.
func Setup(lvl string) {
	level := ParseLevel(lvl)
	baseHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: level,
	})
	logger := slog.New(NewTraceHandler(baseHandler))
	slog.SetDefault(logger)
}
