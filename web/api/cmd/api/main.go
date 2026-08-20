package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Daniel-M/ys-api/internal/auth"
	"github.com/Daniel-M/ys-api/internal/cart"
	"github.com/Daniel-M/ys-api/internal/config"
	"github.com/Daniel-M/ys-api/internal/database"
	"github.com/Daniel-M/ys-api/internal/http/handlers"
	"github.com/Daniel-M/ys-api/internal/logger"
	"github.com/Daniel-M/ys-api/internal/messaging"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/user"
	"github.com/Daniel-M/ys-api/internal/wishlist"
	"github.com/Daniel-M/ys-api/internal/yard_sale"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// 1. Load configuration
	cfg, err := config.LoadConfig(".")
	if err != nil {
		slog.Error("Failed to load configuration", slog.Any("error", err))
		os.Exit(1)
	}

	// 1b. Initialize logger
	logger.Setup(cfg.Logging.Level)
	slog.Info("Loaded config successfully", slog.String("database_driver", cfg.Database.Driver))

	// 2. Connect to database
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "whale_shark.db"
	}

	slog.Info("Connecting to SQLite database", slog.String("path", dbPath))
	db, err := database.NewSqliteConnection(dbPath)
	if err != nil {
		slog.Error("Failed to establish database connection", slog.Any("error", err))
		os.Exit(1)
	}
	defer db.Close()

	// 3. Run database migrations
	slog.Info("Applying database migrations")
	if err := database.RunMigrations(db); err != nil {
		slog.Error("Failed to execute migrations", slog.Any("error", err))
		os.Exit(1)
	}
	slog.Info("Database schema up to date")

	// 4. Initialize token issuer
	tokenIssuer, err := auth.NewAccessTokenIssuer(cfg.Auth.PasetoKey)
	if err != nil {
		slog.Error("Failed to initialize access token issuer", slog.Any("error", err))
		os.Exit(1)
	}

	// 5. Setup repositories, services, and handlers
	userRepo := user.NewSqliteUserRepository(db)
	userService := user.NewUserService(userRepo)
	userHandler := handlers.NewUserHandler(userService, tokenIssuer)

	ysRepo := yard_sale.NewSqliteRepository(db)
	ysService := yard_sale.NewService(ysRepo)
	ysHandler := handlers.NewYardSaleHandler(ysService)

	cartRepo := cart.NewSqliteRepository(db)
	cartService := cart.NewService(cartRepo, ysRepo)
	cartHandler := handlers.NewCartHandler(cartService)

	wishRepo := wishlist.NewSqliteRepository(db)
	wishService := wishlist.NewService(wishRepo, ysRepo)
	wishHandler := handlers.NewWishlistHandler(wishService)

	msgRepo := messaging.NewSqliteRepository(db)
	msgService := messaging.NewService(msgRepo, ysRepo)
	msgHandler := handlers.NewMessagingHandler(msgService)

	uploadHandler := handlers.NewUploadHandler("uploads")

	// 6. Router setup
	mux := http.NewServeMux()
	mux.HandleFunc("POST /users", userHandler.CreateUser)
	mux.HandleFunc("GET /users", userHandler.ListUsers)
	mux.HandleFunc("GET /users/{id}", userHandler.GetUserByID)
	mux.HandleFunc("PUT /users/{id}", userHandler.UpdateUser)
	mux.HandleFunc("DELETE /users/{id}", userHandler.DeleteUser)

	// New User workflows
	mux.HandleFunc("POST /user/auth/verify", userHandler.Verify)
	mux.HandleFunc("POST /user/auth/password-reset", userHandler.PasswordReset)
	mux.HandleFunc("POST /user/auth/login", userHandler.Login)
	mux.HandleFunc("POST /user/auth/oauth/google", userHandler.OAuthGoogle)
	mux.HandleFunc("POST /user/details/register", userHandler.PreRegister)

	// Health
	mux.HandleFunc("GET /health", handlers.HealthCheck)

	// PASETO protected routes
	authMiddleware := middleware.Auth(tokenIssuer)
	mux.Handle("PUT /user/details", authMiddleware(http.HandlerFunc(userHandler.EditDetails)))
	mux.Handle("GET /user/me", authMiddleware(http.HandlerFunc(userHandler.GetProfile)))

	// User setting update
	mux.Handle("PUT /api/users/me", authMiddleware(http.HandlerFunc(userHandler.UpdateSettings)))

	// File Upload
	mux.Handle("POST /api/upload", authMiddleware(http.HandlerFunc(uploadHandler.UploadFile)))

	// Yard Sale Event Endpoints
	mux.Handle("POST /api/yard-sales", authMiddleware(http.HandlerFunc(ysHandler.CreateYardSale)))
	mux.Handle("GET /api/yard-sales/me", authMiddleware(http.HandlerFunc(ysHandler.ListMyYardSales)))
	mux.HandleFunc("GET /api/yard-sales", ysHandler.ListYardSales)
	mux.HandleFunc("GET /api/yard-sales/{id}", ysHandler.GetYardSale)
	mux.Handle("POST /api/yard-sales/{id}/products", authMiddleware(http.HandlerFunc(ysHandler.AddProduct)))

	// --- Tracks B & C endpoints with clean /api/ prefix ---

	// Public Event & Product Resolution
	mux.HandleFunc("GET /api/public/ys/e/{event_code}", ysHandler.GetPublicYardSaleByEventCode)
	mux.HandleFunc("GET /api/public/ys/e/{event_code}/p/{product_code}", ysHandler.GetPublicProductByCodes)

	// Cart Endpoints
	mux.Handle("GET /api/cart", authMiddleware(http.HandlerFunc(cartHandler.GetCart)))
	mux.Handle("POST /api/cart", authMiddleware(http.HandlerFunc(cartHandler.AddToCart)))
	mux.Handle("PATCH /api/cart/items/{id}", authMiddleware(http.HandlerFunc(cartHandler.UpdateCartItem)))
	mux.Handle("DELETE /api/cart/items/{id}", authMiddleware(http.HandlerFunc(cartHandler.RemoveCartItem)))

	// Wishlist Endpoints
	mux.Handle("GET /api/wishlist", authMiddleware(http.HandlerFunc(wishHandler.GetWishlist)))
	mux.Handle("POST /api/wishlist", authMiddleware(http.HandlerFunc(wishHandler.AddToWishlist)))
	mux.Handle("DELETE /api/wishlist/items/{id}", authMiddleware(http.HandlerFunc(wishHandler.RemoveWishlistItem)))

	// Messaging Threads Endpoints
	mux.Handle("POST /api/messages/threads", authMiddleware(http.HandlerFunc(msgHandler.StartThread)))

	// Static uploads directory serving
	fsHandler := http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads")))
	mux.Handle("GET /uploads/", fsHandler)

	handler := middleware.Chain(mux, middleware.Logger, middleware.CORS(cfg.CORS.AllowedOrigins))

	serverPort := cfg.Server.Port
	if os.Getenv("PORT") != "" {
		serverPort = os.Getenv("PORT")
	}

	srv := &http.Server{
		Addr:         ":" + serverPort,
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 7. Start server
	go func() {
		slog.Info("Starting API server", slog.String("port", serverPort))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Could not listen on port", slog.String("port", serverPort), slog.Any("error", err))
			os.Exit(1)
		}
	}()

	// 8. Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	<-stop
	slog.Info("Shutting down API server gracefully")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", slog.Any("error", err))
		os.Exit(1)
	}

	slog.Info("Server exited cleanly")
}
