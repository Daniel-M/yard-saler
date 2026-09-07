package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/notification"
)

type NotificationHandler struct {
	service *notification.Service
}

func NewNotificationHandler(service *notification.Service) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	list, err := h.service.GetNotifications(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dtos := make([]dto.NotificationDTO, 0, len(list))
	for _, n := range list {
		dtos = append(dtos, dto.NotificationDTO{
			ID:          n.ID,
			UserID:      n.UserID,
			Title:       n.Title,
			Content:     n.Content,
			Type:        n.Type,
			ReferenceID: n.ReferenceID,
			IsRead:      n.IsRead,
			CreatedAt:   n.CreatedAt,
			ReadAt:      n.ReadAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.GetNotificationsResponseDTO{Notifications: dtos})
}

func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing notification id", http.StatusBadRequest)
		return
	}

	_, err := h.service.MarkAsRead(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, notification.ErrNotFound) {
			http.Error(w, "notification not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, notification.ErrUnauthorized) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.NotificationStatusResponseDTO{Status: "success"})
}

func (h *NotificationHandler) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	_, err := h.service.MarkAllAsRead(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.NotificationStatusResponseDTO{Status: "success"})
}
