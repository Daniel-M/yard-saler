package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/Daniel-M/ys-api/internal/auth"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/yard_sale"
)

type YardSaleHandler struct {
	service     *yard_sale.Service
	tokenIssuer auth.AccessTokenIssuer
}

func NewYardSaleHandler(service *yard_sale.Service, tokenIssuer auth.AccessTokenIssuer) *YardSaleHandler {
	return &YardSaleHandler{
		service:     service,
		tokenIssuer: tokenIssuer,
	}
}

func (h *YardSaleHandler) getOptionalUserID(r *http.Request) string {
	if userID, ok := middleware.GetUserID(r.Context()); ok && userID != "" {
		return userID
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}

	userID, _, err := h.tokenIssuer.ParseAndValidate(parts[1])
	if err != nil {
		return ""
	}
	return userID
}

func (h *YardSaleHandler) CreateYardSale(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var d dto.CreateYardSaleDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := d.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ys, err := h.service.CreateYardSale(r.Context(), userID, d)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dtoOut := dto.YardSaleDTO{
		ID:          ys.ID,
		UserID:      ys.UserID,
		Title:       ys.Title,
		Description: ys.Description,
		Location:    ys.Location,
		StartDate:   ys.StartDate,
		EndDate:     ys.EndDate,
		CreatedAt:   ys.CreatedAt,
		UpdatedAt:   ys.UpdatedAt,
		EventCode:   ys.EventCode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(dtoOut)
}

func (h *YardSaleHandler) GetYardSale(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing yard sale ID", http.StatusBadRequest)
		return
	}

	ys, prods, err := h.service.GetYardSaleDetail(r.Context(), id)
	if err != nil {
		if errors.Is(err, yard_sale.ErrYardSaleNotFound) {
			http.Error(w, "yard sale not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userID := h.getOptionalUserID(r)
	isOwner := userID != "" && userID == ys.UserID

	productsDTO := make([]dto.ProductDTO, 0, len(prods))
	for _, p := range prods {
		if p.Status == "sold" && !isOwner {
			continue
		}
		productsDTO = append(productsDTO, dto.ProductDTO{
			ID:          p.ID,
			YardSaleID:  p.YardSaleID,
			Name:        p.Name,
			Description: p.Description,
			Price:       p.Price,
			Condition:   p.Condition,
			Status:      p.Status,
			Images:      p.Images,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
			ProductCode: p.ProductCode,
		})
	}

	dtoOut := dto.YardSaleDetailDTO{
		ID:          ys.ID,
		UserID:      ys.UserID,
		Title:       ys.Title,
		Description: ys.Description,
		Location:    ys.Location,
		StartDate:   ys.StartDate,
		EndDate:     ys.EndDate,
		CreatedAt:   ys.CreatedAt,
		UpdatedAt:   ys.UpdatedAt,
		EventCode:   ys.EventCode,
		Products:    productsDTO,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dtoOut)
}

func (h *YardSaleHandler) GetPublicYardSaleByEventCode(w http.ResponseWriter, r *http.Request) {
	eventCode := r.PathValue("event_code")
	if eventCode == "" {
		http.Error(w, "missing event code", http.StatusBadRequest)
		return
	}

	ys, prods, err := h.service.GetYardSaleByEventCode(r.Context(), eventCode)
	if err != nil {
		if errors.Is(err, yard_sale.ErrYardSaleNotFound) {
			http.Error(w, "yard sale not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userID := h.getOptionalUserID(r)
	isOwner := userID != "" && userID == ys.UserID

	productsDTO := make([]dto.ProductDTO, 0, len(prods))
	for _, p := range prods {
		if p.Status == "sold" && !isOwner {
			continue
		}
		productsDTO = append(productsDTO, dto.ProductDTO{
			ID:          p.ID,
			YardSaleID:  p.YardSaleID,
			Name:        p.Name,
			Description: p.Description,
			Price:       p.Price,
			Condition:   p.Condition,
			Status:      p.Status,
			Images:      p.Images,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
			ProductCode: p.ProductCode,
		})
	}

	dtoOut := dto.YardSaleDetailDTO{
		ID:          ys.ID,
		UserID:      ys.UserID,
		Title:       ys.Title,
		Description: ys.Description,
		Location:    ys.Location,
		StartDate:   ys.StartDate,
		EndDate:     ys.EndDate,
		CreatedAt:   ys.CreatedAt,
		UpdatedAt:   ys.UpdatedAt,
		EventCode:   ys.EventCode,
		Products:    productsDTO,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dtoOut)
}

// GetProjectedEarnings returns the projected earnings and target.
func (h *YardSaleHandler) GetProjectedEarnings(w http.ResponseWriter, r *http.Request) {
	// Ensure user is authenticated
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	dtoOut, err := h.service.ProjectedEarnings(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(dtoOut)
}

func (h *YardSaleHandler) GetPublicProductByCodes(w http.ResponseWriter, r *http.Request) {
	eventCode := r.PathValue("event_code")
	productCode := r.PathValue("product_code")
	if eventCode == "" || productCode == "" {
		http.Error(w, "missing event code or product code", http.StatusBadRequest)
		return
	}

	prod, err := h.service.GetProductByCodes(r.Context(), eventCode, productCode)
	if err != nil {
		if errors.Is(err, yard_sale.ErrProductNotFound) {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if prod.Status == "sold" {
		userID := h.getOptionalUserID(r)
		ys, _, err := h.service.GetYardSaleDetail(r.Context(), prod.YardSaleID)
		if err != nil || ys == nil || ys.UserID != userID {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
	}

	dtoOut := dto.ProductDTO{
		ID:           prod.ID,
		YardSaleID:   prod.YardSaleID,
		YardSaleCode: eventCode,
		Name:         prod.Name,
		Description:  prod.Description,
		Price:        prod.Price,
		Condition:    prod.Condition,
		Status:       prod.Status,
		Images:       prod.Images,
		CreatedAt:    prod.CreatedAt,
		UpdatedAt:    prod.UpdatedAt,
		ProductCode:  prod.ProductCode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dtoOut)
}

func (h *YardSaleHandler) ListYardSales(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
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

	list, total, err := h.service.ListYardSales(r.Context(), userID, offset, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	yardSalesDTO := make([]dto.YardSaleDTO, len(list))
	for i, ys := range list {
		yardSalesDTO[i] = dto.YardSaleDTO{
			ID:          ys.ID,
			UserID:      ys.UserID,
			Title:       ys.Title,
			Description: ys.Description,
			Location:    ys.Location,
			StartDate:   ys.StartDate,
			EndDate:     ys.EndDate,
			CreatedAt:   ys.CreatedAt,
			UpdatedAt:   ys.UpdatedAt,
			EventCode:   ys.EventCode,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.YardSalesListDTO{
		YardSales: yardSalesDTO,
		Total:     total,
		Offset:    offset,
		Limit:     limit,
	})
}

func (h *YardSaleHandler) ListMyYardSales(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

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

	list, total, err := h.service.ListYardSales(r.Context(), userID, offset, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	yardSalesDTO := make([]dto.YardSaleDTO, len(list))
	for i, ys := range list {
		yardSalesDTO[i] = dto.YardSaleDTO{
			ID:          ys.ID,
			UserID:      ys.UserID,
			Title:       ys.Title,
			Description: ys.Description,
			Location:    ys.Location,
			StartDate:   ys.StartDate,
			EndDate:     ys.EndDate,
			CreatedAt:   ys.CreatedAt,
			UpdatedAt:   ys.UpdatedAt,
			EventCode:   ys.EventCode,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.YardSalesListDTO{
		YardSales: yardSalesDTO,
		Total:     total,
		Offset:    offset,
		Limit:     limit,
	})
}

func (h *YardSaleHandler) AddProduct(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	yardSaleID := r.PathValue("id")
	if yardSaleID == "" {
		http.Error(w, "missing yard sale ID", http.StatusBadRequest)
		return
	}

	var d dto.CreateProductDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := d.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	prod, err := h.service.AddProduct(r.Context(), userID, yardSaleID, d)
	if err != nil {
		if errors.Is(err, yard_sale.ErrYardSaleNotFound) {
			http.Error(w, "yard sale not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, yard_sale.ErrForbidden) {
			http.Error(w, "forbidden: you do not own this yard sale", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dtoOut := dto.ProductDTO{
		ID:          prod.ID,
		YardSaleID:  prod.YardSaleID,
		Name:        prod.Name,
		Description: prod.Description,
		Price:       prod.Price,
		Condition:   prod.Condition,
		Status:      prod.Status,
		Images:      prod.Images,
		CreatedAt:   prod.CreatedAt,
		UpdatedAt:   prod.UpdatedAt,
		ProductCode: prod.ProductCode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(dtoOut)
}

func (h *YardSaleHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	yardSaleID := r.PathValue("id")
	productID := r.PathValue("product_id")
	if yardSaleID == "" || productID == "" {
		http.Error(w, "missing yard sale ID or product ID", http.StatusBadRequest)
		return
	}

	var d dto.CreateProductDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := d.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	prod, err := h.service.UpdateProduct(r.Context(), userID, yardSaleID, productID, d)
	if err != nil {
		if errors.Is(err, yard_sale.ErrYardSaleNotFound) {
			http.Error(w, "yard sale not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, yard_sale.ErrProductNotFound) {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, yard_sale.ErrForbidden) {
			http.Error(w, "forbidden: you do not own this yard sale", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dtoOut := dto.ProductDTO{
		ID:          prod.ID,
		YardSaleID:  prod.YardSaleID,
		Name:        prod.Name,
		Description: prod.Description,
		Price:       prod.Price,
		Condition:   prod.Condition,
		Status:      prod.Status,
		Images:      prod.Images,
		CreatedAt:   prod.CreatedAt,
		UpdatedAt:   prod.UpdatedAt,
		ProductCode: prod.ProductCode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dtoOut)
}
