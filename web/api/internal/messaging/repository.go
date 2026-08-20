package messaging

import (
	"context"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type Repository interface {
	FindThreadByBuyerSellerProduct(ctx context.Context, buyerID, sellerID, productID string) (*domain.MessageThread, error)
	CreateThread(ctx context.Context, thread *domain.MessageThread) (*domain.MessageThread, error)
	CreateMessage(ctx context.Context, msg *domain.Message) (*domain.Message, error)
}
