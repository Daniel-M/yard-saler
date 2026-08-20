package cart

import (
	"context"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type Repository interface {
	GetCartItems(ctx context.Context, userID string) ([]*domain.CartItemWithProduct, error)
	FindCartItemByID(ctx context.Context, id string) (*domain.CartItem, error)
	FindCartItemByUserAndProduct(ctx context.Context, userID, productID string) (*domain.CartItem, error)
	AddToCart(ctx context.Context, item *domain.CartItem) (*domain.CartItem, error)
	UpdateCartItem(ctx context.Context, id string, quantity int) error
	RemoveCartItem(ctx context.Context, id string) error
}
