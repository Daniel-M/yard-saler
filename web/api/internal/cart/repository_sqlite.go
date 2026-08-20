package cart

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

func (r *SqliteRepository) GetCartItems(ctx context.Context, userID string) ([]*domain.CartItemWithProduct, error) {
	query := `
		SELECT c.id, c.product_id, p.product_code, p.name, p.price, c.quantity, p.images
		FROM cart_items c
		JOIN products p ON c.product_id = p.id
		WHERE c.user_id = ?
		ORDER BY c.created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query cart items: %w", err)
	}
	defer rows.Close()

	var items []*domain.CartItemWithProduct
	for rows.Next() {
		var item domain.CartItemWithProduct
		var imagesStr string
		var prodCode sql.NullString
		err := rows.Scan(&item.ID, &item.ProductID, &prodCode, &item.Name, &item.Price, &item.Quantity, &imagesStr)
		if err != nil {
			return nil, fmt.Errorf("failed to scan cart item: %w", err)
		}
		if prodCode.Valid {
			item.ProductCode = prodCode.String
		}
		if err := json.Unmarshal([]byte(imagesStr), &item.Images); err != nil {
			item.Images = []string{}
		}
		items = append(items, &item)
	}
	return items, nil
}

func (r *SqliteRepository) FindCartItemByID(ctx context.Context, id string) (*domain.CartItem, error) {
	query := `
		SELECT id, user_id, product_id, quantity, created_at, updated_at
		FROM cart_items
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var item domain.CartItem
	err := row.Scan(&item.ID, &item.UserID, &item.ProductID, &item.Quantity, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch cart item: %w", err)
	}
	return &item, nil
}

func (r *SqliteRepository) FindCartItemByUserAndProduct(ctx context.Context, userID, productID string) (*domain.CartItem, error) {
	query := `
		SELECT id, user_id, product_id, quantity, created_at, updated_at
		FROM cart_items
		WHERE user_id = ? AND product_id = ?
	`
	row := r.db.QueryRowContext(ctx, query, userID, productID)
	var item domain.CartItem
	err := row.Scan(&item.ID, &item.UserID, &item.ProductID, &item.Quantity, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch cart item by user and product: %w", err)
	}
	return &item, nil
}

func (r *SqliteRepository) AddToCart(ctx context.Context, item *domain.CartItem) (*domain.CartItem, error) {
	query := `
		INSERT INTO cart_items (id, user_id, product_id, quantity, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query, item.ID, item.UserID, item.ProductID, item.Quantity, item.CreatedAt, item.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert cart item: %w", err)
	}
	return item, nil
}

func (r *SqliteRepository) UpdateCartItem(ctx context.Context, id string, quantity int) error {
	query := `
		UPDATE cart_items
		SET quantity = ?, updated_at = ?
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, quantity, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update cart item: %w", err)
	}
	return nil
}

func (r *SqliteRepository) RemoveCartItem(ctx context.Context, id string) error {
	query := `
		DELETE FROM cart_items
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete cart item: %w", err)
	}
	return nil
}
