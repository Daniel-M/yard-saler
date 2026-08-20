package wishlist

import (
	"context"
	"errors"
	"time"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/yard_sale"
	"github.com/oklog/ulid/v2"
)

var (
	ErrProductNotFound      = errors.New("product not found")
	ErrWishlistItemNotFound = errors.New("wishlist item not found")
	ErrForbidden            = errors.New("forbidden")
)

type Service struct {
	wishRepo Repository
	ysRepo   yard_sale.Repository
}

func NewService(wishRepo Repository, ysRepo yard_sale.Repository) *Service {
	return &Service{
		wishRepo: wishRepo,
		ysRepo:   ysRepo,
	}
}

func (s *Service) GetWishlistContents(ctx context.Context, userID string) ([]*domain.WishlistItemWithProduct, error) {
	return s.wishRepo.GetWishlistItems(ctx, userID)
}

func (s *Service) AddToWishlist(ctx context.Context, userID string, d dto.AddToWishlistDTO) (*domain.WishlistItem, error) {
	prod, err := s.ysRepo.FindProductByID(ctx, d.ProductID)
	if err != nil {
		return nil, err
	}
	if prod == nil {
		return nil, ErrProductNotFound
	}

	// Check if already in wishlist
	existing, err := s.wishRepo.FindWishlistItemByUserAndProduct(ctx, userID, d.ProductID)
	if err != nil {
		return nil, err
	}

	if existing != nil {
		return existing, nil
	}

	item := &domain.WishlistItem{
		ID:        ulid.Make().String(),
		UserID:    userID,
		ProductID: d.ProductID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.wishRepo.AddToWishlist(ctx, item)
}

func (s *Service) RemoveFromWishlist(ctx context.Context, userID string, id string) error {
	item, err := s.wishRepo.FindWishlistItemByID(ctx, id)
	if err != nil {
		return err
	}
	if item == nil {
		return ErrWishlistItemNotFound
	}

	if item.UserID != userID {
		return ErrForbidden
	}

	return s.wishRepo.RemoveWishlistItem(ctx, id)
}
