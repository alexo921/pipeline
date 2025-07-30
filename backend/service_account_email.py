#!/usr/bin/env python3
"""
Gmail Service Account Email Sender
=================================

Better option for pipelineworkforce.com website email sending.
Uses Service Account instead of OAuth for server-to-server authentication.
"""

import os
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional

from google.auth import default
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class ServiceAccountEmailSender:
    """
    Service Account based email sender for pipelineworkforce.com
    Better for website use - no user interaction required.
    """
    
    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    
    def __init__(self, service_account_file: str = 'service-account.json', 
                 delegated_user: str = 'info@pipelineworkforce.com'):
        """
        Initialize Service Account email sender.
        
        Args:
            service_account_file: Path to service account JSON file
            delegated_user: Email address to send on behalf of
        """
        self.service_account_file = service_account_file
        self.delegated_user = delegated_user
        self.service = None
        
    def setup_service_account(self):
        """
        Set up Service Account credentials.
        """
        print("🔐 Setting up Gmail Service Account...")
        
        if not os.path.exists(self.service_account_file):
            print(f"❌ Service account file not found: {self.service_account_file}")
            print("\n📋 SERVICE ACCOUNT SETUP FOR PIPELINEWORKFORCE.COM:")
            print("1. Go to Google Cloud Console: https://console.cloud.google.com/")
            print("2. Select your project: 'Pipeline Workforce Email'")
            print("3. Go to 'IAM & Admin' → 'Service Accounts'")
            print("4. Create Service Account:")
            print("   - Name: 'Pipeline Email Sender'")
            print("   - ID: 'pipeline-email-sender'")
            print("5. Create and download JSON key")
            print("6. Save as 'service-account.json'")
            print("7. IMPORTANT: Enable domain-wide delegation:")
            print("   - Edit service account → 'Enable G Suite Domain-wide Delegation'")
            print("   - Note the 'Unique ID' (client ID)")
            print("8. In Google Workspace Admin Console:")
            print("   - Security → API Controls → Domain-wide Delegation")
            print("   - Add client ID with scope: https://www.googleapis.com/auth/gmail.send")
            return False
        
        try:
            # Load service account credentials
            credentials = service_account.Credentials.from_service_account_file(
                self.service_account_file, 
                scopes=self.SCOPES
            )
            
            # Delegate to the specified user
            delegated_credentials = credentials.with_subject(self.delegated_user)
            
            # Build Gmail service
            self.service = build('gmail', 'v1', credentials=delegated_credentials)
            
            print("✅ Service Account setup completed successfully!")
            print(f"📧 Ready to send emails as: {self.delegated_user}")
            return True
            
        except Exception as e:
            print(f"❌ Error setting up service account: {e}")
            return False
    
    def send_email(self, to_emails: List[str], subject: str, body: str,
                   html_body: Optional[str] = None,
                   attachments: Optional[List[str]] = None) -> bool:
        """
        Send email using Service Account.
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            attachments: Optional list of file paths to attach
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.service:
            print("❌ Service not initialized. Run setup_service_account() first.")
            return False
        
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['to'] = ', '.join(to_emails)
            message['from'] = f'Pipeline <{self.delegated_user}>'
            message['subject'] = subject
            
            # Add plain text part
            text_part = MIMEText(body, 'plain')
            message.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                message.attach(html_part)
            
            # Add attachments if provided
            if attachments:
                for file_path in attachments:
                    if os.path.exists(file_path):
                        with open(file_path, 'rb') as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                        
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {os.path.basename(file_path)}'
                        )
                        message.attach(part)
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            # Send email
            send_result = self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            print(f"✅ Email sent successfully! Message ID: {send_result['id']}")
            return True
            
        except HttpError as error:
            print(f"❌ Gmail API error: {error}")
            return False
        except Exception as e:
            print(f"❌ Error sending email: {e}")
            return False

def setup_service_account_email():
    """
    Setup function for Service Account email sending.
    Better for pipelineworkforce.com website use.
    """
    print("🚀 Gmail Service Account Setup for Pipeline Workforce")
    print("🌐 Perfect for website email sending (no user interaction required)")
    print("=" * 60)
    
    sender = ServiceAccountEmailSender()
    
    if sender.setup_service_account():
        print("\n✅ Setup completed! Testing email sending...")
        
        # Test email
        test_result = sender.send_email(
            to_emails=["info@pipelineworkforce.com"],
            subject="🎉 Service Account Email Setup Successful!",
            body="Your Service Account email setup is working correctly for pipelineworkforce.com!",
            html_body="<h2>🎉 Service Account Email Setup Successful!</h2><p>Your Service Account email setup is working correctly for <strong>pipelineworkforce.com</strong>!</p>"
        )
        
        if test_result:
            print("✅ Test email sent successfully!")
            print("\n🔧 Integration code for your website:")
            print("""
from service_account_email import ServiceAccountEmailSender

# In your website code
def send_contact_form_email(name, email, message):
    sender = ServiceAccountEmailSender()
    sender.setup_service_account()
    
    return sender.send_email(
        to_emails=['info@pipelineworkforce.com'],
        subject=f'Contact Form: {name}',
        body=f'From: {name} <{email}>\\n\\nMessage:\\n{message}',
        html_body=f'<p><strong>From:</strong> {name} &lt;{email}&gt;</p><p><strong>Message:</strong></p><p>{message}</p>'
    )
            """)
        else:
            print("❌ Test email failed. Check your setup.")
    else:
        print("❌ Setup failed. Please follow the instructions above.")

if __name__ == "__main__":
    setup_service_account_email() 