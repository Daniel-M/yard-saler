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

func (h *MessagingHandler) GetConversations(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	threads, err := h.service.GetConversations(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	threadDTOs := make([]dto.ThreadDTO, 0, len(threads))
	for _, t := range threads {
		threadDTOs = append(threadDTOs, dto.ThreadDTO{
			ID:            t.ID,
			ProductID:     t.ProductID,
			ProductName:   t.ProductName,
			ProductImage:  t.ProductImage,
			OtherUserID:   t.OtherUserID,
			OtherUserName: t.OtherUserName,
			LastMessage:   t.LastMessage,
			LastMessageAt: t.LastMessageAt,
			UnreadCount:   t.UnreadCount,
			ProductCode:   t.ProductCode,
			EventCode:     t.EventCode,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.GetConversationsResponseDTO{Threads: threadDTOs})
}

func (h *MessagingHandler) GetMessageHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	threadID := r.PathValue("thread_id")
	if threadID == "" {
		http.Error(w, "missing thread id", http.StatusBadRequest)
		return
	}

	msgs, thread, otherUserName, productName, productCode, eventCode, err := h.service.GetMessageHistory(r.Context(), userID, threadID)
	if err != nil {
		if errors.Is(err, messaging.ErrThreadNotFound) {
			http.Error(w, "thread not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, messaging.ErrUnauthorized) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	msgDTOs := make([]dto.MessageDTO, 0, len(msgs))
	for _, m := range msgs {
		msgDTOs = append(msgDTOs, dto.MessageDTO{
			ID:        m.ID,
			SenderID:  m.SenderID,
			Content:   m.Content,
			CreatedAt: m.CreatedAt,
			ReadAt:    m.ReadAt,
		})
	}

	response := dto.MessageHistoryResponseDTO{
		ThreadID:      thread.ID,
		ProductID:     thread.ProductID,
		ProductName:   productName,
		ProductCode:   productCode,
		EventCode:     eventCode,
		OtherUserName: otherUserName,
		Messages:      msgDTOs,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (h *MessagingHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	threadID := r.PathValue("thread_id")
	if threadID == "" {
		http.Error(w, "missing thread id", http.StatusBadRequest)
		return
	}

	var d dto.SendMessageDTO
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	msg, productCode, eventCode, err := h.service.SendMessage(r.Context(), userID, threadID, d.Content)
	if err != nil {
		if errors.Is(err, messaging.ErrThreadNotFound) {
			http.Error(w, "thread not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, messaging.ErrUnauthorized) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		if errors.Is(err, messaging.ErrEmptyMessage) {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := dto.SendMessageResponseDTO{
		ID:          msg.ID,
		ThreadID:    msg.ThreadID,
		SenderID:    msg.SenderID,
		Content:     msg.Content,
		CreatedAt:   msg.CreatedAt,
		ReadAt:      msg.ReadAt,
		EventCode:   eventCode,
		ProductCode: productCode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func (h *MessagingHandler) MarkThreadRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	threadID := r.PathValue("thread_id")
	if threadID == "" {
		http.Error(w, "missing thread id", http.StatusBadRequest)
		return
	}

	count, err := h.service.MarkThreadRead(r.Context(), userID, threadID)
	if err != nil {
		if errors.Is(err, messaging.ErrThreadNotFound) {
			http.Error(w, "thread not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, messaging.ErrUnauthorized) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.MarkReadResponseDTO{
		Status:      "success",
		MarkedCount: count,
	})
}

func (h *MessagingHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	count, err := h.service.GetUnreadCount(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.UnreadCountResponseDTO{
		UnreadCount: count,
	})
}
