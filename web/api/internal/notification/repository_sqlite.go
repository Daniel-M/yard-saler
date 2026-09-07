package notification

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

func (r *SqliteRepository) FindAllForUser(ctx context.Context, userID string) ([]*domain.Notification, error) {
	query := `
		SELECT id, user_id, title, content, type, reference_id, is_read, created_at, read_at
		FROM notifications
		WHERE user_id = ?
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	var list []*domain.Notification
	for rows.Next() {
		var n domain.Notification
		err := rows.Scan(
			&n.ID,
			&n.UserID,
			&n.Title,
			&n.Content,
			&n.Type,
			&n.ReferenceID,
			&n.IsRead,
			&n.CreatedAt,
			&n.ReadAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}
		list = append(list, &n)
	}
	return list, nil
}

func (r *SqliteRepository) FindByID(ctx context.Context, id string) (*domain.Notification, error) {
	query := `
		SELECT id, user_id, title, content, type, reference_id, is_read, created_at, read_at
		FROM notifications
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var n domain.Notification
	err := row.Scan(
		&n.ID,
		&n.UserID,
		&n.Title,
		&n.Content,
		&n.Type,
		&n.ReferenceID,
		&n.IsRead,
		&n.CreatedAt,
		&n.ReadAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch notification by id: %w", err)
	}
	return &n, nil
}

func (r *SqliteRepository) MarkAsRead(ctx context.Context, id string) (int, error) {
	query := `
		UPDATE notifications
		SET is_read = 1, read_at = CURRENT_TIMESTAMP
		WHERE id = ? AND is_read = 0
	`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return 0, fmt.Errorf("failed to mark notification as read: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}
	return int(rowsAffected), nil
}

func (r *SqliteRepository) MarkAllAsRead(ctx context.Context, userID string) (int, error) {
	query := `
		UPDATE notifications
		SET is_read = 1, read_at = CURRENT_TIMESTAMP
		WHERE user_id = ? AND is_read = 0
	`
	res, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return 0, fmt.Errorf("failed to mark all notifications as read: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}
	return int(rowsAffected), nil
}

func (r *SqliteRepository) Create(ctx context.Context, n *domain.Notification) (*domain.Notification, error) {
	query := `
		INSERT INTO notifications (id, user_id, title, content, type, reference_id, is_read, created_at, read_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query,
		n.ID,
		n.UserID,
		n.Title,
		n.Content,
		n.Type,
		n.ReferenceID,
		n.IsRead,
		n.CreatedAt,
		n.ReadAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert notification: %w", err)
	}
	return n, nil
}
