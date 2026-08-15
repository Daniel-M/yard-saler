package domain_test

import (
	"testing"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
)

func TestNewUserFromPreRegister(t *testing.T) {
	input := dto.UserPreRegisterDTO{
		Email:     "test@example.com",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	u, err := domain.NewUserFromPreRegister(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if u.Email != input.Email {
		t.Errorf("expected Email %q, got %q", input.Email, u.Email)
	}
	if u.FirstName != input.FirstName {
		t.Errorf("expected FirstName %q, got %q", input.FirstName, u.FirstName)
	}
	if u.LastName != input.LastName {
		t.Errorf("expected LastName %q, got %q", input.LastName, u.LastName)
	}
	if u.Role != "user" {
		t.Errorf("expected default Role 'user', got %q", u.Role)
	}
	if u.VerificationCode == nil || len(*u.VerificationCode) != 6 {
		t.Errorf("expected 6-digit verification code, got %v", u.VerificationCode)
	}

	// Verify ToDTO
	dtoUser := u.ToDTO()
	if dtoUser.Email != input.Email {
		t.Errorf("dto: expected Email %q, got %q", input.Email, dtoUser.Email)
	}
	if dtoUser.VerificationCode != nil {
		t.Errorf("dto: expected VerificationCode to be nil, got %v", dtoUser.VerificationCode)
	}
}
