package dto

type CartItemDTO struct {
	ID          string   `json:"id"`
	ProductID   string   `json:"product_id"`
	ProductCode string   `json:"product_code"`
	Name        string   `json:"name"`
	Price       int      `json:"price"`
	Quantity    int      `json:"quantity"`
	Images      []string `json:"images"`
}

type CartContentsDTO struct {
	Items []CartItemDTO `json:"items"`
}

type AddToCartDTO struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type UpdateCartItemDTO struct {
	Quantity int `json:"quantity"`
}
