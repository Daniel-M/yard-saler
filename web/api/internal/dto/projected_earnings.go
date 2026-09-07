package dto

// ProjectedEarningsDTO represents the response for earnings projection on the dashboard.
// JSON fields are snake_case to follow API contract guidelines.
type ProjectedEarningsDTO struct {
	CurrentSold       float64 `json:"current_sold"`
	ProjectedSold     float64 `json:"projected_sold"`
	ProjectedEarnings float64 `json:"projected_earnings"`
	Target            float64 `json:"target"`
}
