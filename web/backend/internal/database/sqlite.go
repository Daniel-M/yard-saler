package database

import (
	"database/sql"
	"fmt"
	"io/fs"
	"sort"
	"strings"

	"github.com/danielmejiar/whale_shark/web/backend/migrations"
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
		content, err := fs.ReadFile(migrations.Files, name)
		if err != nil {
			return fmt.Errorf("failed to read embedded migration file %s: %w", name)
		}

		if _, err = db.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", name, err)
		}
	}

	return nil
}
