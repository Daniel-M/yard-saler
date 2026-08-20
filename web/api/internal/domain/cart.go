package domain

import "time"

type CartItem struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	ProductID string    `json:"product_id"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CartItemWithProduct struct {
	ID          string   `json:"id"`
	ProductID   string   `json:"product_id"`
	ProductCode string   `json:"product_code"`
	Name        string   `json:"name"`
	Price       int      `json:"price"`
	Quantity    int      `json:"quantity"`
	Images      []string `json:"images"`
}
