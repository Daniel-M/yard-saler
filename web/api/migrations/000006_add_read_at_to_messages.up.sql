-- Migration: Add read_at column to messages to track unread state
ALTER TABLE messages ADD COLUMN read_at DATETIME;

-- Add an index for optimizing queries filtering by read_at and receiver
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
