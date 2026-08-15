package database

import (
	"database/sql"
	"fmt"
	"io/fs"
	"log/slog"
	"sort"
	"strings"

	"github.com/Daniel-M/ys-api/migrations"
	_ "github.com/mattn/go-sqlite3"
)

// NewSqliteConnection opens a connection to the SQLite database and pings it to verify access.
func NewSqliteConnection(dsn string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping sqlite database: %w", err)
	}

	return db, nil
}

// RunMigrations executes all embedded SQL migration scripts (*.up.sql) in alphabetical order.
func RunMigrations(db *sql.DB) error {
	// Create migration tracking table if not exists
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version TEXT PRIMARY KEY
	);`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// Auto-seed migration tracker for existing databases
	var hasPasswordHash bool
	infoRows, err := db.Query("PRAGMA table_info(users)")
	if err == nil {
		for infoRows.Next() {
			var cid int
			var name, ctype string
			var notnull, pk int
			var dfltVal interface{}
			if err := infoRows.Scan(&cid, &name, &ctype, &notnull, &dfltVal, &pk); err == nil {
				if name == "password_hash" {
					hasPasswordHash = true
				}
			}
		}
		infoRows.Close()
	}

	if hasPasswordHash {
		_, _ = db.Exec("INSERT OR IGNORE INTO schema_migrations (version) VALUES ('000001_create_users_table.up.sql')")
		_, _ = db.Exec("INSERT OR IGNORE INTO schema_migrations (version) VALUES ('000002_add_user_fields.up.sql')")
	}

	var hasUserIdentitiesCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='user_identities'").Scan(&hasUserIdentitiesCount); err == nil && hasUserIdentitiesCount > 0 {
		_, _ = db.Exec("INSERT OR IGNORE INTO schema_migrations (version) VALUES ('000003_create_user_identities_table.up.sql')")
	}

	// Read applied migrations
	rows, err := db.Query("SELECT version FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("failed to query applied migrations: %w", err)
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return fmt.Errorf("failed to scan migration version: %w", err)
		}
		applied[v] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("failed during migrations row iteration: %w", err)
	}

	entries, err := fs.ReadDir(migrations.Files, ".")
	if err != nil {
		return fmt.Errorf("failed to read embedded migrations directory: %w", err)
	}

	var sqlFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			sqlFiles = append(sqlFiles, entry.Name())
		}
	}
	sort.Strings(sqlFiles)

	for _, name := range sqlFiles {
		if applied[name] {
			continue
		}

		content, err := fs.ReadFile(migrations.Files, name)
		if err != nil {
			return fmt.Errorf("failed to read embedded migration file %s: %w", name, err)
		}

		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction for migration %s: %w", name, err)
		}

		if _, err = tx.Exec(string(content)); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %s: %w", name, err)
		}

		if _, err = tx.Exec("INSERT INTO schema_migrations (version) VALUES (?)", name); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", name, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit transaction for migration %s: %w", name, err)
		}
		slog.Info("Successfully applied migration", slog.String("name", name))
	}

	return nil
}
