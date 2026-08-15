package domain

import "time"

// UserIdentity represents credentials or an OAuth link associated with a User profile.
type UserIdentity struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Provider     string    `json:"provider"`
	ProviderUID  string    `json:"provider_uid"`
	PasswordHash string    `json:"password_hash,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}
