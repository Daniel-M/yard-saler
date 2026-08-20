package dto

import (
	"errors"
	"time"
)

type CreateProductDTO struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       int      `json:"price"`
	Condition   string   `json:"condition"`
	Status      string   `json:"status"` // Default 'available'
	Images      []string `json:"images"`
	ProductCode string   `json:"product_code"`
}

func (d CreateProductDTO) Validate() error {
	if d.Name == "" {
		return errors.New("name is required")
	}
	if d.Condition == "" {
		return errors.New("condition is required")
	}
	if d.Price < 0 {
		return errors.New("price must be a non-negative integer")
	}

	validConditions := map[string]bool{
		"new":      true,
		"like_new": true,
		"good":     true,
		"fair":     true,
		"poor":     true,
	}
	if !validConditions[d.Condition] {
		return errors.New("condition must be one of: new, like_new, good, fair, poor")
	}

	validStatuses := map[string]bool{
		"available": true,
		"pending":   true,
		"sold":      true,
	}
	if d.Status != "" && !validStatuses[d.Status] {
		return errors.New("status must be one of: available, pending, sold")
	}

	return nil
}

type ProductDTO struct {
	ID           string    `json:"id"`
	YardSaleID   string    `json:"yard_sale_id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Price        int       `json:"price"`
	Condition    string    `json:"condition"`
	Status       string    `json:"status"`
	Images       []string  `json:"images"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	ProductCode  string    `json:"product_code"`
	YardSaleCode string    `json:"yard_sale_code,omitempty"`
}
