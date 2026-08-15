package domain

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/oklog/ulid/v2"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user entity in the system.
type User struct {
	ID                     string     `json:"id"`
	Email                  string     `json:"email"`
	PasswordHash           string     `json:"-"`
	FirstName              string     `json:"first_name"`
	LastName               string     `json:"last_name"`
	Role                   string     `json:"role"`
	MobilePhone            string     `json:"mobile_phone"`
	Socials                string     `json:"socials"`
	VerificationCode       *string    `json:"-"`
	VerifiedAt             *time.Time `json:"verified_at,omitempty"`
	PasswordResetCode      *string    `json:"-"`
	PasswordResetExpiresAt *time.Time `json:"-"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

// NewUserFromPreRegister creates a new User entity from a UserPreRegisterDTO.
func NewUserFromPreRegister(dto dto.UserPreRegisterDTO) (*User, error) {
	// Generate ULID for ID
	id := ulid.Make().String()

	// Hash password using bcrypt default cost
	hash, err := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Generate secure random 6-digit verification code using crypto/rand
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return nil, fmt.Errorf("failed to generate verification code: %w", err)
	}
	code := fmt.Sprintf("%06d", n.Int64())

	now := time.Now()

	return &User{
		ID:               id,
		Email:            dto.Email,
		PasswordHash:     string(hash),
		FirstName:        dto.FirstName,
		LastName:         dto.LastName,
		Role:             "user",
		MobilePhone:      "",
		Socials:          "",
		VerificationCode: &code,
		CreatedAt:        now,
		UpdatedAt:        now,
	}, nil
}

// ToDTO converts User to dto.UserDTO, ensuring VerificationCode is returned as nil.
func (u *User) ToDTO() dto.UserDTO {
	return dto.UserDTO{
		ID:               u.ID,
		Email:            u.Email,
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		Role:             u.Role,
		MobilePhone:      u.MobilePhone,
		Socials:          u.Socials,
		VerificationCode: nil,
		VerifiedAt:       u.VerifiedAt,
		CreatedAt:        u.CreatedAt,
		UpdatedAt:        u.UpdatedAt,
	}
}
