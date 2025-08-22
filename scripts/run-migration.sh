#!/bin/bash

echo "Running database migration to add reset token fields..."

# Check if DATABASE_URL is not set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file or export it"
    exit 1
fi

# Run the migration
psql "$DATABASE_URL" -f migrations/add_reset_token_fields.sql

echo "Migration completed!"
echo "Note: Users can now reset their passwords securely via email links"
