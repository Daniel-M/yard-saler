package user

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"time"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound        = errors.New("user not found")
	ErrUserAlreadyVerified = errors.New("user already verified")
	ErrInvalidCode         = errors.New("invalid verification code")
	ErrCodeExpired         = errors.New("verification code expired")
)

// UserService coordinates operations on User domain objects.
type UserService struct {
	repo UserRepository
}

// NewUserService creates a new UserService instance.
func NewUserService(repo UserRepository) *UserService {
	return &UserService{repo: repo}
}

// GetUser retrieves a user by ID.
func (s *UserService) GetUser(ctx context.Context, id string) (*domain.User, error) {
	if id == "" {
		return nil, errors.New("user ID cannot be empty")
	}
	return s.repo.FindByID(ctx, id)
}

// CreateUser handles registration validation and persists a new user.
func (s *UserService) CreateUser(ctx context.Context, u *domain.User) (*domain.User, error) {
	if u.Email == "" {
		return nil, errors.New("user email cannot be empty")
	}
	
	existing, err := s.repo.FindByEmail(ctx, u.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("user with email %s already exists", u.Email)
	}

	if u.ID == "" {
		u.ID = fmt.Sprintf("usr_%d", time.Now().UnixNano())
	}

	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()

	return s.repo.Create(ctx, u)
}

// PreRegisterUser handles user pre-registration.
func (s *UserService) PreRegisterUser(ctx context.Context, d dto.UserPreRegisterDTO) (*domain.User, error) {
	if d.Email == "" {
		return nil, errors.New("user email cannot be empty")
	}

	existing, err := s.repo.FindByEmail(ctx, d.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("user with email %s already exists", d.Email)
	}

	u, err := domain.NewUserFromPreRegister(d)
	if err != nil {
		return nil, err
	}

	return s.repo.Create(ctx, u)
}

// VerifyUser verifies a pre-registered user using their verification code.
func (s *UserService) VerifyUser(ctx context.Context, d dto.UserVerifyDTO) error {
	u, err := s.repo.FindByVerificationCode(ctx, d.VerificationCode)
	if err != nil {
		return fmt.Errorf("failed to fetch user for verification: %w", err)
	}
	if u == nil {
		return ErrUserNotFound
	}

	if u.VerifiedAt != nil {
		return ErrUserAlreadyVerified
	}

	if u.VerificationCode == nil {
		return ErrInvalidCode
	}

	if subtle.ConstantTimeCompare([]byte(*u.VerificationCode), []byte(d.VerificationCode)) != 1 {
		return ErrInvalidCode
	}

	now := time.Now()
	u.VerifiedAt = &now
	u.VerificationCode = nil
	u.UpdatedAt = now

	_, err = s.repo.Update(ctx, u)
	return err
}

// EditUserDetails updates editable profile attributes of an authenticated user.
func (s *UserService) EditUserDetails(ctx context.Context, userID string, d dto.UserDTO) (*domain.User, error) {
	u, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}

	// Update only editable fields
	u.FirstName = d.FirstName
	u.LastName = d.LastName
	u.MobilePhone = d.MobilePhone
	u.Socials = d.Socials
	u.UpdatedAt = time.Now()

	return s.repo.Update(ctx, u)
}

// PasswordReset updates a user's password using a valid reset code.
func (s *UserService) PasswordReset(ctx context.Context, d dto.UserPasswordResetDTO) error {
	u, err := s.repo.FindByPasswordResetCode(ctx, d.PasswordChangeCode)
	if err != nil {
		return fmt.Errorf("failed to fetch user by reset code: %w", err)
	}
	if u == nil {
		return ErrUserNotFound
	}

	if u.PasswordResetExpiresAt == nil || u.PasswordResetExpiresAt.Before(time.Now()) {
		return ErrCodeExpired
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(d.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	u.PasswordHash = string(hash)
	u.PasswordResetCode = nil
	u.PasswordResetExpiresAt = nil
	u.UpdatedAt = time.Now()

	_, err = s.repo.Update(ctx, u)
	return err
}

// UpdateUser performs validation and updates user attributes.
func (s *UserService) UpdateUser(ctx context.Context, u *domain.User) (*domain.User, error) {
	if u.ID == "" {
		return nil, errors.New("user ID cannot be empty for update")
	}

	existing, err := s.repo.FindByID(ctx, u.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user for update: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("user with ID %s not found", u.ID)
	}

	u.UpdatedAt = time.Now()
	return s.repo.Update(ctx, u)
}

// DeleteUser removes a user by ID.
func (s *UserService) DeleteUser(ctx context.Context, id string) error {
	if id == "" {
		return errors.New("user ID cannot be empty for deletion")
	}
	return s.repo.Delete(ctx, id)
}

// ListUsers queries a page of users.
func (s *UserService) ListUsers(ctx context.Context, offset, limit int) ([]*domain.User, int, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.List(ctx, offset, limit)
}
