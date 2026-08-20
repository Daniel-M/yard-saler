package cart

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/yard_sale"
	"github.com/oklog/ulid/v2"
)

var (
	ErrProductNotFound  = errors.New("product not found")
	ErrCartItemNotFound = errors.New("cart item not found")
	ErrForbidden        = errors.New("forbidden")
)

type Service struct {
	cartRepo Repository
	ysRepo   yard_sale.Repository
}

func NewService(cartRepo Repository, ysRepo yard_sale.Repository) *Service {
	return &Service{
		cartRepo: cartRepo,
		ysRepo:   ysRepo,
	}
}

func (s *Service) GetCartContents(ctx context.Context, userID string) ([]*domain.CartItemWithProduct, error) {
	return s.cartRepo.GetCartItems(ctx, userID)
}

func (s *Service) AddToCart(ctx context.Context, userID string, d dto.AddToCartDTO) (*domain.CartItem, error) {
	if d.Quantity < 1 {
		return nil, fmt.Errorf("quantity must be at least 1")
	}

	prod, err := s.ysRepo.FindProductByID(ctx, d.ProductID)
	if err != nil {
		return nil, err
	}
	if prod == nil {
		return nil, ErrProductNotFound
	}

	// Check if already in cart
	existing, err := s.cartRepo.FindCartItemByUserAndProduct(ctx, userID, d.ProductID)
	if err != nil {
		return nil, err
	}

	if existing != nil {
		newQty := existing.Quantity + d.Quantity
		err = s.cartRepo.UpdateCartItem(ctx, existing.ID, newQty)
		if err != nil {
			return nil, err
		}
		existing.Quantity = newQty
		return existing, nil
	}

	item := &domain.CartItem{
		ID:        ulid.Make().String(),
		UserID:    userID,
		ProductID: d.ProductID,
		Quantity:  d.Quantity,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.cartRepo.AddToCart(ctx, item)
}

func (s *Service) UpdateCartItemQuantity(ctx context.Context, userID string, id string, quantity int) (*domain.CartItem, error) {
	if quantity < 1 {
		return nil, fmt.Errorf("quantity must be at least 1")
	}

	item, err := s.cartRepo.FindCartItemByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrCartItemNotFound
	}

	if item.UserID != userID {
		return nil, ErrForbidden
	}

	err = s.cartRepo.UpdateCartItem(ctx, id, quantity)
	if err != nil {
		return nil, err
	}

	item.Quantity = quantity
	return item, nil
}

func (s *Service) RemoveFromCart(ctx context.Context, userID string, id string) error {
	item, err := s.cartRepo.FindCartItemByID(ctx, id)
	if err != nil {
		return err
	}
	if item == nil {
		return ErrCartItemNotFound
	}

	if item.UserID != userID {
		return ErrForbidden
	}

	return s.cartRepo.RemoveCartItem(ctx, id)
}
