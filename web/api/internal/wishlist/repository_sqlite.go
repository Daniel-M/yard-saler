package wishlist

import (
	"context"
	"database/sql"
	"encoding/json"
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

func (r *SqliteRepository) GetWishlistItems(ctx context.Context, userID string) ([]*domain.WishlistItemWithProduct, error) {
	query := `
		SELECT w.id, w.product_id, p.product_code, p.name, p.price, p.images
		FROM wishlist_items w
		JOIN products p ON w.product_id = p.id
		WHERE w.user_id = ?
		ORDER BY w.created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query wishlist items: %w", err)
	}
	defer rows.Close()

	var items []*domain.WishlistItemWithProduct
	for rows.Next() {
		var item domain.WishlistItemWithProduct
		var imagesStr string
		var prodCode sql.NullString
		err := rows.Scan(&item.ID, &item.ProductID, &prodCode, &item.Name, &item.Price, &imagesStr)
		if err != nil {
			return nil, fmt.Errorf("failed to scan wishlist item: %w", err)
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

func (r *SqliteRepository) FindWishlistItemByID(ctx context.Context, id string) (*domain.WishlistItem, error) {
	query := `
		SELECT id, user_id, product_id, created_at, updated_at
		FROM wishlist_items
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var item domain.WishlistItem
	err := row.Scan(&item.ID, &item.UserID, &item.ProductID, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch wishlist item: %w", err)
	}
	return &item, nil
}

func (r *SqliteRepository) FindWishlistItemByUserAndProduct(ctx context.Context, userID, productID string) (*domain.WishlistItem, error) {
	query := `
		SELECT id, user_id, product_id, created_at, updated_at
		FROM wishlist_items
		WHERE user_id = ? AND product_id = ?
	`
	row := r.db.QueryRowContext(ctx, query, userID, productID)
	var item domain.WishlistItem
	err := row.Scan(&item.ID, &item.UserID, &item.ProductID, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch wishlist item by user and product: %w", err)
	}
	return &item, nil
}

func (r *SqliteRepository) AddToWishlist(ctx context.Context, item *domain.WishlistItem) (*domain.WishlistItem, error) {
	query := `
		INSERT INTO wishlist_items (id, user_id, product_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query, item.ID, item.UserID, item.ProductID, item.CreatedAt, item.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert wishlist item: %w", err)
	}
	return item, nil
}

func (r *SqliteRepository) RemoveWishlistItem(ctx context.Context, id string) error {
	query := `
		DELETE FROM wishlist_items
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete wishlist item: %w", err)
	}
	return nil
}
