-- Add model field to messages table for analytics
-- Migration: 017-add-model-field.sql

-- Add model column to messages table if it doesn't exist
ALTER TABLE messages ADD COLUMN model TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_model ON messages(model);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_role ON messages(conversation_id, role);
