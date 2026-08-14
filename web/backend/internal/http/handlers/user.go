package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/danielmejiar/whale_shark/web/backend/internal/domain"
	"github.com/danielmejiar/whale_shark/web/backend/internal/user"
)

// UserHandler handles user-related HTTP requests.
type UserHandler struct {
	service *user.UserService
}

// NewUserHandler instantiates a new UserHandler.
func NewUserHandler(svc *user.UserService) *UserHandler {
	return &UserHandler{service: svc}
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
