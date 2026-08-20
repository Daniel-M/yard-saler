package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Daniel-M/ys-api/internal/cart"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/middleware"
)

type CartHandler struct {
	service *cart.Service
}

func NewCartHandler(service *cart.Service) *CartHandler {
	return &CartHandler{service: service}
}

func (h *CartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	items, err := h.service.GetCartContents(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	itemsDTO := make([]dto.CartItemDTO, len(items))
	for i, item := range items {
		itemsDTO[i] = dto.CartItemDTO{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductCode: item.ProductCode,
			Name:        item.Name,
			Price:       item.Price,
			Quantity:    item.Quantity,
			Images:      item.Images,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.CartContentsDTO{Items: itemsDTO})
}

func (h *CartHandler) AddToCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var d dto.AddToCartDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if d.ProductID == "" || d.Quantity < 1 {
		http.Error(w, "invalid product_id or quantity", http.StatusBadRequest)
		return
	}

	item, err := h.service.AddToCart(r.Context(), userID, d)
	if err != nil {
		if errors.Is(err, cart.ErrProductNotFound) {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         item.ID,
		"product_id": item.ProductID,
		"quantity":   item.Quantity,
	})
}

func (h *CartHandler) UpdateCartItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing item ID", http.StatusBadRequest)
		return
	}

	var d dto.UpdateCartItemDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if d.Quantity < 1 {
		http.Error(w, "quantity must be at least 1", http.StatusBadRequest)
		return
	}

	item, err := h.service.UpdateCartItemQuantity(r.Context(), userID, id, d.Quantity)
	if err != nil {
		if errors.Is(err, cart.ErrCartItemNotFound) {
			http.Error(w, "cart item not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, cart.ErrForbidden) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":       item.ID,
		"quantity": item.Quantity,
	})
}

func (h *CartHandler) RemoveCartItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing item ID", http.StatusBadRequest)
		return
	}

	err := h.service.RemoveFromCart(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, cart.ErrCartItemNotFound) {
			http.Error(w, "cart item not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, cart.ErrForbidden) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
