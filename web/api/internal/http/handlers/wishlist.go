package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/wishlist"
)

type WishlistHandler struct {
	service *wishlist.Service
}

func NewWishlistHandler(service *wishlist.Service) *WishlistHandler {
	return &WishlistHandler{service: service}
}

func (h *WishlistHandler) GetWishlist(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	items, err := h.service.GetWishlistContents(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	itemsDTO := make([]dto.WishlistItemDTO, len(items))
	for i, item := range items {
		itemsDTO[i] = dto.WishlistItemDTO{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductCode: item.ProductCode,
			Name:        item.Name,
			Price:       item.Price,
			Images:      item.Images,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.WishlistContentsDTO{Items: itemsDTO})
}

func (h *WishlistHandler) AddToWishlist(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var d dto.AddToWishlistDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if d.ProductID == "" {
		http.Error(w, "invalid product_id", http.StatusBadRequest)
		return
	}

	item, err := h.service.AddToWishlist(r.Context(), userID, d)
	if err != nil {
		if errors.Is(err, wishlist.ErrProductNotFound) {
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
	})
}

func (h *WishlistHandler) RemoveWishlistItem(w http.ResponseWriter, r *http.Request) {
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

	err := h.service.RemoveFromWishlist(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, wishlist.ErrWishlistItemNotFound) {
			http.Error(w, "wishlist item not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, wishlist.ErrForbidden) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
