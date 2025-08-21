#!/bin/bash

echo "Running database migration to add password field..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file or export it"
    exit 1
fi

# Run the migration
psql "$DATABASE_URL" -f migrations/add_password_field.sql

echo "Migration completed!"
echo "Note: Existing users now have 'dev123' as their password"
echo "Users can change their password through the application"
