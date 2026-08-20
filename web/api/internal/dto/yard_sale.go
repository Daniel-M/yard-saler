package dto

import (
	"errors"
	"time"
)

type CreateYardSaleDTO struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Location    string `json:"location"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	EventCode   string `json:"event_code"`
}

func (d CreateYardSaleDTO) Validate() error {
	if d.Title == "" {
		return errors.New("title is required")
	}
	if d.Location == "" {
		return errors.New("location is required")
	}
	if d.StartDate == "" {
		return errors.New("start_date is required")
	}
	if d.EndDate == "" {
		return errors.New("end_date is required")
	}

	start, err := time.Parse(time.RFC3339, d.StartDate)
	if err != nil {
		return errors.New("start_date must be a valid ISO8601 UTC date")
	}
	end, err := time.Parse(time.RFC3339, d.EndDate)
	if err != nil {
		return errors.New("end_date must be a valid ISO8601 UTC date")
	}

	if !end.After(start) {
		return errors.New("end_date must be chronologically after start_date")
	}

	return nil
}

type YardSaleDTO struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	StartDate   string    `json:"start_date"`
	EndDate     string    `json:"end_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	EventCode   string    `json:"event_code"`
}

type YardSalesListDTO struct {
	YardSales []YardSaleDTO `json:"yard_sales"`
	Total     int           `json:"total"`
	Offset    int           `json:"offset"`
	Limit     int           `json:"limit"`
}

type YardSaleDetailDTO struct {
	ID          string       `json:"id"`
	UserID      string       `json:"user_id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Location    string       `json:"location"`
	StartDate   string       `json:"start_date"`
	EndDate     string       `json:"end_date"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	EventCode   string       `json:"event_code"`
	Products    []ProductDTO `json:"products"`
}
