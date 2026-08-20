package dto

type WishlistItemDTO struct {
	ID          string   `json:"id"`
	ProductID   string   `json:"product_id"`
	ProductCode string   `json:"product_code"`
	Name        string   `json:"name"`
	Price       int      `json:"price"`
	Images      []string `json:"images"`
}

type WishlistContentsDTO struct {
	Items []WishlistItemDTO `json:"items"`
}

type AddToWishlistDTO struct {
	ProductID string `json:"product_id"`
}
