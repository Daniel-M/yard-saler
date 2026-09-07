package dto

import "time"

type NotificationDTO struct {
	ID          string     `json:"id"`
	UserID      string     `json:"user_id"`
	Title       string     `json:"title"`
	Content     string     `json:"content"`
	Type        string     `json:"type"`
	ReferenceID string     `json:"reference_id"`
	IsRead      bool       `json:"is_read"`
	CreatedAt   time.Time  `json:"created_at"`
	ReadAt      *time.Time `json:"read_at,omitempty"`
}

type GetNotificationsResponseDTO struct {
	Notifications []NotificationDTO `json:"notifications"`
}

type NotificationStatusResponseDTO struct {
	Status string `json:"status"`
}
