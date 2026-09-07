package messaging

import (
	"context"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type Repository interface {
	FindThreadByBuyerSellerProduct(ctx context.Context, buyerID, sellerID, productID string) (*domain.MessageThread, error)
	CreateThread(ctx context.Context, thread *domain.MessageThread) (*domain.MessageThread, error)
	CreateMessage(ctx context.Context, msg *domain.Message) (*domain.Message, error)
	FindThreadByID(ctx context.Context, id string) (*domain.MessageThread, error)
	FindThreadDetailsForUser(ctx context.Context, userID string) ([]*domain.ThreadDetail, error)
	FindMessagesByThreadID(ctx context.Context, threadID string) ([]*domain.Message, error)
	MarkMessagesAsReadInThread(ctx context.Context, threadID string, userID string) (int, error)
	GetUnreadCountForUser(ctx context.Context, userID string) (int, error)
}
