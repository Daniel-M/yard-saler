package domain

import "time"

type WishlistItem struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	ProductID string    `json:"product_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type WishlistItemWithProduct struct {
	ID          string   `json:"id"`
	ProductID   string   `json:"product_id"`
	ProductCode string   `json:"product_code"`
	Name        string   `json:"name"`
	Price       int      `json:"price"`
	Images      []string `json:"images"`
}
