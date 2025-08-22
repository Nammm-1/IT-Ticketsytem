-- Add password reset token fields to users table
ALTER TABLE users ADD COLUMN reset_token VARCHAR;
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;

-- Create index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
