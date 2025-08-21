-- Migration: Add user account settings fields
-- Date: 2024-12-19
-- Description: Add new fields for user account preferences and settings

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'auto';
ALTER TABLE users ADD COLUMN IF NOT EXISTS compact_mode INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notifications INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE users SET 
  timezone = 'UTC' WHERE timezone IS NULL;
UPDATE users SET 
  language = 'en' WHERE language IS NULL;
UPDATE users SET 
  theme = 'auto' WHERE theme IS NULL;
UPDATE users SET 
  compact_mode = 0 WHERE compact_mode IS NULL;
UPDATE users SET 
  email_notifications = 1 WHERE email_notifications IS NULL;
UPDATE users SET 
  push_notifications = 1 WHERE push_notifications IS NULL;
UPDATE users SET 
  sms_notifications = 0 WHERE sms_notifications IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.phone IS 'User phone number';
COMMENT ON COLUMN users.timezone IS 'User timezone preference';
COMMENT ON COLUMN users.language IS 'User language preference';
COMMENT ON COLUMN users.theme IS 'User theme preference (auto/light/dark)';
COMMENT ON COLUMN users.compact_mode IS 'User compact mode preference (0=false, 1=true)';
COMMENT ON COLUMN users.email_notifications IS 'Email notifications enabled (0=false, 1=true)';
COMMENT ON COLUMN users.push_notifications IS 'Push notifications enabled (0=false, 1=true)';
COMMENT ON COLUMN users.sms_notifications IS 'SMS notifications enabled (0=false, 1=true)';
