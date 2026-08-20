package dto

type StartThreadDTO struct {
	ProductID string `json:"product_id"`
	Message   string `json:"message"`
}

type StartThreadResponseDTO struct {
	ThreadID  string `json:"thread_id"`
	MessageID string `json:"message_id"`
	BuyerID   string `json:"buyer_id"`
	SellerID  string `json:"seller_id"`
	ProductID string `json:"product_id"`
}
