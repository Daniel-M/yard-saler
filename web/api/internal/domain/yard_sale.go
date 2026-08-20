package domain

import (
	"time"
)

type YardSale struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	StartDate   string    `json:"start_date"` // ISO8601 string (UTC)
	EndDate     string    `json:"end_date"`   // ISO8601 string (UTC)
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	EventCode   string    `json:"event_code"`
}
