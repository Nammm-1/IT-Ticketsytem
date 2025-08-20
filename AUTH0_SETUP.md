# 🔐 Auth0 Authentication Setup Guide

## 📋 **Prerequisites**
- Auth0 account (free tier available)
- Your HelpDesk application running on localhost:5001

## 🚀 **Step 1: Create Auth0 Application**

1. **Sign up/Login to [Auth0.com](https://auth0.com)**
2. **Create New Application**:
   - Click "Applications" → "Create Application"
   - Name: `HelpDesk Support System`
   - Type: **Regular Web Application**
   - Click "Create"

## ⚙️ **Step 2: Configure Auth0 Application**

### **Application Settings**
1. **Go to your application settings**
2. **Update these fields**:
   - **Allowed Callback URLs**: `http://localhost:5001/api/callback`
   - **Allowed Logout URLs**: `http://localhost:5001`
   - **Allowed Web Origins**: `http://localhost:5001`

### **Get Your Credentials**
Copy these from your Auth0 application:
- **Domain**: `your-tenant.auth0.com`
- **Client ID**: `abc123...`
- **Client Secret**: `xyz789...`

## 🔧 **Step 3: Update Environment Variables**

Update your `.env` file with these values:

```bash
# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/helpdesk
PGSSL_DISABLE=1

# Session Configuration
SESSION_SECRET=devsecret

# Development Mode (set to 0 to enable Auth0)
DEV_AUTH=0

# Auth0 Configuration
ISSUER_URL=https://your-tenant.auth0.com
REPL_ID=your_client_id_here
OIDC_CLIENT_SECRET=your_client_secret_here
OIDC_SCOPE=openid email profile offline_access
OIDC_CALLBACK_URL=http://localhost:5001/api/callback

# Server Configuration
PORT=5001
REPLIT_DOMAINS=localhost
```

## 🎯 **Step 4: Test the Setup**

1. **Restart your server** after updating `.env`
2. **Go to** `http://localhost:5001`
3. **You should be redirected to Auth0 login**
4. **Login with your Auth0 account**
5. **You'll be redirected back to your app**

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Invalid redirect URI"**
   - Check that `OIDC_CALLBACK_URL` matches exactly in Auth0
   - Ensure no trailing slashes

2. **"Client not found"**
   - Verify `REPL_ID` (Client ID) is correct
   - Check `ISSUER_URL` format

3. **"Invalid client secret"**
   - Ensure `OIDC_CLIENT_SECRET` is copied correctly
   - Regenerate secret in Auth0 if needed

### **Debug Mode:**
If Auth0 fails, the system will automatically fall back to development mode.

## 🌟 **Features You'll Get:**

- ✅ **Professional login page** hosted by Auth0
- ✅ **Social login** (Google, GitHub, etc.) - configurable in Auth0
- ✅ **Multi-factor authentication** (MFA)
- ✅ **Password policies** and security
- ✅ **User management** dashboard
- ✅ **Analytics** and monitoring
- ✅ **Compliance** (GDPR, SOC2, etc.)

## 🔄 **Switching Back to Dev Mode:**

If you need to go back to development authentication temporarily:

```bash
# In your .env file
DEV_AUTH=1
```

## 📱 **Production Deployment:**

When deploying to production:
1. Update `OIDC_CALLBACK_URL` to your production domain
2. Set `NODE_ENV=production`
3. Use a strong `SESSION_SECRET`
4. Enable HTTPS (required for production)

---

**Need Help?** Check the server console for detailed error messages and authentication flow logs.
