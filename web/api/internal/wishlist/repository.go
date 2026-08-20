package wishlist

import (
	"context"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type Repository interface {
	GetWishlistItems(ctx context.Context, userID string) ([]*domain.WishlistItemWithProduct, error)
	FindWishlistItemByID(ctx context.Context, id string) (*domain.WishlistItem, error)
	FindWishlistItemByUserAndProduct(ctx context.Context, userID, productID string) (*domain.WishlistItem, error)
	AddToWishlist(ctx context.Context, item *domain.WishlistItem) (*domain.WishlistItem, error)
	RemoveWishlistItem(ctx context.Context, id string) error
}
