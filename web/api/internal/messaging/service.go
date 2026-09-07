package messaging

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/user"
	"github.com/Daniel-M/ys-api/internal/yard_sale"
	"github.com/oklog/ulid/v2"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrSelfMessage     = errors.New("cannot message yourself")
	ErrEmptyMessage    = errors.New("message cannot be empty")
	ErrThreadNotFound  = errors.New("thread not found")
	ErrUnauthorized    = errors.New("unauthorized")
)

type NotificationRepository interface {
	Create(ctx context.Context, n *domain.Notification) (*domain.Notification, error)
}

type Service struct {
	msgRepo          Repository
	ysRepo           yard_sale.Repository
	userRepo         user.UserRepository
	notificationRepo NotificationRepository
}

func NewService(msgRepo Repository, ysRepo yard_sale.Repository, userRepo user.UserRepository, notificationRepo NotificationRepository) *Service {
	return &Service{
		msgRepo:          msgRepo,
		ysRepo:           ysRepo,
		userRepo:         userRepo,
		notificationRepo: notificationRepo,
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

	// Create notification for seller
	sender, err := s.userRepo.FindByID(ctx, buyerID)
	senderName := "Someone"
	if err == nil && sender != nil {
		senderName = sender.FirstName + " " + sender.LastName
	}

	contentMsg := fmt.Sprintf("%s sent you a message: %s", senderName, d.Message)
	if len(contentMsg) > 100 {
		contentMsg = contentMsg[:97] + "..."
	}

	_, _ = s.notificationRepo.Create(ctx, &domain.Notification{
		ID:          ulid.Make().String(),
		UserID:      sellerID,
		Title:       "New Message",
		Content:     contentMsg,
		Type:        "message",
		ReferenceID: thread.ID,
		IsRead:      false,
		CreatedAt:   time.Now(),
	})

	return thread, msg, nil
}

func (s *Service) GetConversations(ctx context.Context, userID string) ([]*domain.ThreadDetail, error) {
	return s.msgRepo.FindThreadDetailsForUser(ctx, userID)
}

func (s *Service) GetMessageHistory(ctx context.Context, userID string, threadID string) ([]*domain.Message, *domain.MessageThread, string, string, string, string, error) {
	thread, err := s.msgRepo.FindThreadByID(ctx, threadID)
	if err != nil {
		return nil, nil, "", "", "", "", err
	}
	if thread == nil {
		return nil, nil, "", "", "", "", ErrThreadNotFound
	}

	if thread.BuyerID != userID && thread.SellerID != userID {
		return nil, nil, "", "", "", "", ErrUnauthorized
	}

	// Mark as read
	_, err = s.msgRepo.MarkMessagesAsReadInThread(ctx, threadID, userID)
	if err != nil {
		return nil, nil, "", "", "", "", err
	}

	// Get messages
	msgs, err := s.msgRepo.FindMessagesByThreadID(ctx, threadID)
	if err != nil {
		return nil, nil, "", "", "", "", err
	}

	// Fetch other user name
	otherUserID := thread.BuyerID
	if userID == thread.BuyerID {
		otherUserID = thread.SellerID
	}

	otherUser, err := s.userRepo.FindByID(ctx, otherUserID)
	var otherUserName string
	if err == nil && otherUser != nil {
		otherUserName = otherUser.FirstName + " " + otherUser.LastName
	}

	// Fetch product name, product code, and event code
	product, err := s.ysRepo.FindProductByID(ctx, thread.ProductID)
	var productName string
	var productCode string
	var eventCode string
	if err == nil && product != nil {
		productName = product.Name
		productCode = product.ProductCode
		ys, err := s.ysRepo.FindYardSaleByID(ctx, product.YardSaleID)
		if err == nil && ys != nil {
			eventCode = ys.EventCode
		}
	}

	return msgs, thread, otherUserName, productName, productCode, eventCode, nil
}

func (s *Service) SendMessage(ctx context.Context, userID string, threadID string, content string) (*domain.Message, string, string, error) {
    if content == "" {
        return nil, "", "", ErrEmptyMessage
    }

    thread, err := s.msgRepo.FindThreadByID(ctx, threadID)
    if err != nil {
        return nil, "", "", err
    }
    if thread == nil {
        return nil, "", "", ErrThreadNotFound
    }

    if thread.BuyerID != userID && thread.SellerID != userID {
        return nil, "", "", ErrUnauthorized
    }

    msg := &domain.Message{
        ID:        ulid.Make().String(),
        ThreadID:  thread.ID,
        SenderID:  userID,
        Content:   content,
        CreatedAt: time.Now(),
    }

    _, err = s.msgRepo.CreateMessage(ctx, msg)
    if err != nil {
        return nil, "", "", err
    }

    // Fetch product and event codes for response
    var productCode, eventCode string
    product, err := s.ysRepo.FindProductByID(ctx, thread.ProductID)
    if err == nil && product != nil {
        productCode = product.ProductCode
        ys, err := s.ysRepo.FindYardSaleByID(ctx, product.YardSaleID)
        if err == nil && ys != nil {
            eventCode = ys.EventCode
        }
    }

    // Create notification for recipient
    recipientID := thread.BuyerID
    if userID == thread.BuyerID {
        recipientID = thread.SellerID
    }

    sender, err := s.userRepo.FindByID(ctx, userID)
    senderName := "Someone"
    if err == nil && sender != nil {
        senderName = sender.FirstName + " " + sender.LastName
    }

    contentMsg := fmt.Sprintf("%s sent you a message: %s", senderName, content)
    if len(contentMsg) > 100 {
        contentMsg = contentMsg[:97] + "..."
    }

    _, _ = s.notificationRepo.Create(ctx, &domain.Notification{
        ID:          ulid.Make().String(),
        UserID:      recipientID,
        Title:       "New Message",
        Content:     contentMsg,
        Type:        "message",
        ReferenceID: thread.ID,
        IsRead:      false,
        CreatedAt:   time.Now(),
    })

    return msg, productCode, eventCode, nil
}

func (s *Service) MarkThreadRead(ctx context.Context, userID string, threadID string) (int, error) {
	thread, err := s.msgRepo.FindThreadByID(ctx, threadID)
	if err != nil {
		return 0, err
	}
	if thread == nil {
		return 0, ErrThreadNotFound
	}

	if thread.BuyerID != userID && thread.SellerID != userID {
		return 0, ErrUnauthorized
	}

	return s.msgRepo.MarkMessagesAsReadInThread(ctx, threadID, userID)
}

func (s *Service) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	return s.msgRepo.GetUnreadCountForUser(ctx, userID)
}
