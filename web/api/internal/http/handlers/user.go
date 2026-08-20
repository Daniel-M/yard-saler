package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Daniel-M/ys-api/internal/auth"
	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/user"
)

// UserHandler handles user-related HTTP requests.
type UserHandler struct {
	service     *user.UserService
	tokenIssuer auth.AccessTokenIssuer
}

// NewUserHandler instantiates a new UserHandler.
func NewUserHandler(svc *user.UserService, issuer auth.AccessTokenIssuer) *UserHandler {
	return &UserHandler{
		service:     svc,
		tokenIssuer: issuer,
	}
}

// PreRegister handles POST /user/details/register
func (h *UserHandler) PreRegister(w http.ResponseWriter, r *http.Request) {
	var input dto.UserPreRegisterDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := input.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	created, err := h.service.PreRegisterUser(r.Context(), input)
	if err != nil {
		if errors.Is(err, user.ErrOAuthProviderExists) {
			http.Error(w, "oauth_provider_exists", http.StatusConflict)
			return
		}
		if errors.Is(err, user.ErrUserAlreadyExists) {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(created.ToDTO())
}

// Verify handles POST /user/verify
func (h *UserHandler) Verify(w http.ResponseWriter, r *http.Request) {
	var input dto.UserVerifyDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := input.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	u, err := h.service.VerifyUser(r.Context(), input)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		if errors.Is(err, user.ErrUserAlreadyVerified) {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		if errors.Is(err, user.ErrInvalidCode) {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Generate access token (e.g. 24 hours expiry)
	token, err := h.tokenIssuer.MintAccessToken(u.ID, u.Role, 24*time.Hour)
	if err != nil {
		http.Error(w, "failed to generate access token", http.StatusInternalServerError)
		return
	}

	response := dto.UserVerifyResponseDTO{
		Token: token,
		User: dto.UserVerifyResponseUser{
			ID:              u.ID,
			Email:           u.Email,
			IsVerified:      u.VerifiedAt != nil,
			ProfileComplete: u.FirstName != "" && u.LastName != "",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// EditDetails handles PUT /user/edit-details
func (h *UserHandler) EditDetails(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var input dto.UserDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := input.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	updated, err := h.service.EditUserDetails(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updated.ToDTO())
}

// PasswordReset handles POST /user/password-reset
func (h *UserHandler) PasswordReset(w http.ResponseWriter, r *http.Request) {
	var input dto.UserPasswordResetDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := input.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := h.service.PasswordReset(r.Context(), input)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		if errors.Is(err, user.ErrCodeExpired) {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// CreateUser handles POST /users
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var u domain.User
	if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	created, err := h.service.CreateUser(r.Context(), &u)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

// GetUserByID handles GET /users/{id}
func (h *UserHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing user ID", http.StatusBadRequest)
		return
	}

	u, err := h.service.GetUser(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if u == nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(u)
}

// UpdateUser handles PUT /users/{id}
func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing user ID", http.StatusBadRequest)
		return
	}

	var u domain.User
	if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	u.ID = id

	updated, err := h.service.UpdateUser(r.Context(), &u)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updated)
}

// DeleteUser handles DELETE /users/{id}
func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing user ID", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteUser(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListUsers handles GET /users
func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	offsetQuery := r.URL.Query().Get("offset")
	limitQuery := r.URL.Query().Get("limit")

	offset := 0
	limit := 10

	if val, err := strconv.Atoi(offsetQuery); err == nil && val >= 0 {
		offset = val
	}
	if val, err := strconv.Atoi(limitQuery); err == nil && val > 0 {
		limit = val
	}

	users, total, err := h.service.ListUsers(r.Context(), offset, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"users":  users,
		"total":  total,
		"offset": offset,
		"limit":  limit,
	})
}

// Login handles POST /user/login
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input dto.UserLoginDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := input.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	u, err := h.service.LoginUser(r.Context(), input.Email, input.Password)
	if err != nil {
		if errors.Is(err, user.ErrOAuthProviderRequired) {
			http.Error(w, "oauth_provider_required", http.StatusForbidden)
			return
		}
		if errors.Is(err, user.ErrInvalidCredentials) {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Generate access token (24 hours expiry)
	token, err := h.tokenIssuer.MintAccessToken(u.ID, u.Role, 24*time.Hour)
	if err != nil {
		http.Error(w, "failed to generate access token", http.StatusInternalServerError)
		return
	}

	response := dto.UserLoginResponseDTO{
		Token:    token,
		IsSignUp: u.VerifiedAt == nil,
		User: dto.LoggedUserDTO{
			ID:              u.ID,
			Email:           u.Email,
			FirstName:       u.FirstName,
			LastName:        u.LastName,
			Role:            u.Role,
			MobilePhone:     u.MobilePhone,
			IsVerified:      u.VerifiedAt != nil,
			ProfileComplete: u.FirstName != "" && u.LastName != "" && u.MobilePhone != "",
			AccountAge:      time.Since(u.CreatedAt),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// OAuthGoogle handles POST /user/oauth/google
func (h *UserHandler) OAuthGoogle(w http.ResponseWriter, r *http.Request) {
	var input dto.OAuthGoogleDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := input.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	u, err := h.service.OAuthGoogle(r.Context(), input.Credential)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Generate access token (24 hours expiry)
	token, err := h.tokenIssuer.MintAccessToken(u.ID, u.Role, 24*time.Hour)
	if err != nil {
		http.Error(w, "failed to generate access token", http.StatusInternalServerError)
		return
	}

	response := dto.UserVerifyResponseDTO{
		Token: token,
		User: dto.UserVerifyResponseUser{
			ID:              u.ID,
			Email:           u.Email,
			IsVerified:      u.VerifiedAt != nil,
			ProfileComplete: u.FirstName != "" && u.LastName != "",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetProfile handles GET /user/me
func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	u, err := h.service.GetUser(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if u == nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	displayName := strings.TrimSpace(u.FirstName + " " + u.LastName)
	if displayName == "" {
		displayName = u.Email
	}

	var initials string
	if u.FirstName != "" {
		initials += string([]rune(u.FirstName)[0])
	}
	if u.LastName != "" {
		initials += string([]rune(u.LastName)[0])
	}
	if initials == "" && u.Email != "" {
		initials = strings.ToUpper(string([]rune(u.Email)[0]))
	} else {
		initials = strings.ToUpper(initials)
	}

	profile := dto.UserProfileDTO{
		ID:          u.ID,
		DisplayName: displayName,
		Email:       u.Email,
		Initials:    initials,
		AvatarURL:   nil,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		IsVerified:  u.VerifiedAt != nil,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
		VerifiedAt:  u.VerifiedAt,
		MobilePhone: u.MobilePhone,
		Socials:     u.Socials,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}

// UpdateSettings handles PUT /api/v1/users/me
func (h *UserHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var input dto.UpdateUserSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := input.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdateUserSettings(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updated.ToDTO())
}

// HealthCheck handles GET /health
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("{}"))
}

