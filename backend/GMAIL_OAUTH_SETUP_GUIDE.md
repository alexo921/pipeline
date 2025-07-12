# 📧 Gmail Email Setup for pipelineworkforce.com

## 🎯 **RECOMMENDED: Service Account (Better for Websites)**

For `pipelineworkforce.com` website email functionality, **Service Account** is the best option because:
- ✅ No user interaction required
- ✅ Works automatically from server
- ✅ More secure for production websites
- ✅ Perfect for contact forms, notifications, etc.

### Quick Setup:
```bash
cd backend
python service_account_email.py
```

---

## 📋 **Service Account Setup Steps**

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project: **"Pipeline Workforce Email"**
3. Enable **Gmail API**

### 2. Create Service Account
1. **IAM & Admin** → **Service Accounts**
2. **Create Service Account:**
   - Name: `Pipeline Email Sender`
   - ID: `pipeline-email-sender`
3. **Create Key** → JSON → Download
4. Save as `service-account.json` in `/backend/`

### 3. Enable Domain-Wide Delegation
1. Edit service account → **✅ Enable G Suite Domain-wide Delegation**
2. Note the **Unique ID** (client ID)

### 4. Google Workspace Admin Console
⚠️ **You need admin access to pipelineworkforce.com Google Workspace**

1. Go to [admin.google.com](https://admin.google.com)
2. **Security** → **API Controls** → **Domain-wide Delegation**
3. **Add new:**
   - Client ID: `[from step 3]`
   - OAuth Scopes: `https://www.googleapis.com/auth/gmail.send`

### 5. Test Setup
```bash
python service_account_email.py
```

---

## 🔄 **Alternative: OAuth 2.0 (More Complex)**

If you prefer OAuth 2.0 for pipelineworkforce.com:

### OAuth for Website (Web Application)
1. **Google Cloud Console** → **Credentials**
2. **Create OAuth 2.0 Client ID:**
   - Application type: **Web application**
   - Name: "Pipeline Workforce Email"
   - **Authorized redirect URIs:**
     ```
     https://pipelineworkforce.com/auth/google/callback
     https://www.pipelineworkforce.com/auth/google/callback
     https://pipelineworkforce.com/api/auth/google/callback
     https://www.pipelineworkforce.com/api/auth/google/callback
     ```
3. Download JSON → Save as `credentials.json`

### OAuth for Server/Local (Desktop Application)
```bash
cd backend
python email_oauth_setup.py
```

---

## 🚀 **Integration Examples**

### Service Account (Recommended)
```python
from service_account_email import ServiceAccountEmailSender

def send_contact_form(name, email, message):
    sender = ServiceAccountEmailSender()
    sender.setup_service_account()
    
    return sender.send_email(
        to_emails=['info@pipelineworkforce.com'],
        subject=f'Contact Form: {name}',
        body=f'From: {name} <{email}>\n\nMessage:\n{message}'
    )
```

### OAuth (Alternative)
```python
from email_oauth_setup import GmailOAuthSender

def send_contact_form(name, email, message):
    sender = GmailOAuthSender()
    sender.setup_oauth_credentials()
    
    return sender.send_email(
        to_emails=['info@pipelineworkforce.com'],
        subject=f'Contact Form: {name}',
        body=f'From: {name} <{email}>\n\nMessage:\n{message}'
    )
```

---

## ⚠️ **Important Notes**

### Security Requirements (March 14, 2025)
- ✅ Google discontinued "less secure apps"
- ✅ Must use OAuth 2.0 or Service Account
- ✅ No more username/password SMTP

### Domain Requirements
- 📧 `info@pipelineworkforce.com` must be configured in Google Workspace
- 🔑 You need admin access for Service Account setup
- 🌐 Website needs proper domain verification

### File Structure
```
backend/
├── service_account_email.py       # ⭐ RECOMMENDED
├── service-account.json           # Service account credentials
├── email_oauth_setup.py          # Alternative OAuth
├── credentials.json              # OAuth credentials
└── requirements_oauth.txt        # Dependencies
```

---

## 🔧 **Troubleshooting**

### Service Account Issues
- **403 Forbidden**: Enable domain-wide delegation
- **401 Unauthorized**: Check client ID in Admin Console
- **404 Not Found**: Verify Gmail API is enabled

### OAuth Issues
- **redirect_uri_mismatch**: Update redirect URIs in console
- **access_denied**: User needs to authorize scopes
- **invalid_client**: Check credentials.json file

---

## ✅ **Which Should You Use?**

| Use Case | Recommendation |
|----------|---------------|
| 🌐 **Website contact forms** | ⭐ **Service Account** |
| 🌐 **Automated notifications** | ⭐ **Service Account** |
| 🖥️ **Local development/testing** | OAuth (Desktop) |
| 🔄 **User-authorized sending** | OAuth (Web) |

**For pipelineworkforce.com → Use Service Account! 🎯** 