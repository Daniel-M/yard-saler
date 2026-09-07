package dto

import "time"

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

type ThreadDTO struct {
	ID            string    `json:"id"`
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

type GetConversationsResponseDTO struct {
	Threads []ThreadDTO `json:"threads"`
}

type MessageDTO struct {
	ID        string     `json:"id"`
	SenderID  string     `json:"sender_id"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	ReadAt    *time.Time `json:"read_at"`
}

type MessageHistoryResponseDTO struct {
	ThreadID      string       `json:"thread_id"`
	ProductID     string       `json:"product_id"`
	ProductName   string       `json:"product_name"`
	ProductCode   string       `json:"product_code"`
	EventCode     string       `json:"event_code"`
	OtherUserName string       `json:"other_user_name"`
	Messages      []MessageDTO `json:"messages"`
}

type SendMessageDTO struct {
	Content string `json:"content"`
}

type SendMessageResponseDTO struct {
    ID        string     `json:"id"`
    ThreadID  string     `json:"thread_id"`
    SenderID  string     `json:"sender_id"`
    Content   string     `json:"content"`
    CreatedAt time.Time  `json:"created_at"`
    ReadAt    *time.Time `json:"read_at"`
    EventCode string     `json:"event_code"`
    ProductCode string   `json:"product_code"`
}

type MarkReadResponseDTO struct {
	Status      string `json:"status"`
	MarkedCount int    `json:"marked_count"`
}

type UnreadCountResponseDTO struct {
	UnreadCount int `json:"unread_count"`
}
