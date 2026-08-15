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
	"github.com/Daniel-M/ys-api/internal/config"
	"github.com/Daniel-M/ys-api/internal/database"
	"github.com/Daniel-M/ys-api/internal/http/handlers"
	"github.com/Daniel-M/ys-api/internal/logger"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/user"
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

	// 6. Router setup
	mux := http.NewServeMux()
	mux.HandleFunc("POST /users", userHandler.CreateUser)
	mux.HandleFunc("GET /users", userHandler.ListUsers)
	mux.HandleFunc("GET /users/{id}", userHandler.GetUserByID)
	mux.HandleFunc("PUT /users/{id}", userHandler.UpdateUser)
	mux.HandleFunc("DELETE /users/{id}", userHandler.DeleteUser)

	// New User workflows
	mux.HandleFunc("POST /user/pre-register", userHandler.PreRegister)
	mux.HandleFunc("POST /user/verify", userHandler.Verify)
	mux.HandleFunc("POST /user/password-reset", userHandler.PasswordReset)
	mux.HandleFunc("POST /user/login", userHandler.Login)
	mux.HandleFunc("POST /user/oauth/google", userHandler.OAuthGoogle)

	// PASETO protected route
	authMiddleware := middleware.Auth(tokenIssuer)
	mux.Handle("PUT /user/edit-details", authMiddleware(http.HandlerFunc(userHandler.EditDetails)))

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
