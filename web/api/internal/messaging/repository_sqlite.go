package messaging

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

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
		INSERT INTO messages (id, thread_id, sender_id, content, created_at, read_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query, msg.ID, msg.ThreadID, msg.SenderID, msg.Content, msg.CreatedAt, msg.ReadAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert message: %w", err)
	}
	return msg, nil
}

func (r *SqliteRepository) FindThreadByID(ctx context.Context, id string) (*domain.MessageThread, error) {
	query := `
		SELECT id, buyer_id, seller_id, product_id, created_at, updated_at
		FROM message_threads
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var thread domain.MessageThread
	err := row.Scan(&thread.ID, &thread.BuyerID, &thread.SellerID, &thread.ProductID, &thread.CreatedAt, &thread.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch message thread by id: %w", err)
	}
	return &thread, nil
}

func (r *SqliteRepository) FindThreadDetailsForUser(ctx context.Context, userID string) ([]*domain.ThreadDetail, error) {
	query := `
		SELECT 
			t.id, 
			t.buyer_id, 
			t.seller_id, 
			t.product_id, 
			COALESCE(p.name, '') AS product_name, 
			COALESCE(p.images, '[]') AS product_images, 
			COALESCE(u_buyer.id, '') AS buyer_uid,
			COALESCE(u_buyer.first_name, '') AS buyer_fname, 
			COALESCE(u_buyer.last_name, '') AS buyer_lname, 
			COALESCE(u_seller.id, '') AS seller_uid,
			COALESCE(u_seller.first_name, '') AS seller_fname, 
			COALESCE(u_seller.last_name, '') AS seller_lname, 
			COALESCE(m.content, '') AS last_message, 
			COALESCE(m.created_at, t.created_at) AS last_message_at,
			(SELECT COUNT(*) FROM messages m2 WHERE m2.thread_id = t.id AND m2.sender_id != ? AND m2.read_at IS NULL) AS unread_count,
			COALESCE(p.product_code, '') AS product_code,
			COALESCE(ys.event_code, '') AS event_code
		FROM message_threads t
		LEFT JOIN products p ON t.product_id = p.id
		LEFT JOIN yard_sales ys ON p.yard_sale_id = ys.id
		LEFT JOIN users u_buyer ON t.buyer_id = u_buyer.id
		LEFT JOIN users u_seller ON t.seller_id = u_seller.id
		LEFT JOIN messages m ON m.id = (
			SELECT m3.id 
			FROM messages m3 
			WHERE m3.thread_id = t.id 
			ORDER BY m3.created_at DESC, m3.id DESC 
			LIMIT 1
		)
		WHERE t.buyer_id = ? OR t.seller_id = ?
		ORDER BY last_message_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID, userID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query thread details for user: %w", err)
	}
	defer rows.Close()

	var details []*domain.ThreadDetail
	for rows.Next() {
		var d domain.ThreadDetail
		var buyerUID, buyerFname, buyerLname string
		var sellerUID, sellerFname, sellerLname string
		var imagesStr string

		var lastMsgAtStr string

		err := rows.Scan(
			&d.ID,
			&d.BuyerID,
			&d.SellerID,
			&d.ProductID,
			&d.ProductName,
			&imagesStr,
			&buyerUID,
			&buyerFname,
			&buyerLname,
			&sellerUID,
			&sellerFname,
			&sellerLname,
			&d.LastMessage,
			&lastMsgAtStr,
			&d.UnreadCount,
			&d.ProductCode,
			&d.EventCode,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan thread detail: %w", err)
		}

		// Parse custom SQLite datetime string
		layouts := []string{
			"2006-01-02 15:04:05.999999999-07:00",
			"2006-01-02 15:04:05.999999999",
			time.RFC3339,
		}
		for _, layout := range layouts {
			if parsedTime, err := time.Parse(layout, lastMsgAtStr); err == nil {
				d.LastMessageAt = parsedTime
				break
			}
		}

		// Extract first image from product images json array
		var imgs []string
		if err := json.Unmarshal([]byte(imagesStr), &imgs); err == nil && len(imgs) > 0 {
			d.ProductImage = imgs[0]
		}

		// Determine other user details
		if userID == buyerUID {
			d.OtherUserID = sellerUID
			d.OtherUserName = sellerFname + " " + sellerLname
		} else {
			d.OtherUserID = buyerUID
			d.OtherUserName = buyerFname + " " + buyerLname
		}

		details = append(details, &d)
	}
	return details, nil
}

func (r *SqliteRepository) FindMessagesByThreadID(ctx context.Context, threadID string) ([]*domain.Message, error) {
	query := `
		SELECT id, thread_id, sender_id, content, created_at, read_at
		FROM messages
		WHERE thread_id = ?
		ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, threadID)
	if err != nil {
		return nil, fmt.Errorf("failed to query messages by thread id: %w", err)
	}
	defer rows.Close()

	var msgs []*domain.Message
	for rows.Next() {
		var msg domain.Message
		err := rows.Scan(&msg.ID, &msg.ThreadID, &msg.SenderID, &msg.Content, &msg.CreatedAt, &msg.ReadAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		msgs = append(msgs, &msg)
	}
	return msgs, nil
}

func (r *SqliteRepository) MarkMessagesAsReadInThread(ctx context.Context, threadID string, userID string) (int, error) {
	query := `
		UPDATE messages
		SET read_at = CURRENT_TIMESTAMP
		WHERE thread_id = ? AND sender_id != ? AND read_at IS NULL
	`
	res, err := r.db.ExecContext(ctx, query, threadID, userID)
	if err != nil {
		return 0, fmt.Errorf("failed to mark messages as read: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}
	return int(rowsAffected), nil
}

func (r *SqliteRepository) GetUnreadCountForUser(ctx context.Context, userID string) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM messages m
		JOIN message_threads t ON m.thread_id = t.id
		WHERE (t.buyer_id = ? OR t.seller_id = ?) AND m.sender_id != ? AND m.read_at IS NULL
	`
	var count int
	err := r.db.QueryRowContext(ctx, query, userID, userID, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to query unread count: %w", err)
	}
	return count, nil
}
