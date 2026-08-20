package messaging

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type SqliteRepository struct {
	db *sql.DB
}

func NewSqliteRepository(db *sql.DB) *SqliteRepository {
	return &SqliteRepository{db: db}
}

func (r *SqliteRepository) FindThreadByBuyerSellerProduct(ctx context.Context, buyerID, sellerID, productID string) (*domain.MessageThread, error) {
	query := `
		SELECT id, buyer_id, seller_id, product_id, created_at, updated_at
		FROM message_threads
		WHERE buyer_id = ? AND seller_id = ? AND product_id = ?
	`
	row := r.db.QueryRowContext(ctx, query, buyerID, sellerID, productID)
	var thread domain.MessageThread
	err := row.Scan(&thread.ID, &thread.BuyerID, &thread.SellerID, &thread.ProductID, &thread.CreatedAt, &thread.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch message thread: %w", err)
	}
	return &thread, nil
}

func (r *SqliteRepository) CreateThread(ctx context.Context, thread *domain.MessageThread) (*domain.MessageThread, error) {
	query := `
		INSERT INTO message_threads (id, buyer_id, seller_id, product_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query, thread.ID, thread.BuyerID, thread.SellerID, thread.ProductID, thread.CreatedAt, thread.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert message thread: %w", err)
	}
	return thread, nil
}

func (r *SqliteRepository) CreateMessage(ctx context.Context, msg *domain.Message) (*domain.Message, error) {
	query := `
		INSERT INTO messages (id, thread_id, sender_id, content, created_at)
		VALUES (?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query, msg.ID, msg.ThreadID, msg.SenderID, msg.Content, msg.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert message: %w", err)
	}
	return msg, nil
}
