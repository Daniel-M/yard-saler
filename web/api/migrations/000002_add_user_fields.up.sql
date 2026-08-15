ALTER TABLE users RENAME COLUMN password TO password_hash;
ALTER TABLE users ADD COLUMN mobile_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN socials TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN verification_code TEXT;
ALTER TABLE users ADD COLUMN verified_at DATETIME;
ALTER TABLE users ADD COLUMN password_reset_code TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires_at DATETIME;
