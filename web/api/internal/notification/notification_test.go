package notification_test

import (
	"context"
	"database/sql"
	"testing"

	"github.com/Daniel-M/ys-api/internal/database"
	"github.com/Daniel-M/ys-api/internal/notification"
	_ "github.com/mattn/go-sqlite3"
)

func setupTestDB(t *testing.T) *sql.DB {
	db, err := database.NewSqliteConnection(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	if err := database.RunMigrations(db); err != nil {
		db.Close()
		t.Fatalf("failed to run migrations: %v", err)
	}

	return db
}

func TestNotificationService(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := notification.NewSqliteRepository(db)
	svc := notification.NewService(repo)

	ctx := context.Background()
	userID := "user_1"

	// 1. Create a notification
	n, err := svc.CreateNotification(ctx, userID, "Test Title", "Test Content", "message", "ref_1")
	if err != nil {
		t.Fatalf("failed to create notification: %v", err)
	}

	if n.Title != "Test Title" {
		t.Errorf("expected Title %q, got %q", "Test Title", n.Title)
	}
	if n.IsRead {
		t.Error("expected new notification to be unread")
	}

	// 2. Fetch notifications
	list, err := svc.GetNotifications(ctx, userID)
	if err != nil {
		t.Fatalf("failed to get notifications: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 notification, got %d", len(list))
	}
	if list[0].ID != n.ID {
		t.Errorf("expected ID %q, got %q", n.ID, list[0].ID)
	}

	// 3. Mark as read (wrong user)
	_, err = svc.MarkAsRead(ctx, "user_wrong", n.ID)
	if err == nil {
		t.Error("expected error when marking read by unauthorized user, got nil")
	}

	// 4. Mark as read (correct user)
	count, err := svc.MarkAsRead(ctx, userID, n.ID)
	if err != nil {
		t.Fatalf("failed to mark notification as read: %v", err)
	}
	if count != 1 {
		t.Errorf("expected 1 row affected, got %d", count)
	}

	// 5. Check if it is read
	list, err = svc.GetNotifications(ctx, userID)
	if err != nil {
		t.Fatalf("failed to get notifications: %v", err)
	}
	if !list[0].IsRead {
		t.Error("expected notification to be read")
	}
	if list[0].ReadAt == nil {
		t.Error("expected read_at to be set")
	}

	// 6. Create another one and mark all as read
	_, err = svc.CreateNotification(ctx, userID, "Title 2", "Content 2", "message", "ref_2")
	if err != nil {
		t.Fatalf("failed to create second notification: %v", err)
	}

	countAll, err := svc.MarkAllAsRead(ctx, userID)
	if err != nil {
		t.Fatalf("failed to mark all as read: %v", err)
	}
	if countAll != 1 {
		t.Errorf("expected 1 row affected, got %d", countAll)
	}

	list, err = svc.GetNotifications(ctx, userID)
	if err != nil {
		t.Fatalf("failed to get notifications: %v", err)
	}
	for _, notificationItem := range list {
		if !notificationItem.IsRead {
			t.Errorf("expected notification %s to be read", notificationItem.ID)
		}
	}
}
