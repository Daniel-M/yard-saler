package messaging

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
	ErrProductNotFound = errors.New("product not found")
	ErrSelfMessage     = errors.New("cannot message yourself")
	ErrEmptyMessage    = errors.New("message cannot be empty")
)

type Service struct {
	msgRepo Repository
	ysRepo  yard_sale.Repository
}

func NewService(msgRepo Repository, ysRepo yard_sale.Repository) *Service {
	return &Service{
		msgRepo: msgRepo,
		ysRepo:  ysRepo,
	}
}

func (s *Service) StartThread(ctx context.Context, buyerID string, d dto.StartThreadDTO) (*domain.MessageThread, *domain.Message, error) {
	if d.Message == "" {
		return nil, nil, ErrEmptyMessage
	}

	prod, err := s.ysRepo.FindProductByID(ctx, d.ProductID)
	if err != nil {
		return nil, nil, err
	}
	if prod == nil {
		return nil, nil, ErrProductNotFound
	}

	// Fetch yard sale to get the seller ID
	ys, err := s.ysRepo.FindYardSaleByID(ctx, prod.YardSaleID)
	if err != nil {
		return nil, nil, err
	}
	if ys == nil {
		return nil, nil, errors.New("associated yard sale not found")
	}

	sellerID := ys.UserID
	if buyerID == sellerID {
		return nil, nil, ErrSelfMessage
	}

	// Check for existing thread
	thread, err := s.msgRepo.FindThreadByBuyerSellerProduct(ctx, buyerID, sellerID, d.ProductID)
	if err != nil {
		return nil, nil, err
	}

	if thread == nil {
		thread = &domain.MessageThread{
			ID:        ulid.Make().String(),
			BuyerID:   buyerID,
			SellerID:  sellerID,
			ProductID: d.ProductID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_, err = s.msgRepo.CreateThread(ctx, thread)
		if err != nil {
			return nil, nil, err
		}
	}

	msg := &domain.Message{
		ID:        ulid.Make().String(),
		ThreadID:  thread.ID,
		SenderID:  buyerID,
		Content:   d.Message,
		CreatedAt: time.Now(),
	}

	_, err = s.msgRepo.CreateMessage(ctx, msg)
	if err != nil {
		return nil, nil, err
	}

	return thread, msg, nil
}
