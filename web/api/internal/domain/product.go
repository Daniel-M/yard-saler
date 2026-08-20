package domain

import (
	"time"
)

type Product struct {
	ID          string    `json:"id"`
	YardSaleID  string    `json:"yard_sale_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       int       `json:"price"` // stored in cents
	Condition   string    `json:"condition"`
	Status      string    `json:"status"` // 'available', 'pending', 'sold'
	Images      []string  `json:"images"` // stored in SQLite as JSON array
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	ProductCode string    `json:"product_code"`
}
