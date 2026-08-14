package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/Daniel-M/ys-api/internal/domain"
)

// SqliteUserRepository implements the UserRepository interface for SQLite databases.
type SqliteUserRepository struct {
	db *sql.DB
}

// NewSqliteUserRepository creates a new SqliteUserRepository instance.
func NewSqliteUserRepository(db *sql.DB) *SqliteUserRepository {
	return &SqliteUserRepository{db: db}
}

// FindByID retrieves a single User by ID.
func (r *SqliteUserRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, role, created_at, updated_at 
		FROM users 
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var u domain.User
	err := row.Scan(&u.ID, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch user by id from sqlite: %w", err)
	}
	return &u, nil
}

// FindByEmail retrieves a single User by email address.
func (r *SqliteUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, email, password, first_name, last_name, role, created_at, updated_at 
		FROM users 
		WHERE email = ?
	`
	row := r.db.QueryRowContext(ctx, query, email)
	var u domain.User
	err := row.Scan(&u.ID, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch user by email from sqlite: %w", err)
	}
	return &u, nil
}

// Create inserts a new User into the database.
func (r *SqliteUserRepository) Create(ctx context.Context, u *domain.User) (*domain.User, error) {
	query := `
		INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query, u.ID, u.Email, u.Password, u.FirstName, u.LastName, u.Role, u.CreatedAt, u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert user into sqlite: %w", err)
	}
	return u, nil
}

// Update changes properties of an existing User.
func (r *SqliteUserRepository) Update(ctx context.Context, u *domain.User) (*domain.User, error) {
	query := `
		UPDATE users 
		SET email = ?, password = ?, first_name = ?, last_name = ?, role = ?, updated_at = ? 
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, u.Email, u.Password, u.FirstName, u.LastName, u.Role, u.UpdatedAt, u.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to update user in sqlite: %w", err)
	}
	return u, nil
}

// Delete removes a User record by ID.
func (r *SqliteUserRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM users WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user from sqlite: %w", err)
	}
	return nil
}

// List returns a paginated list of Users along with the total count.
func (r *SqliteUserRepository) List(ctx context.Context, offset, limit int) ([]*domain.User, int, error) {
	countQuery := `SELECT COUNT(*) FROM users`
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count users in sqlite: %w", err)
	}

	query := `
		SELECT id, email, password, first_name, last_name, role, created_at, updated_at 
		FROM users 
		LIMIT ? OFFSET ?
	`
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to select users from sqlite: %w", err)
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var u domain.User
		err := rows.Scan(&u.ID, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.Role, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user from sqlite row: %w", err)
		}
		users = append(users, &u)
	}

	return users, total, nil
}
