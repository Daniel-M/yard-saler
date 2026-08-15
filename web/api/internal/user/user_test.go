package user_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/Daniel-M/ys-api/internal/database"
	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/user"
	_ "github.com/mattn/go-sqlite3"
)

func setupTestDB(t *testing.T) *sql.DB {
	db, err := database.NewSqliteConnection(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	if err := database.RunMigrations(db); err != nil {
		db.Close()
		t.Fatalf("failed to run migrations: %v", err)
	}

	return db
}

func TestUserService_PreRegisterAndVerify(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := user.NewSqliteUserRepository(db)
	svc := user.NewUserService(repo)

	ctx := context.Background()

	// 1. Pre-register
	preDTO := dto.UserPreRegisterDTO{
		Email:     "user@example.com",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	created, err := svc.PreRegisterUser(ctx, preDTO)
	if err != nil {
		t.Fatalf("failed to pre-register user: %v", err)
	}

	if created.Email != preDTO.Email {
		t.Errorf("expected Email %q, got %q", preDTO.Email, created.Email)
	}

	// Fetch from DB to verify it persisted and got a verification code
	fetched, err := repo.FindByEmail(ctx, preDTO.Email)
	if err != nil {
		t.Fatalf("failed to fetch user: %v", err)
	}
	if fetched == nil {
		t.Fatal("expected user to be persisted, but got nil")
	}
	if fetched.VerificationCode == nil {
		t.Fatal("expected verification code to be set")
	}

	// Try verifying with wrong code
	verifyDTO := dto.UserVerifyDTO{
		VerificationCode: "000000",
	}
	err = svc.VerifyUser(ctx, verifyDTO)
	if err == nil {
		t.Error("expected error verifying with wrong code, got nil")
	}

	// Verify with correct code
	verifyDTO.VerificationCode = *fetched.VerificationCode
	err = svc.VerifyUser(ctx, verifyDTO)
	if err != nil {
		t.Fatalf("failed to verify user: %v", err)
	}

	// Fetch again to verify verified state
	verifiedUser, err := repo.FindByEmail(ctx, preDTO.Email)
	if err != nil {
		t.Fatalf("failed to fetch user: %v", err)
	}
	if verifiedUser.VerifiedAt == nil {
		t.Error("expected VerifiedAt to be set")
	}
	if verifiedUser.VerificationCode != nil {
		t.Error("expected VerificationCode to be cleared")
	}
}

func TestUserService_EditUserDetails(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := user.NewSqliteUserRepository(db)
	svc := user.NewUserService(repo)

	ctx := context.Background()

	// Setup user
	u := &domain.User{
		ID:        "usr_123",
		Email:     "edit@example.com",
		FirstName: "OldFirst",
		LastName:  "OldLast",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	_, err := repo.Create(ctx, u)
	if err != nil {
		t.Fatalf("failed to setup user: %v", err)
	}

	// Edit details
	editDTO := dto.UserDTO{
		FirstName:   "NewFirst",
		LastName:    "NewLast",
		MobilePhone: "1234567890",
		Socials:     "twitter: @newfirst",
	}

	updated, err := svc.EditUserDetails(ctx, u.ID, editDTO)
	if err != nil {
		t.Fatalf("failed to edit details: %v", err)
	}

	if updated.FirstName != editDTO.FirstName || updated.LastName != editDTO.LastName {
		t.Errorf("edit failed: names not updated correctly")
	}
	if updated.MobilePhone != editDTO.MobilePhone || updated.Socials != editDTO.Socials {
		t.Errorf("edit failed: phone/socials not updated correctly")
	}
}

func TestUserService_PasswordReset(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := user.NewSqliteUserRepository(db)
	svc := user.NewUserService(repo)

	ctx := context.Background()

	resetCode := "RESET123"
	expires := time.Now().Add(1 * time.Hour)

	// Setup user with reset code
	u := &domain.User{
		ID:                     "usr_456",
		Email:                  "reset@example.com",
		FirstName:              "John",
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

	// Execute password reset
	resetDTO := dto.UserPasswordResetDTO{
		PasswordChangeCode: resetCode,
		NewPassword:        "newsecretpassword",
	}

	err = svc.PasswordReset(ctx, resetDTO)
	if err != nil {
		t.Fatalf("failed to reset password: %v", err)
	}

	// Fetch to verify password has changed and reset details are cleared
	fetched, err := repo.FindByID(ctx, u.ID)
	if err != nil {
		t.Fatalf("failed to fetch user: %v", err)
	}

	if fetched.PasswordResetCode != nil {
		t.Error("expected reset code to be cleared")
	}
	if fetched.PasswordResetExpiresAt != nil {
		t.Error("expected reset code expiration to be cleared")
	}
}
