-- Add password field to users table
ALTER TABLE users ADD COLUMN password VARCHAR;

-- Update existing users to have a default password (for development)
UPDATE users SET password = 'dev123' WHERE password IS NULL;
