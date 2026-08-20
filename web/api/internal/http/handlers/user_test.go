package handlers_test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Daniel-M/ys-api/internal/auth"
	"github.com/Daniel-M/ys-api/internal/database"
	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/http/handlers"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/user"
	_ "github.com/mattn/go-sqlite3"
)

func setupTestApp(t *testing.T) (*sql.DB, *handlers.UserHandler, auth.AccessTokenIssuer) {
	db, err := database.NewSqliteConnection(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	if err := database.RunMigrations(db); err != nil {
		db.Close()
		t.Fatalf("failed to run migrations: %v", err)
	}

	repo := user.NewSqliteUserRepository(db)
	svc := user.NewUserService(repo)

	// Symmetric key must be 32 bytes for PASETO v4
	tokenIssuer, err := auth.NewAccessTokenIssuer("supersecretkey123456789012345678")
	if err != nil {
		db.Close()
		t.Fatalf("failed to initialize token issuer: %v", err)
	}

	handler := handlers.NewUserHandler(svc, tokenIssuer)

	return db, handler, tokenIssuer
}

func TestUserHandler_PreRegisterAndVerify(t *testing.T) {
	db, handler, _ := setupTestApp(t)
	defer db.Close()

	// 1. PreRegister Endpoint
	preReqBody, _ := json.Marshal(dto.UserPreRegisterDTO{
		Email:    "handler@example.com",
		Password: "password123",
	})

	req := httptest.NewRequest(http.MethodPost, "/user/pre-register", bytes.NewReader(preReqBody))
	w := httptest.NewRecorder()
	handler.PreRegister(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	var registered dto.UserDTO
	if err := json.Unmarshal(w.Body.Bytes(), &registered); err != nil {
		t.Fatalf("failed to parse registered body: %v", err)
	}

	if registered.Email != "handler@example.com" {
		t.Errorf("expected Email %q, got %q", "handler@example.com", registered.Email)
	}

	// Fetch code from DB
	repo := user.NewSqliteUserRepository(db)
	fetched, err := repo.FindByEmail(context.Background(), "handler@example.com")
	if err != nil {
		t.Fatalf("failed to fetch user: %v", err)
	}

	// 2. Verify Endpoint
	verifyReqBody, _ := json.Marshal(dto.UserVerifyDTO{
		VerificationCode: *fetched.VerificationCode,
	})

	req = httptest.NewRequest(http.MethodPost, "/user/verify", bytes.NewReader(verifyReqBody))
	w = httptest.NewRecorder()
	handler.Verify(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	var verifyResp dto.UserVerifyResponseDTO
	if err := json.Unmarshal(w.Body.Bytes(), &verifyResp); err != nil {
		t.Fatalf("failed to parse verify response body: %v", err)
	}

	if verifyResp.Token == "" {
		t.Error("expected non-empty token in verification response")
	}

	if !verifyResp.User.IsVerified {
		t.Error("expected user to be verified")
	}

	if verifyResp.User.ProfileComplete {
		t.Error("expected profileComplete to be false since first_name and last_name are empty")
	}
}

func TestUserHandler_EditDetails(t *testing.T) {
	db, handler, tokenIssuer := setupTestApp(t)
	defer db.Close()

	// Setup user
	repo := user.NewSqliteUserRepository(db)
	ctx := context.Background()
	u := &domain.User{
		ID:        "usr_edit_1",
		Email:     "edit@example.com",
		FirstName: "John",
		LastName:  "Doe",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	_, err := repo.Create(ctx, u)
	if err != nil {
		t.Fatalf("failed to setup user: %v", err)
	}

	// Mint token
	token, err := tokenIssuer.MintAccessToken(u.ID, u.Role, 1*time.Hour)
	if err != nil {
		t.Fatalf("failed to mint token: %v", err)
	}

	// Create request
	editReqBody, _ := json.Marshal(dto.UserDTO{
		FirstName:   "JohnUpdated",
		LastName:    "DoeUpdated",
		MobilePhone: "9876543210",
		Socials:     "github: @johndoe",
	})

	req := httptest.NewRequest(http.MethodPut, "/user/edit-details", bytes.NewReader(editReqBody))
	req.Header.Set("Authorization", "Bearer "+token)

	// Wrap handler with Auth middleware
	authMiddleware := middleware.Auth(tokenIssuer)
	wrappedHandler := authMiddleware(http.HandlerFunc(handler.EditDetails))

	w := httptest.NewRecorder()
	wrappedHandler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	var updated dto.UserDTO
	if err := json.Unmarshal(w.Body.Bytes(), &updated); err != nil {
		t.Fatalf("failed to parse updated user: %v", err)
	}

	if updated.FirstName != "JohnUpdated" || updated.MobilePhone != "9876543210" {
		t.Errorf("edit failed to update fields correctly")
	}
}

func TestUserHandler_PasswordReset(t *testing.T) {
	db, handler, _ := setupTestApp(t)
	defer db.Close()

	repo := user.NewSqliteUserRepository(db)
	ctx := context.Background()
	resetCode := "RESET99"
	expires := time.Now().Add(1 * time.Hour)

	u := &domain.User{
		ID:                     "usr_reset_1",
		Email:                  "reset@example.com",
		FirstName:              "Jane",
		LastName:               "Doe",
		Role:                   "user",
		PasswordResetCode:      &resetCode,
		PasswordResetExpiresAt: &expires,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}
	_, err := repo.Create(ctx, u)
	if err != nil {
		t.Fatalf("failed to setup user: %v", err)
	}

	// Request Password Reset
	resetReqBody, _ := json.Marshal(dto.UserPasswordResetDTO{
		PasswordChangeCode: resetCode,
		NewPassword:        "newSuperSecure123",
	})

	req := httptest.NewRequest(http.MethodPost, "/user/password-reset", bytes.NewReader(resetReqBody))
	w := httptest.NewRecorder()
	handler.PasswordReset(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}
}

func TestUserHandler_LoginAndOAuthCollision(t *testing.T) {
	db, handler, _ := setupTestApp(t)
	defer db.Close()

	// Helper to generate mock Google JWT
	makeGoogleToken := func(email, sub string) string {
		claims := `{"email":"` + email + `","sub":"` + sub + `","email_verified":true,"given_name":"Google","family_name":"User"}`
		encodedClaims := base64.RawURLEncoding.EncodeToString([]byte(claims))
		return "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ." + encodedClaims + ".signature"
	}

	// 1. Google OAuth Signup (New user)
	oauthReqBody, _ := json.Marshal(dto.OAuthGoogleDTO{
		Credential: makeGoogleToken("handler_oauth@example.com", "sub_111"),
	})
	req := httptest.NewRequest(http.MethodPost, "/user/oauth/google", bytes.NewReader(oauthReqBody))
	w := httptest.NewRecorder()
	handler.OAuthGoogle(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for OAuth register, got %d. Body: %s", w.Code, w.Body.String())
	}

	var oauthResp dto.UserVerifyResponseDTO
	if err := json.Unmarshal(w.Body.Bytes(), &oauthResp); err != nil {
		t.Fatalf("failed to parse oauth response: %v", err)
	}
	if oauthResp.User.Email != "handler_oauth@example.com" {
		t.Errorf("expected email handler_oauth@example.com, got %s", oauthResp.User.Email)
	}

	// 2. Try to Pre-Register with same email (Email/Password Sign-Up with Existing Google OAuth Account)
	preReqBody, _ := json.Marshal(dto.UserPreRegisterDTO{
		Email:    "handler_oauth@example.com",
		Password: "password123",
	})
	req = httptest.NewRequest(http.MethodPost, "/user/pre-register", bytes.NewReader(preReqBody))
	w = httptest.NewRecorder()
	handler.PreRegister(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("expected status 409 Conflict, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "oauth_provider_exists") {
		t.Errorf("expected error message to contain 'oauth_provider_exists', got %q", w.Body.String())
	}

	// 3. Try to Login with Email/Password (Email/Password Login with OAuth-Only Account)
	loginReqBody, _ := json.Marshal(dto.UserLoginDTO{
		Email:    "handler_oauth@example.com",
		Password: "password123",
	})
	req = httptest.NewRequest(http.MethodPost, "/user/login", bytes.NewReader(loginReqBody))
	w = httptest.NewRecorder()
	handler.Login(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected status 403 Forbidden, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "oauth_provider_required") {
		t.Errorf("expected error message to contain 'oauth_provider_required', got %q", w.Body.String())
	}

	// 4. Pre-Register a local user
	localPreReqBody, _ := json.Marshal(dto.UserPreRegisterDTO{
		Email:    "handler_local@example.com",
		Password: "password123",
	})
	req = httptest.NewRequest(http.MethodPost, "/user/pre-register", bytes.NewReader(localPreReqBody))
	w = httptest.NewRecorder()
	handler.PreRegister(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for local pre-register, got %d", w.Code)
	}

	// 5. Successful login for local user
	localLoginReqBody, _ := json.Marshal(dto.UserLoginDTO{
		Email:    "handler_local@example.com",
		Password: "password123",
	})
	req = httptest.NewRequest(http.MethodPost, "/user/login", bytes.NewReader(localLoginReqBody))
	w = httptest.NewRecorder()
	handler.Login(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for local login, got %d. Body: %s", w.Code, w.Body.String())
	}

	var loginResp dto.UserVerifyResponseDTO
	if err := json.Unmarshal(w.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("failed to parse login response: %v", err)
	}
	if loginResp.Token == "" {
		t.Error("expected non-empty token on successful login")
	}
}

func TestUserHandler_PreRegisterAlreadyExists(t *testing.T) {
	db, handler, _ := setupTestApp(t)
	defer db.Close()

	// 1. First Pre-Registration
	preReqBody, _ := json.Marshal(dto.UserPreRegisterDTO{
		Email:    "existing_handler@example.com",
		Password: "password123",
	})
	req := httptest.NewRequest(http.MethodPost, "/user/pre-register", bytes.NewReader(preReqBody))
	w := httptest.NewRecorder()
	handler.PreRegister(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for first pre-registration, got %d", w.Code)
	}

	// 2. Second Pre-Registration with the same email
	req = httptest.NewRequest(http.MethodPost, "/user/pre-register", bytes.NewReader(preReqBody))
	w = httptest.NewRecorder()
	handler.PreRegister(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("expected status 409 Conflict, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "user already exists") {
		t.Errorf("expected error message to contain 'user already exists', got %q", w.Body.String())
	}
}

func TestUserHandler_GetProfile(t *testing.T) {
	db, handler, tokenIssuer := setupTestApp(t)
	defer db.Close()

	// 1. Setup a verified user with name
	repo := user.NewSqliteUserRepository(db)
	ctx := context.Background()
	u := &domain.User{
		ID:        "usr_profile_1",
		Email:     "profile@example.com",
		FirstName: "Jane",
		LastName:  "Doe",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	_, err := repo.Create(ctx, u)
	if err != nil {
		t.Fatalf("failed to setup user: %v", err)
	}

	// Mint token for user
	token, err := tokenIssuer.MintAccessToken(u.ID, u.Role, 1*time.Hour)
	if err != nil {
		t.Fatalf("failed to mint token: %v", err)
	}

	// Create Auth middleware wrapped handler
	authMiddleware := middleware.Auth(tokenIssuer)
	wrappedHandler := authMiddleware(http.HandlerFunc(handler.GetProfile))

	t.Run("Success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/user/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		wrappedHandler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
		}

		var profile dto.UserProfileDTO
		if err := json.Unmarshal(w.Body.Bytes(), &profile); err != nil {
			t.Fatalf("failed to parse profile response: %v", err)
		}

		if profile.ID != u.ID {
			t.Errorf("expected ID %q, got %q", u.ID, profile.ID)
		}
		if profile.DisplayName != "Jane Doe" {
			t.Errorf("expected DisplayName %q, got %q", "Jane Doe", profile.DisplayName)
		}
		if profile.Email != u.Email {
			t.Errorf("expected Email %q, got %q", u.Email, profile.Email)
		}
		if profile.Initials != "JD" {
			t.Errorf("expected Initials %q, got %q", "JD", profile.Initials)
		}
		if profile.AvatarURL != nil {
			t.Errorf("expected nil AvatarURL, got %v", profile.AvatarURL)
		}
		if profile.FirstName != u.FirstName {
			t.Errorf("expected FirstName %q, got %q", u.FirstName, profile.FirstName)
		}
		if profile.LastName != u.LastName {
			t.Errorf("expected LastName %q, got %q", u.LastName, profile.LastName)
		}
		if profile.IsVerified != false {
			t.Errorf("expected IsVerified false, got %t", profile.IsVerified)
		}
		if profile.CreatedAt.IsZero() {
			t.Errorf("expected non-zero CreatedAt")
		}
		if profile.UpdatedAt.IsZero() {
			t.Errorf("expected non-zero UpdatedAt")
		}
		if profile.VerifiedAt != nil {
			t.Errorf("expected nil VerifiedAt, got %v", profile.VerifiedAt)
		}
		if profile.MobilePhone != "" {
			t.Errorf("expected empty MobilePhone, got %q", profile.MobilePhone)
		}
		if profile.Socials != "" {
			t.Errorf("expected empty Socials, got %q", profile.Socials)
		}
	})

	t.Run("Unauthorized - No Token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/user/me", nil)
		w := httptest.NewRecorder()

		wrappedHandler.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401 Unauthorized, got %d", w.Code)
		}
	})
}

