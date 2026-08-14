package user

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/danielmejiar/whale_shark/web/backend/internal/domain"
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
		// In a production system, we'd generate a UUID or ULID.
		// For now, we will assign a mock or expect one from the caller.
		u.ID = fmt.Sprintf("usr_%d", time.Now().UnixNano())
	}

	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()

	return s.repo.Create(ctx, u)
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
