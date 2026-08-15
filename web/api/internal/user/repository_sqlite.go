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
		SELECT id, email, password_hash, first_name, last_name, role, mobile_phone, socials, 
		       verification_code, verified_at, password_reset_code, password_reset_expires_at, 
		       created_at, updated_at 
		FROM users 
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var u domain.User
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.MobilePhone, &u.Socials,
		&u.VerificationCode, &u.VerifiedAt, &u.PasswordResetCode, &u.PasswordResetExpiresAt,
		&u.CreatedAt, &u.UpdatedAt,
	)
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
		SELECT id, email, password_hash, first_name, last_name, role, mobile_phone, socials, 
		       verification_code, verified_at, password_reset_code, password_reset_expires_at, 
		       created_at, updated_at 
		FROM users 
		WHERE email = ?
	`
	row := r.db.QueryRowContext(ctx, query, email)
	var u domain.User
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.MobilePhone, &u.Socials,
		&u.VerificationCode, &u.VerifiedAt, &u.PasswordResetCode, &u.PasswordResetExpiresAt,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch user by email from sqlite: %w", err)
	}
	return &u, nil
}

// FindByVerificationCode retrieves a single User by their verification code.
func (r *SqliteUserRepository) FindByVerificationCode(ctx context.Context, code string) (*domain.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, role, mobile_phone, socials, 
		       verification_code, verified_at, password_reset_code, password_reset_expires_at, 
		       created_at, updated_at 
		FROM users 
		WHERE verification_code = ?
	`
	row := r.db.QueryRowContext(ctx, query, code)
	var u domain.User
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.MobilePhone, &u.Socials,
		&u.VerificationCode, &u.VerifiedAt, &u.PasswordResetCode, &u.PasswordResetExpiresAt,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch user by verification code from sqlite: %w", err)
	}
	return &u, nil
}

// FindByPasswordResetCode retrieves a single User by their password reset code.
func (r *SqliteUserRepository) FindByPasswordResetCode(ctx context.Context, code string) (*domain.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, role, mobile_phone, socials, 
		       verification_code, verified_at, password_reset_code, password_reset_expires_at, 
		       created_at, updated_at 
		FROM users 
		WHERE password_reset_code = ?
	`
	row := r.db.QueryRowContext(ctx, query, code)
	var u domain.User
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.MobilePhone, &u.Socials,
		&u.VerificationCode, &u.VerifiedAt, &u.PasswordResetCode, &u.PasswordResetExpiresAt,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch user by password reset code from sqlite: %w", err)
	}
	return &u, nil
}

// Create inserts a new User into the database.
func (r *SqliteUserRepository) Create(ctx context.Context, u *domain.User) (*domain.User, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO users (id, email, password_hash, first_name, last_name, role, mobile_phone, socials, 
		                   verification_code, verified_at, password_reset_code, password_reset_expires_at, 
		                   created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.ExecContext(
		ctx, query,
		u.ID, u.Email, u.PasswordHash, u.FirstName, u.LastName, u.Role, u.MobilePhone, u.Socials,
		u.VerificationCode, u.VerifiedAt, u.PasswordResetCode, u.PasswordResetExpiresAt,
		u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert user into sqlite: %w", err)
	}

	if u.PasswordHash != "" {
		identityQuery := `
			INSERT INTO user_identities (id, user_id, provider, provider_uid, password_hash, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`
		identityID := "ident_local_" + u.ID
		_, err = tx.ExecContext(
			ctx, identityQuery,
			identityID, u.ID, "local", u.Email, u.PasswordHash, u.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert local identity: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}
	return u, nil
}

// Update changes properties of an existing User.
func (r *SqliteUserRepository) Update(ctx context.Context, u *domain.User) (*domain.User, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		UPDATE users 
		SET email = ?, password_hash = ?, first_name = ?, last_name = ?, role = ?, mobile_phone = ?, socials = ?, 
		    verification_code = ?, verified_at = ?, password_reset_code = ?, password_reset_expires_at = ?, updated_at = ? 
		WHERE id = ?
	`
	_, err = tx.ExecContext(
		ctx, query,
		u.Email, u.PasswordHash, u.FirstName, u.LastName, u.Role, u.MobilePhone, u.Socials,
		u.VerificationCode, u.VerifiedAt, u.PasswordResetCode, u.PasswordResetExpiresAt, u.UpdatedAt,
		u.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update user in sqlite: %w", err)
	}

	if u.PasswordHash != "" {
		// Update the local identity if it exists, or insert it.
		updateQuery := `UPDATE user_identities SET provider_uid = ?, password_hash = ? WHERE user_id = ? AND provider = 'local'`
		res, err := tx.ExecContext(ctx, updateQuery, u.Email, u.PasswordHash, u.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to update local identity: %w", err)
		}
		rowsAffected, err := res.RowsAffected()
		if err != nil {
			return nil, fmt.Errorf("failed to get rows affected: %w", err)
		}
		if rowsAffected == 0 {
			// Insert if not exists
			insertQuery := `INSERT INTO user_identities (id, user_id, provider, provider_uid, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`
			identityID := "ident_local_" + u.ID
			_, err = tx.ExecContext(ctx, insertQuery, identityID, u.ID, "local", u.Email, u.PasswordHash, u.CreatedAt)
			if err != nil {
				return nil, fmt.Errorf("failed to insert local identity: %w", err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
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
		SELECT id, email, password_hash, first_name, last_name, role, mobile_phone, socials, 
		       verification_code, verified_at, password_reset_code, password_reset_expires_at, 
		       created_at, updated_at 
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
		err := rows.Scan(
			&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.MobilePhone, &u.Socials,
			&u.VerificationCode, &u.VerifiedAt, &u.PasswordResetCode, &u.PasswordResetExpiresAt,
			&u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user from sqlite row: %w", err)
		}
		users = append(users, &u)
	}

	return users, total, nil
}

// FindIdentity retrieves a single UserIdentity by provider and providerUID.
func (r *SqliteUserRepository) FindIdentity(ctx context.Context, provider, providerUID string) (*domain.UserIdentity, error) {
	query := `
		SELECT id, user_id, provider, provider_uid, password_hash, created_at
		FROM user_identities
		WHERE provider = ? AND provider_uid = ?
	`
	row := r.db.QueryRowContext(ctx, query, provider, providerUID)
	var ui domain.UserIdentity
	var passwordHash sql.NullString
	err := row.Scan(
		&ui.ID, &ui.UserID, &ui.Provider, &ui.ProviderUID, &passwordHash, &ui.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch identity from sqlite: %w", err)
	}
	if passwordHash.Valid {
		ui.PasswordHash = passwordHash.String
	}
	return &ui, nil
}

// FindIdentitiesByUserID retrieves all UserIdentities associated with a user ID.
func (r *SqliteUserRepository) FindIdentitiesByUserID(ctx context.Context, userID string) ([]*domain.UserIdentity, error) {
	query := `
		SELECT id, user_id, provider, provider_uid, password_hash, created_at
		FROM user_identities
		WHERE user_id = ?
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user identities from sqlite: %w", err)
	}
	defer rows.Close()

	var identities []*domain.UserIdentity
	for rows.Next() {
		var ui domain.UserIdentity
		var passwordHash sql.NullString
		err := rows.Scan(
			&ui.ID, &ui.UserID, &ui.Provider, &ui.ProviderUID, &passwordHash, &ui.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user identity from sqlite row: %w", err)
		}
		if passwordHash.Valid {
			ui.PasswordHash = passwordHash.String
		}
		identities = append(identities, &ui)
	}
	return identities, nil
}

// CreateIdentity inserts a new UserIdentity into the database.
func (r *SqliteUserRepository) CreateIdentity(ctx context.Context, ui *domain.UserIdentity) (*domain.UserIdentity, error) {
	query := `
		INSERT INTO user_identities (id, user_id, provider, provider_uid, password_hash, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	var passwordHash sql.NullString
	if ui.PasswordHash != "" {
		passwordHash = sql.NullString{String: ui.PasswordHash, Valid: true}
	}
	_, err := r.db.ExecContext(
		ctx, query,
		ui.ID, ui.UserID, ui.Provider, ui.ProviderUID, passwordHash, ui.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert user identity into sqlite: %w", err)
	}
	return ui, nil
}
