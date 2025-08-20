# 🔧 Email SMTP Troubleshooting Guide

## 🚨 **Current Issue: SMTP Connection Failing**

Your password reset functionality is working, but emails are failing with:
```
❌ Failed to send password reset email: Error: Greeting never received
code: 'ETIMEDOUT', command: 'CONN'
```

## 🔍 **Root Causes & Solutions**

### **1. Gmail App Password Issues**

#### **Problem**: Gmail app passwords can be restrictive
#### **Solution**: Generate a new app password with proper permissions

**Steps:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "2-Step Verification" → "App passwords"
3. **Delete existing** "Mail" app password
4. **Generate new** app password for "Mail"
5. **Copy the new 16-character password**
6. Update your `.env` file:

```bash
SMTP_PASS="your-new-16-char-password"
```

### **2. SMTP Port & Security Settings**

#### **Problem**: Port 587 (TLS) might be blocked
#### **Solution**: Try port 465 (SSL) with updated settings

**Current Settings (Updated):**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465          # Changed from 587 to 465
SMTP_USER=judeosafo111@gmail.com
SMTP_PASS="rllu czdy aivq ykep"
```

**Why Port 465:**
- **Port 465**: SSL (immediate encryption)
- **Port 587**: TLS (negotiated encryption)
- **Port 465** is more reliable for Gmail

### **3. Gmail Security Restrictions**

#### **Problem**: Gmail might be blocking "less secure" connections
#### **Solution**: Enable proper app access

**Check These Settings:**
1. **2-Factor Authentication**: Must be enabled
2. **App Passwords**: Must be generated specifically for "Mail"
3. **Google Account Security**: Check for any security alerts
4. **Captcha Verification**: Complete if prompted

### **4. Network & Firewall Issues**

#### **Problem**: Network restrictions blocking SMTP
#### **Solution**: Test connection and check network settings

## 🧪 **Testing & Diagnosis**

### **Test 1: Email Connection Test**

I've added a test endpoint. Test it with:

```bash
curl -X POST http://localhost:5001/api/test-email
```

**Expected Response:**
```json
{
  "success": true,
  "emailConfigured": true,
  "message": "Email service is working correctly"
}
```

### **Test 2: Manual SMTP Test**

Test Gmail SMTP manually:

```bash
# Test with openssl (if available)
openssl s_client -connect smtp.gmail.com:465 -crlf -ign_eof
```

### **Test 3: Check Server Logs**

Look for these messages on server startup:
- ✅ `Email service configured successfully` = SMTP working
- ⚠️ `Email service not configured` = SMTP configuration issue

## 🔧 **Step-by-Step Fix Process**

### **Step 1: Update App Password**
1. Generate new Gmail app password
2. Update `.env` file
3. Restart server

### **Step 2: Test Connection**
1. Use the test endpoint: `/api/test-email`
2. Check server console for connection status
3. Verify SMTP settings are loaded

### **Step 3: Test Password Reset**
1. Try resetting a user's password
2. Check if email is sent successfully
3. Monitor server logs for success/failure

## 🚀 **Alternative Solutions**

### **Option 1: Use Different Email Provider**

#### **Outlook/Hotmail:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### **Yahoo:**
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### **Option 2: Use Email Service (Recommended for Production)**

#### **SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### **Mailgun:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## 📋 **Current Status Check**

### **✅ What's Working:**
- Password reset functionality
- User management interface
- Email service configuration
- Professional email templates
- Fallback password display

### **❌ What Needs Fixing:**
- Gmail SMTP connection
- Email delivery to users
- SMTP timeout issues

## 🎯 **Immediate Next Steps**

1. **Generate new Gmail app password**
2. **Update `.env` file** with new password
3. **Restart server** to load new settings
4. **Test email connection** with `/api/test-email`
5. **Try password reset** to verify email delivery

## 🔍 **Debug Information**

### **Server Logs to Monitor:**
```
✅ Email service configured successfully
🔧 Using development authentication mode
[express] serving on port 5001
```

### **Email Test Endpoint:**
```
POST /api/test-email
```

### **Password Reset Endpoint:**
```
POST /api/users/:userId/reset-password
```

## 🆘 **If All Else Fails**

### **Fallback Mode:**
The system will continue working with:
- ✅ **Console notifications** showing email content
- ✅ **Password display** to admin for manual sharing
- ✅ **Full functionality** except email delivery

### **Manual Password Sharing:**
When email fails, the system shows:
```
🔑 New Temporary Password (Share Manually)
Password: [generated-password]
```

## 📞 **Support Commands**

### **Check Current SMTP Settings:**
```bash
grep -E "SMTP_" .env
```

### **Test Email Connection:**
```bash
curl -X POST http://localhost:5001/api/test-email
```

### **Restart Server:**
```bash
pkill -f "npm run dev"
set -a; source .env; set +a; npm run dev
```

---

**🎯 Goal**: Get Gmail SMTP working so users receive password reset emails automatically
**📧 Current**: Password reset works, but email delivery fails
**🔧 Next**: Fix SMTP connection with new app password and port 465
