package notification

import (
	"context"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type Repository interface {
	FindAllForUser(ctx context.Context, userID string) ([]*domain.Notification, error)
	FindByID(ctx context.Context, id string) (*domain.Notification, error)
	MarkAsRead(ctx context.Context, id string) (int, error)
	MarkAllAsRead(ctx context.Context, userID string) (int, error)
	Create(ctx context.Context, n *domain.Notification) (*domain.Notification, error)
}
