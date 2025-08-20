#!/bin/bash

echo "🔐 Auth0 Authentication Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

echo "📋 Current .env configuration:"
echo "-------------------------------"
grep -E "^(DEV_AUTH|ISSUER_URL|REPL_ID|OIDC_CLIENT_SECRET|OIDC_CALLBACK_URL)" .env || echo "No Auth0 config found"

echo ""
echo "🚀 To enable Auth0 authentication:"
echo "1. Go to https://auth0.com and create an account"
echo "2. Create a new 'Regular Web Application'"
echo "3. Update your .env file with these values:"
echo ""
echo "   DEV_AUTH=0"
echo "   ISSUER_URL=https://your-tenant.auth0.com"
echo "   REPL_ID=your_client_id_here"
echo "   OIDC_CLIENT_SECRET=your_client_secret_here"
echo "   OIDC_CALLBACK_URL=http://localhost:5001/api/callback"
echo ""
echo "4. In Auth0, set these URLs:"
echo "   - Allowed Callback URLs: http://localhost:5001/api/callback"
echo "   - Allowed Logout URLs: http://localhost:5001"
echo "   - Allowed Web Origins: http://localhost:5001"
echo ""
echo "5. Restart your server"
echo ""

# Check if Auth0 is already configured
if grep -q "DEV_AUTH=0" .env; then
    echo "✅ Auth0 is already enabled!"
    echo "Current configuration:"
    grep -E "^(ISSUER_URL|REPL_ID)" .env
else
    echo "🔧 Currently using development authentication (DEV_AUTH=1)"
    echo "To switch to Auth0, set DEV_AUTH=0 in your .env file"
fi

echo ""
echo "📖 For detailed instructions, see: AUTH0_SETUP.md"
