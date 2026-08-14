package auth

import (
	"fmt"
	"time"

	"github.com/danielmejiar/whale_shark/web/backend/internal/auth/pasetov4"
)

// AccessTokenIssuer defines the contract for minting and parsing access tokens.
type AccessTokenIssuer interface {
	MintAccessToken(userID, role string, ttl time.Duration) (string, error)
	ParseAndValidate(token string) (userID, role string, err error)
}

// NewAccessTokenIssuer returns a new instance of the default PASETO v4 token issuer.
func NewAccessTokenIssuer(secret string) (AccessTokenIssuer, error) {
	if secret == "" {
		return nil, fmt.Errorf("paseto secret is required")
	}
	return pasetov4.NewIssuer(secret)
}
