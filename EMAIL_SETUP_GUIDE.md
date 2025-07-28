# 📧 Email Testing Setup Guide

## 🎯 **Current Status**
- ✅ Email test mode is configured to redirect all emails to:
  - `alex@pipelineworkforce.com`
  - `jonathan@pipelineworkforce.com`
- ❌ Email credentials need to be updated (Google disabled "less secure apps")

## 🔧 **Solution: Use App Password**

### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Sign in with `info@pipelineworkforce.com`
3. Go to **Security** → **2-Step Verification**
4. Enable 2-Step Verification if not already enabled

### **Step 2: Generate App Password**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **App passwords**
3. Select **Mail** and **Other (Custom name)**
4. Name it: `Pipeline Email Service`
5. Click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### **Step 3: Update Environment Variables**
Update `backend/api/.env`:

```bash
# Replace the current EMAIL_PASS with the App Password
EMAIL_PASS=your_16_character_app_password_here
```

### **Step 4: Test Email Sending**
Run the test script:
```bash
cd backend/api
npx ts-node src/email/test-all-emails.ts
```

## 📧 **Email Types That Will Be Tested**

1. **Basic Email** - Simple text email
2. **Password Reset** - Password reset with token
3. **Email Verification** - Account verification email
4. **Welcome Email** - New user welcome
5. **Partial Signup Reminder** - Incomplete profile reminder
6. **Apply Nudge** - Job application reminder
7. **Local Job Alert** - Jobs in specific city
8. **Launch Email** - Platform launch announcement
9. **Gmail Fallback** - Gmail API fallback test
10. **Template Email** - Custom template test

## 🔍 **How Test Mode Works**

- All emails are redirected to test addresses
- Subject lines get `[TEST]` prefix
- Original recipient is shown in subject
- Console logs show redirection details

## 🚀 **Quick Test Commands**

```bash
# Test single email
curl -X POST http://localhost:3001/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test all email types
cd backend/api
npx ts-node src/email/test-all-emails.ts
```

## ⚙️ **Environment Variables**

```bash
EMAIL_TEST_MODE=true                    # Enable test mode
EMAIL_HOST=smtp.gmail.com              # Gmail SMTP
EMAIL_PORT=587                         # TLS port
EMAIL_USER=info@pipelineworkforce.com  # Sender email
EMAIL_PASS=your_app_password           # App password (16 chars)
``` 