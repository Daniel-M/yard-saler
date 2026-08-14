package pasetov4

import (
	"crypto/sha256"
	"fmt"
	"time"

	paseto "aidanwoods.dev/go-paseto"
)

// Issuer implements auth.AccessTokenIssuer using PASETO v4.local.
type Issuer struct {
	key    paseto.V4SymmetricKey
	parser paseto.Parser
}

// NewIssuer builds a new v4.local token issuer.
func NewIssuer(secret string) (*Issuer, error) {
	sum := sha256.Sum256([]byte(secret))
	key, err := paseto.V4SymmetricKeyFromBytes(sum[:])
	if err != nil {
		return nil, fmt.Errorf("failed to generate paseto key: %w", err)
	}
	return &Issuer{key: key, parser: paseto.NewParser()}, nil
}

// MintAccessToken generates a token containing subject and role claims.
func (i *Issuer) MintAccessToken(userID, role string, ttl time.Duration) (string, error) {
	if userID == "" {
		return "", fmt.Errorf("user ID is required")
	}
	if role == "" {
		return "", fmt.Errorf("role is required")
	}
	now := time.Now()
	tok := paseto.NewToken()
	tok.SetSubject(userID)
	if err := tok.Set("role", role); err != nil {
		return "", fmt.Errorf("failed to set role claim: %w", err)
	}
	tok.SetIssuedAt(now)
	tok.SetNotBefore(now)
	tok.SetExpiration(now.Add(ttl))
	return tok.V4Encrypt(i.key, nil), nil
}

// ParseAndValidate validates the token and extracts claims.
func (i *Issuer) ParseAndValidate(token string) (string, string, error) {
	pt, err := i.parser.ParseV4Local(i.key, token, nil)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse token: %w", err)
	}
	sub, err := pt.GetSubject()
	if err != nil || sub == "" {
		return "", "", fmt.Errorf("token missing subject claim")
	}
	role, _ := pt.GetString("role")
	return sub, role, nil
}
