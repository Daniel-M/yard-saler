package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/Daniel-M/ys-api/internal/config"
	"github.com/Daniel-M/ys-api/internal/middleware"
)

func TestCORS(t *testing.T) {
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}
	corsMiddleware := middleware.CORS(allowedOrigins)

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	handlerToTest := corsMiddleware(nextHandler)

	tests := []struct {
		name           string
		method         string
		origin         string
		expectedStatus int
		expectedOrigin string
		expectedHeader bool
	}{
		{
			name:           "Allowed Origin",
			method:         "GET",
			origin:         "http://localhost:5173",
			expectedStatus: http.StatusOK,
			expectedOrigin: "http://localhost:5173",
			expectedHeader: true,
		},
		{
			name:           "Disallowed Origin",
			method:         "GET",
			origin:         "http://evil.com",
			expectedStatus: http.StatusOK,
			expectedOrigin: "",
			expectedHeader: false,
		},
		{
			name:           "Preflight Request Allowed Origin",
			method:         "OPTIONS",
			origin:         "http://localhost:3000",
			expectedStatus: http.StatusNoContent,
			expectedOrigin: "http://localhost:3000",
			expectedHeader: true,
		},
		{
			name:           "Preflight Request Disallowed Origin",
			method:         "OPTIONS",
			origin:         "http://evil.com",
			expectedStatus: http.StatusNoContent,
			expectedOrigin: "",
			expectedHeader: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(tt.method, "/", nil)
			if err != nil {
				t.Fatal(err)
			}
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			rr := httptest.NewRecorder()
			handlerToTest.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rr.Code)
			}

			originHeader := rr.Header().Get("Access-Control-Allow-Origin")
			if tt.expectedHeader {
				if originHeader != tt.expectedOrigin {
					t.Errorf("expected Access-Control-Allow-Origin to be %q, got %q", tt.expectedOrigin, originHeader)
				}
				if rr.Header().Get("Access-Control-Allow-Methods") != "GET, POST, PUT, DELETE, OPTIONS" {
					t.Errorf("invalid Access-Control-Allow-Methods header")
				}
				if rr.Header().Get("Access-Control-Allow-Headers") != "Content-Type, Authorization" {
					t.Errorf("invalid Access-Control-Allow-Headers header")
				}
			} else {
				if originHeader != "" {
					t.Errorf("expected empty Access-Control-Allow-Origin, got %q", originHeader)
				}
			}
		})
	}
}

func TestConfigCORS(t *testing.T) {
	// Test environment variable parsing
	os.Setenv("APP_CORS_ALLOWED_ORIGINS", "http://localhost:8080 , http://localhost:9090")
	defer os.Unsetenv("APP_CORS_ALLOWED_ORIGINS")

	// Set required environment variables for config loader validation
	os.Setenv("APP_SECURITY_PEPPER", "some-pepper")
	os.Setenv("APP_AUTH_PASETO_KEY", "some-paseto-key")
	defer os.Unsetenv("APP_SECURITY_PEPPER")
	defer os.Unsetenv("APP_AUTH_PASETO_KEY")

	cfg, err := config.LoadConfig("../../")
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	expected := []string{"http://localhost:8080", "http://localhost:9090"}
	if len(cfg.CORS.AllowedOrigins) != len(expected) {
		t.Fatalf("expected %d origins, got %d", len(expected), len(cfg.CORS.AllowedOrigins))
	}

	for i, o := range cfg.CORS.AllowedOrigins {
		if o != expected[i] {
			t.Errorf("expected origin %q at index %d, got %q", expected[i], i, o)
		}
	}
}
