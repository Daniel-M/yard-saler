CREATE TABLE IF NOT EXISTS user_identities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_uid TEXT NOT NULL,
    password_hash TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_uid)
);

-- Migrate existing users' password hashes to user_identities
INSERT INTO user_identities (id, user_id, provider, provider_uid, password_hash, created_at)
SELECT 'ident_local_' || id, id, 'local', email, password_hash, created_at
FROM users;
