#!/bin/bash

echo "📧 IT Support System - Email Notification Setup"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one first."
    exit 1
fi

echo "🔧 Email Configuration Setup"
echo ""

# Function to add environment variable
add_env_var() {
    local key=$1
    local value=$2
    local comment=$3
    
    if grep -q "^$key=" .env; then
        echo "⚠️  $key already exists in .env file"
    else
        echo "# $comment" >> .env
        echo "$key=$value" >> .env
        echo "✅ Added $key to .env file"
    fi
}

# Add email configuration variables
echo "Adding email configuration variables to .env file..."
echo ""

add_env_var "SMTP_HOST" "smtp.gmail.com" "Email Configuration (Optional - for production use)"
add_env_var "SMTP_PORT" "587" "SMTP port (587 for TLS, 465 for SSL)"
add_env_var "SMTP_USER" "your-email@gmail.com" "Your email address"
add_env_var "SMTP_PASS" "your-app-password" "Your email app password"

echo ""
echo "📋 Next Steps:"
echo "1. Edit your .env file and replace the placeholder values:"
echo "   - SMTP_USER: Your actual email address"
echo "   - SMTP_PASS: Your email app password"
echo ""
echo "2. For Gmail users:"
echo "   - Enable 2-Factor Authentication"
echo "   - Generate an App Password for 'Mail'"
echo "   - Use the 16-character app password"
echo ""
echo "3. Test the system by creating a new user"
echo ""
echo "📖 For detailed instructions, see EMAIL_SETUP.md"
echo ""
echo "🎉 Email notification system is now configured!"
echo "   (It will work in console mode until you configure SMTP)"
