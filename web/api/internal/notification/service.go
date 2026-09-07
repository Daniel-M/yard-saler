package notification

import (
	"context"
	"errors"
	"time"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/oklog/ulid/v2"
)

var (
	ErrNotFound     = errors.New("notification not found")
	ErrUnauthorized = errors.New("unauthorized")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetNotifications(ctx context.Context, userID string) ([]*domain.Notification, error) {
	return s.repo.FindAllForUser(ctx, userID)
}

func (s *Service) MarkAsRead(ctx context.Context, userID string, id string) (int, error) {
	n, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return 0, err
	}
	if n == nil {
		return 0, ErrNotFound
	}
	if n.UserID != userID {
		return 0, ErrUnauthorized
	}
	return s.repo.MarkAsRead(ctx, id)
}

func (s *Service) MarkAllAsRead(ctx context.Context, userID string) (int, error) {
	return s.repo.MarkAllAsRead(ctx, userID)
}

func (s *Service) CreateNotification(ctx context.Context, userID, title, content, nType, referenceID string) (*domain.Notification, error) {
	n := &domain.Notification{
		ID:          ulid.Make().String(),
		UserID:      userID,
		Title:       title,
		Content:     content,
		Type:        nType,
		ReferenceID: referenceID,
		IsRead:      false,
		CreatedAt:   time.Now(),
	}
	return s.repo.Create(ctx, n)
}
