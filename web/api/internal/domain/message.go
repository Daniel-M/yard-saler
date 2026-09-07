package domain

import "time"

type MessageThread struct {
	ID        string    `json:"id"`
	BuyerID   string    `json:"buyer_id"`
	SellerID  string    `json:"seller_id"`
	ProductID string    `json:"product_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID        string     `json:"id"`
	ThreadID  string     `json:"thread_id"`
	SenderID  string     `json:"sender_id"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	ReadAt    *time.Time `json:"read_at"`
}

type ThreadDetail struct {
	ID            string    `json:"id"`
	BuyerID       string    `json:"buyer_id"`
	SellerID      string    `json:"seller_id"`
	ProductID     string    `json:"product_id"`
	ProductName   string    `json:"product_name"`
	ProductImage  string    `json:"product_image"`
	OtherUserID   string    `json:"other_user_id"`
	OtherUserName string    `json:"other_user_name"`
	LastMessage   string    `json:"last_message"`
	LastMessageAt time.Time `json:"last_message_at"`
	UnreadCount   int       `json:"unread_count"`
	ProductCode   string    `json:"product_code"`
	EventCode     string    `json:"event_code"`
}
