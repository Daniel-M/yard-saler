package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/messaging"
	"github.com/Daniel-M/ys-api/internal/middleware"
)

type MessagingHandler struct {
	service *messaging.Service
}

func NewMessagingHandler(service *messaging.Service) *MessagingHandler {
	return &MessagingHandler{service: service}
}

func (h *MessagingHandler) StartThread(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var d dto.StartThreadDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	thread, msg, err := h.service.StartThread(r.Context(), userID, d)
	if err != nil {
		if errors.Is(err, messaging.ErrEmptyMessage) || errors.Is(err, messaging.ErrSelfMessage) {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if errors.Is(err, messaging.ErrProductNotFound) {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := dto.StartThreadResponseDTO{
		ThreadID:  thread.ID,
		MessageID: msg.ID,
		BuyerID:   thread.BuyerID,
		SellerID:  thread.SellerID,
		ProductID: thread.ProductID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}
