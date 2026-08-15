package logger

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"testing"
)

func TestParseLevel(t *testing.T) {
	tests := []struct {
		input    string
		expected slog.Level
	}{
		{"debug", slog.LevelDebug},
		{"DEBUG", slog.LevelDebug},
		{"info", slog.LevelInfo},
		{"INFO", slog.LevelInfo},
		{"warn", slog.LevelWarn},
		{"WARN", slog.LevelWarn},
		{"error", slog.LevelError},
		{"ERROR", slog.LevelError},
		{"", slog.LevelDebug}, // Fallback
		{"invalid", slog.LevelDebug}, // Fallback
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			actual := ParseLevel(tc.input)
			if actual != tc.expected {
				t.Errorf("expected %v for input %q, got %v", tc.expected, tc.input, actual)
			}
		})
	}
}

func TestTraceIDContext(t *testing.T) {
	ctx := context.Background()

	// Initially empty
	if id := GetTraceID(ctx); id != "" {
		t.Errorf("expected empty trace ID, got %q", id)
	}

	// Add trace ID
	expectedID := "test-trace-id-123"
	ctx = WithTraceID(ctx, expectedID)

	if id := GetTraceID(ctx); id != expectedID {
		t.Errorf("expected trace ID %q, got %q", expectedID, id)
	}
}

func TestGenerateTraceID(t *testing.T) {
	id1 := GenerateTraceID()
	id2 := GenerateTraceID()

	if len(id1) != 32 {
		t.Errorf("expected trace ID length to be 32, got %d", len(id1))
	}
	if id1 == id2 {
		t.Error("expected trace IDs to be unique, but got identical values")
	}
}

func TestTraceHandler(t *testing.T) {
	var buf bytes.Buffer
	baseHandler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelDebug})
	handler := NewTraceHandler(baseHandler)
	logger := slog.New(handler)

	ctx := context.Background()
	traceID := "logger-test-trace-id"
	ctx = WithTraceID(ctx, traceID)

	logger.InfoContext(ctx, "test message")

	var logEntry struct {
		Msg     string `json:"msg"`
		TraceID string `json:"trace_id"`
	}

	if err := json.Unmarshal(buf.Bytes(), &logEntry); err != nil {
		t.Fatalf("failed to unmarshal log entry: %v", err)
	}

	if logEntry.Msg != "test message" {
		t.Errorf("expected message 'test message', got %q", logEntry.Msg)
	}
	if logEntry.TraceID != traceID {
		t.Errorf("expected trace_id %q, got %q", traceID, logEntry.TraceID)
	}
}
