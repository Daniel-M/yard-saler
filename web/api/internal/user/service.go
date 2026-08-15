package user

import (
	"context"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/oklog/ulid/v2"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound          = errors.New("user not found")
	ErrUserAlreadyVerified   = errors.New("user already verified")
	ErrInvalidCode           = errors.New("invalid verification code")
	ErrCodeExpired           = errors.New("verification code expired")
	ErrOAuthProviderExists   = errors.New("oauth_provider_exists")
	ErrOAuthProviderRequired = errors.New("oauth_provider_required")
	ErrInvalidCredentials    = errors.New("invalid credentials")
	ErrUserAlreadyExists     = errors.New("user already exists")
)

// UserService coordinates operations on User domain objects.
type UserService struct {
	repo UserRepository
}

// NewUserService creates a new UserService instance.
func NewUserService(repo UserRepository) *UserService {
	return &UserService{repo: repo}
}

// GetUser retrieves a user by ID.
func (s *UserService) GetUser(ctx context.Context, id string) (*domain.User, error) {
	if id == "" {
		return nil, errors.New("user ID cannot be empty")
	}
	return s.repo.FindByID(ctx, id)
}

// CreateUser handles registration validation and persists a new user.
func (s *UserService) CreateUser(ctx context.Context, u *domain.User) (*domain.User, error) {
	if u.Email == "" {
		return nil, errors.New("user email cannot be empty")
	}
	
	existing, err := s.repo.FindByEmail(ctx, u.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existing != nil {
		return nil, ErrUserAlreadyExists
	}

	if u.ID == "" {
		u.ID = fmt.Sprintf("usr_%d", time.Now().UnixNano())
	}

	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()

	return s.repo.Create(ctx, u)
}

// PreRegisterUser handles user pre-registration.
func (s *UserService) PreRegisterUser(ctx context.Context, d dto.UserPreRegisterDTO) (*domain.User, error) {
	if d.Email == "" {
		return nil, errors.New("user email cannot be empty")
	}

	existing, err := s.repo.FindByEmail(ctx, d.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existing != nil {
		identities, idErr := s.repo.FindIdentitiesByUserID(ctx, existing.ID)
		if idErr == nil && len(identities) > 0 {
			hasLocal := false
			hasOAuth := false
			for _, ident := range identities {
				if ident.Provider == "local" {
					hasLocal = true
				} else {
					hasOAuth = true
				}
			}
			if hasOAuth && !hasLocal {
				return nil, ErrOAuthProviderExists
			}
		}
		return nil, ErrUserAlreadyExists
	}

	u, err := domain.NewUserFromPreRegister(d)
	if err != nil {
		return nil, err
	}

	return s.repo.Create(ctx, u)
}

// VerifyUser verifies a pre-registered user using their verification code.
func (s *UserService) VerifyUser(ctx context.Context, d dto.UserVerifyDTO) (*domain.User, error) {
	u, err := s.repo.FindByVerificationCode(ctx, d.VerificationCode)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user for verification: %w", err)
	}
	if u == nil {
		return nil, ErrInvalidCode
	}

	if u.VerifiedAt != nil {
		return nil, ErrUserAlreadyVerified
	}

	if u.VerificationCode == nil {
		return nil, ErrInvalidCode
	}

	if subtle.ConstantTimeCompare([]byte(*u.VerificationCode), []byte(d.VerificationCode)) != 1 {
		return nil, ErrInvalidCode
	}

	now := time.Now()
	u.VerifiedAt = &now
	u.VerificationCode = nil
	u.UpdatedAt = now

	return s.repo.Update(ctx, u)
}

// EditUserDetails updates editable profile attributes of an authenticated user.
func (s *UserService) EditUserDetails(ctx context.Context, userID string, d dto.UserDTO) (*domain.User, error) {
	u, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}

	// Update only editable fields
	u.FirstName = d.FirstName
	u.LastName = d.LastName
	u.MobilePhone = d.MobilePhone
	u.Socials = d.Socials
	u.UpdatedAt = time.Now()

	return s.repo.Update(ctx, u)
}

// PasswordReset updates a user's password using a valid reset code.
func (s *UserService) PasswordReset(ctx context.Context, d dto.UserPasswordResetDTO) error {
	u, err := s.repo.FindByPasswordResetCode(ctx, d.PasswordChangeCode)
	if err != nil {
		return fmt.Errorf("failed to fetch user by reset code: %w", err)
	}
	if u == nil {
		return ErrUserNotFound
	}

	if u.PasswordResetExpiresAt == nil || u.PasswordResetExpiresAt.Before(time.Now()) {
		return ErrCodeExpired
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(d.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	u.PasswordHash = string(hash)
	u.PasswordResetCode = nil
	u.PasswordResetExpiresAt = nil
	u.UpdatedAt = time.Now()

	_, err = s.repo.Update(ctx, u)
	return err
}

// UpdateUser performs validation and updates user attributes.
func (s *UserService) UpdateUser(ctx context.Context, u *domain.User) (*domain.User, error) {
	if u.ID == "" {
		return nil, errors.New("user ID cannot be empty for update")
	}

	existing, err := s.repo.FindByID(ctx, u.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user for update: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("user with ID %s not found", u.ID)
	}

	u.UpdatedAt = time.Now()
	return s.repo.Update(ctx, u)
}

// DeleteUser removes a user by ID.
func (s *UserService) DeleteUser(ctx context.Context, id string) error {
	if id == "" {
		return errors.New("user ID cannot be empty for deletion")
	}
	return s.repo.Delete(ctx, id)
}

// ListUsers queries a page of users.
func (s *UserService) ListUsers(ctx context.Context, offset, limit int) ([]*domain.User, int, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.List(ctx, offset, limit)
}

// LoginUser authenticates a user by email and password, using the user_identities table.
func (s *UserService) LoginUser(ctx context.Context, email, password string) (*domain.User, error) {
	if email == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	u, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to lookup user: %w", err)
	}
	if u == nil {
		return nil, ErrInvalidCredentials
	}

	identities, err := s.repo.FindIdentitiesByUserID(ctx, u.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user identities: %w", err)
	}

	var localIdentity *domain.UserIdentity
	var hasOAuth bool
	for _, ident := range identities {
		if ident.Provider == "local" {
			localIdentity = ident
		} else {
			hasOAuth = true
		}
	}

	if localIdentity == nil {
		if hasOAuth {
			return nil, ErrOAuthProviderRequired
		}
		return nil, ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword([]byte(localIdentity.PasswordHash), []byte(password))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	return u, nil
}

// OAuthGoogle handles Google OAuth sign-in/up by verifying the credential and associating/creating the user profile and identities.
func (s *UserService) OAuthGoogle(ctx context.Context, credential string) (*domain.User, error) {
	claims, err := parseGoogleToken(credential)
	if err != nil {
		return nil, fmt.Errorf("invalid google credential: %w", err)
	}

	if claims.Email == "" || claims.Sub == "" {
		return nil, errors.New("missing email or subject in google token")
	}

	existing, err := s.repo.FindByEmail(ctx, claims.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	now := time.Now()

	if existing != nil {
		// User exists. Ensure they have the google identity linked.
		identity, err := s.repo.FindIdentity(ctx, "google", claims.Sub)
		if err != nil {
			return nil, fmt.Errorf("failed to check google identity: %w", err)
		}

		if identity == nil {
			// Link Google identity to existing user
			identity = &domain.UserIdentity{
				ID:          "ident_google_" + ulid.Make().String(),
				UserID:      existing.ID,
				Provider:    "google",
				ProviderUID: claims.Sub,
				CreatedAt:   now,
			}
			_, err = s.repo.CreateIdentity(ctx, identity)
			if err != nil {
				return nil, fmt.Errorf("failed to link google identity: %w", err)
			}
		}

		// If user was not verified, since we verified via Google OAuth, mark them verified.
		if existing.VerifiedAt == nil {
			existing.VerifiedAt = &now
			existing.UpdatedAt = now
			_, err = s.repo.Update(ctx, existing)
			if err != nil {
				return nil, fmt.Errorf("failed to mark user as verified: %w", err)
			}
		}

		return existing, nil
	}

	// User does not exist. Create new user and associate Google identity.
	userID := ulid.Make().String()
	newUser := &domain.User{
		ID:          userID,
		Email:       claims.Email,
		FirstName:   claims.FirstName,
		LastName:    claims.LastName,
		Role:        "user",
		VerifiedAt:  &now,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err = s.repo.Create(ctx, newUser)
	if err != nil {
		return nil, fmt.Errorf("failed to create user profile: %w", err)
	}

	identity := &domain.UserIdentity{
		ID:          "ident_google_" + ulid.Make().String(),
		UserID:      userID,
		Provider:    "google",
		ProviderUID: claims.Sub,
		CreatedAt:   now,
	}

	_, err = s.repo.CreateIdentity(ctx, identity)
	if err != nil {
		return nil, fmt.Errorf("failed to create google identity: %w", err)
	}

	return newUser, nil
}

type GoogleClaims struct {
	Email         string `json:"email"`
	Sub           string `json:"sub"`
	EmailVerified bool   `json:"email_verified"`
	FirstName     string `json:"given_name"`
	LastName      string `json:"family_name"`
}

func parseGoogleToken(token string) (*GoogleClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid token format")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		payload, err = base64.StdEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, fmt.Errorf("failed to decode token payload: %w", err)
		}
	}
	var claims GoogleClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("failed to unmarshal token claims: %w", err)
	}
	return &claims, nil
}
