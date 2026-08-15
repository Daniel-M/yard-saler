package user

import (
	"context"

	"github.com/Daniel-M/ys-api/internal/domain"
)

// UserRepository defines the interface for persisting and querying User domain entities.
type UserRepository interface {
	FindByID(ctx context.Context, id string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByVerificationCode(ctx context.Context, code string) (*domain.User, error)
	FindByPasswordResetCode(ctx context.Context, code string) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) (*domain.User, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, offset, limit int) ([]*domain.User, int, error)

	FindIdentity(ctx context.Context, provider, providerUID string) (*domain.UserIdentity, error)
	FindIdentitiesByUserID(ctx context.Context, userID string) ([]*domain.UserIdentity, error)
	CreateIdentity(ctx context.Context, identity *domain.UserIdentity) (*domain.UserIdentity, error)
}
