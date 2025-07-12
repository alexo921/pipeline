# 📧 Gmail OAuth Setup for Pipeline NestJS API

## 🚀 **Implementation Complete!**

Your NestJS API now has **Gmail OAuth Web Application** support integrated! Here's how to set it up:

---

## ⚙️ **Environment Variables Required**

Add these to your `.env` file (already using ConfigService):

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID="685282677210-46ge7min5q13t2pj84pjvqcfir19pbc7.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_actual_client_secret_here"

# App URLs
APP_URL="https://api.pipelineworkforce.com"  # Your API URL
FRONTEND_URL="https://pipelineworkforce.com"  # Your frontend URL
```

---

## 🔧 **Google Cloud Console Setup**

### 1. **Update Redirect URIs**
In your existing **Web application** OAuth client:
- ✅ Add: `https://api.pipelineworkforce.com/auth/gmail/callback`
- ✅ Keep: `https://pipelineworkforce.com/auth/google/callback`

### 2. **Download New Client Secret**
- Your `GOOGLE_CLIENT_ID` is already set
- Download the **updated JSON credentials** 
- Copy the `client_secret` to your `.env` file

---

## 🚀 **Available API Endpoints**

Your API now includes these **new Gmail OAuth endpoints**:

### **1. Gmail Authorization**
```
GET /api/auth/gmail
```
- Redirects to Google OAuth for Gmail permissions
- **Use this URL to authorize Gmail access**

### **2. Gmail Status Check**
```
GET /api/auth/gmail/status
```
- Returns Gmail OAuth authorization status
- Shows setup URL and current method (Gmail API vs SMTP)

### **3. Enhanced Test Email**
```
POST /api/auth/test-email
Body: { "email": "test@example.com" }
```
- Uses Gmail API if authorized, falls back to SMTP
- Shows which method was used

---

## 🎯 **How to Use (Step by Step)**

### **Step 1: Check Current Status**
```bash
curl https://api.pipelineworkforce.com/api/auth/gmail/status
```

### **Step 2: Authorize Gmail (One-time setup)**
1. **Visit:** `https://api.pipelineworkforce.com/api/auth/gmail`
2. **Sign in** with `info@pipelineworkforce.com`
3. **Grant permissions** for Gmail sending
4. **You'll be redirected** to your frontend with success/error message

### **Step 3: Test Email Sending**
```bash
curl -X POST https://api.pipelineworkforce.com/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@pipelineworkforce.com"}'
```

---

## 🔄 **Frontend Integration Examples**

### **Admin Panel - Gmail Setup Button**
```typescript
// In your admin/settings page
const setupGmail = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/gmail`;
};

const checkGmailStatus = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/gmail/status`);
  const status = await response.json();
  return status.data;
};
```

### **Contact Form Integration**
```typescript
// Your existing contact form can now use Gmail API automatically
const sendContactEmail = async (formData) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: formData.email })
  });
  
  const result = await response.json();
  // result.data.method will show "gmail-api" or "smtp"
};
```

---

## 🛡️ **Security Features**

### **Token Storage**
- ✅ Tokens stored in memory (secure for single instance)
- ✅ Falls back to SMTP if Gmail API fails
- ✅ Automatic token expiration handling

### **Error Handling**
- ✅ Graceful fallback to SMTP
- ✅ Clear error messages for re-authorization
- ✅ Proper redirect URLs with status messages

---

## 📊 **Email Sending Priority**

1. **Gmail API** (if authorized) ← **Preferred for security**
2. **SMTP** (fallback) ← **Your current method**

---

## 🧪 **Testing the Setup**

### **1. Test without Gmail OAuth (SMTP)**
```bash
curl -X POST https://api.pipelineworkforce.com/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "info@pipelineworkforce.com"}'
```

### **2. Authorize Gmail OAuth**
```bash
# Visit this URL in browser
open https://api.pipelineworkforce.com/api/auth/gmail
```

### **3. Test with Gmail API**
```bash
curl -X POST https://api.pipelineworkforce.com/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "info@pipelineworkforce.com"}'
```

---

## 🔍 **Troubleshooting**

### **"redirect_uri_mismatch" Error**
- ✅ Update Google Cloud Console redirect URIs
- ✅ Add: `https://api.pipelineworkforce.com/auth/gmail/callback`

### **"Gmail tokens not configured"**
- ✅ Visit `/api/auth/gmail` to authorize
- ✅ Check `/api/auth/gmail/status` for current status

### **"access_token expired"**
- ✅ Visit `/api/auth/gmail` to re-authorize
- ✅ System will automatically fall back to SMTP

---

## ✅ **What's Implemented**

- ✅ **Gmail OAuth Web Flow** - Perfect for your website
- ✅ **Automatic fallback** to SMTP if Gmail fails  
- ✅ **Token management** in your NestJS service
- ✅ **Status checking** endpoint
- ✅ **Enhanced email sending** with method detection
- ✅ **Admin-friendly** authorization flow
- ✅ **Security compliant** with Google's 2025 requirements

---

## 🎉 **Ready to Use!**

Your pipeline website can now send emails securely using Gmail OAuth 2.0, with automatic fallback to SMTP for reliability.

**Next Steps:**
1. Add `GOOGLE_CLIENT_SECRET` to your `.env`
2. Update redirect URIs in Google Cloud Console  
3. Visit `/api/auth/gmail` to authorize
4. Your contact forms will automatically use Gmail API! 🚀 