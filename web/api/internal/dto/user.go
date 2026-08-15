package dto

import (
	"errors"
	"time"
)

type UserPreRegisterDTO struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

func (d UserPreRegisterDTO) Validate() error {
	if d.Email == "" {
		return errors.New("email is required")
	}
	if d.Password == "" {
		return errors.New("password is required")
	}
	if len(d.Password) < 6 {
		return errors.New("password must be at least 6 characters")
	}
	if d.FirstName == "" {
		return errors.New("first name is required")
	}
	if d.LastName == "" {
		return errors.New("last name is required")
	}
	return nil
}

type UserDTO struct {
	ID               string     `json:"id"`
	Email            string     `json:"email"`
	FirstName        string     `json:"first_name"`
	LastName         string     `json:"last_name"`
	Role             string     `json:"role"`
	MobilePhone      string     `json:"mobile_phone"`
	Socials          string     `json:"socials"`
	VerificationCode *string    `json:"verification_code,omitempty"` // always nil when returned to user
	VerifiedAt       *time.Time `json:"verified_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func (d UserDTO) Validate() error {
	if d.FirstName == "" {
		return errors.New("first name is required")
	}
	if d.LastName == "" {
		return errors.New("last name is required")
	}
	return nil
}

type UserVerifyDTO struct {
	VerificationCode string `json:"verification_code"`
}

func (d UserVerifyDTO) Validate() error {
	if d.VerificationCode == "" {
		return errors.New("verification code is required")
	}
	return nil
}

type UserPasswordResetDTO struct {
	PasswordChangeCode string `json:"password_change_code"`
	NewPassword        string `json:"new_password"`
}

func (d UserPasswordResetDTO) Validate() error {
	if d.PasswordChangeCode == "" {
		return errors.New("password change code is required")
	}
	if d.NewPassword == "" {
		return errors.New("new password is required")
	}
	if len(d.NewPassword) < 6 {
		return errors.New("new password must be at least 6 characters")
	}
	return nil
}
