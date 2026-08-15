package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Daniel-M/ys-api/internal/auth"
	"github.com/Daniel-M/ys-api/internal/config"
	"github.com/Daniel-M/ys-api/internal/database"
	"github.com/Daniel-M/ys-api/internal/http/handlers"
	"github.com/Daniel-M/ys-api/internal/middleware"
	"github.com/Daniel-M/ys-api/internal/user"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// 1. Load configuration
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	log.Printf("Loaded config successfully. Database Driver: %s", cfg.Database.Driver)

	// 2. Connect to database
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "whale_shark.db"
	}

	log.Printf("Connecting to SQLite database: %s", dbPath)
	db, err := database.NewSqliteConnection(dbPath)
	if err != nil {
		log.Fatalf("Failed to establish database connection: %v", err)
	}
	defer db.Close()

	// 3. Run database migrations
	log.Println("Applying database migrations...")
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to execute migrations: %v", err)
	}
	log.Println("Database schema up to date.")

	// 4. Initialize token issuer
	tokenIssuer, err := auth.NewAccessTokenIssuer(cfg.Auth.PasetoKey)
	if err != nil {
		log.Fatalf("Failed to initialize access token issuer: %v", err)
	}
	_ = tokenIssuer // Will be used in handlers or middleware for token validation/minting

	// 5. Setup repositories, services, and handlers
	userRepo := user.NewSqliteUserRepository(db)
	userService := user.NewUserService(userRepo)
	userHandler := handlers.NewUserHandler(userService)

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

	// PASETO protected route
	authMiddleware := middleware.Auth(tokenIssuer)
	mux.Handle("PUT /user/edit-details", authMiddleware(http.HandlerFunc(userHandler.EditDetails)))

	handler := middleware.Chain(mux, middleware.Logger)

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
		log.Printf("Starting API server on port %s", serverPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Could not listen on %s: %v", serverPort, err)
		}
	}()

	// 8. Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	<-stop
	log.Println("Shutting down API server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited cleanly.")
}
