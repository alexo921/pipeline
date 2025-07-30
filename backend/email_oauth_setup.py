#!/usr/bin/env python3
"""
Gmail OAuth 2.0 Email Sender
============================

Secure email sending using OAuth 2.0 instead of "less secure apps"
Compliant with Google's March 2025 security requirements.
"""

import os
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import pickle
from typing import List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow, InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json

class GmailOAuthSender:
    """
    Gmail OAuth 2.0 email sender for secure email operations.
    Replaces basic authentication for compliance with Google's security requirements.
    """
    
    # Gmail API scope for sending emails
    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    
    def __init__(self, credentials_file: str = 'credentials.json', token_file: str = 'token.pickle'):
        """
        Initialize Gmail OAuth sender.
        
        Args:
            credentials_file: Path to OAuth 2.0 credentials JSON file
            token_file: Path to store/load authentication tokens
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
        self.creds = None
        
    def setup_oauth_credentials(self, for_website: bool = False):
        """
        Set up OAuth 2.0 credentials. Run this once for initial setup.
        
        Args:
            for_website: True if setting up for website use, False for local/server use
        """
        print("🔐 Setting up Gmail OAuth 2.0 credentials...")
        
        # Check if token file exists
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                self.creds = pickle.load(token)
        
        # If there are no (valid) credentials available, let the user log in
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                print("🔄 Refreshing expired credentials...")
                self.creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Credentials file not found: {self.credentials_file}")
                    print("\n📋 SETUP REQUIRED FOR PIPELINEWORKFORCE.COM:")
                    print("1. Go to Google Cloud Console: https://console.cloud.google.com/")
                    print("2. Create a new project: 'Pipeline Workforce Email'")
                    print("3. Enable Gmail API")
                    if for_website:
                        print("4. Create OAuth 2.0 credentials (Web application)")
                        print("   - Authorized redirect URIs:")
                        print("   - https://pipelineworkforce.com/auth/google/callback")
                        print("   - https://www.pipelineworkforce.com/auth/google/callback")
                        print("   - https://pipelineworkforce.com/api/auth/google/callback")
                        print("   - https://www.pipelineworkforce.com/api/auth/google/callback")
                    else:
                        print("4. Create OAuth 2.0 credentials (Desktop application)")
                    print("5. Download the JSON file and save as 'credentials.json'")
                    return False
                
                if for_website:
                    print("🌐 For website setup, you need to implement OAuth flow in your web app")
                    print("📋 Use the web application credentials with your website's OAuth handler")
                    return False
                else:
                    print("🌐 Opening browser for OAuth authorization...")
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, self.SCOPES)
                    # For server/local setup with explicit redirect URI
                    self.creds = flow.run_local_server(
                        port=8080, 
                        open_browser=True,
                        authorization_prompt_message='Please visit this URL to authorize the application: {url}',
                        success_message='Authorization successful! You can close this window.',
                        host='localhost'
                    )
            
            # Save the credentials for the next run
            with open(self.token_file, 'wb') as token:
                pickle.dump(self.creds, token)
        
        # Build the Gmail service
        try:
            self.service = build('gmail', 'v1', credentials=self.creds)
            print("✅ Gmail OAuth setup completed successfully!")
            return True
        except Exception as e:
            print(f"❌ Error setting up Gmail service: {e}")
            return False
    
    def send_email(self, to_emails: List[str], subject: str, body: str, 
                   from_email: str = "info@pipelineworkforce.com", 
                   html_body: Optional[str] = None,
                   attachments: Optional[List[str]] = None) -> bool:
        """
        Send email using Gmail API with OAuth 2.0.
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            body: Plain text email body
            from_email: Sender email address
            html_body: Optional HTML email body
            attachments: Optional list of file paths to attach
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.service:
            print("❌ Gmail service not initialized. Run setup_oauth_credentials() first.")
            return False
        
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['to'] = ', '.join(to_emails)
            message['from'] = f'Pipeline <{from_email}>'
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
    
    def send_job_results(self, jobs_data: List[dict], recipient_emails: List[str]) -> bool:
        """
        Send job scraping results via email.
        
        Args:
            jobs_data: List of job dictionaries from scraper
            recipient_emails: List of email addresses to send to
            
        Returns:
            True if sent successfully
        """
        subject = f"🏥 Healthcare Jobs Report - {len(jobs_data)} Jobs Found"
        
        # Create HTML email with job summary
        html_body = f"""
        <html>
        <body>
            <h2>🏥 Healthcare Jobs Scraping Report</h2>
            <p><strong>Total Jobs Found:</strong> {len(jobs_data)}</p>
            <p><strong>Generated:</strong> {jobs_data[0].get('scraped_at', 'N/A') if jobs_data else 'N/A'}</p>
            
            <h3>📊 Summary by Source:</h3>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; text-align: left;">Source</th>
                    <th style="padding: 8px; text-align: left;">Jobs</th>
                </tr>
        """
        
        # Count jobs by source
        source_counts = {}
        for job in jobs_data:
            source = job.get('source', 'Unknown')
            source_counts[source] = source_counts.get(source, 0) + 1
        
        for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            html_body += f"""
                <tr>
                    <td style="padding: 8px;">{source}</td>
                    <td style="padding: 8px;">{count}</td>
                </tr>
            """
        
        html_body += """
            </table>
            
            <h3>🎯 Sample Jobs:</h3>
            <ul>
        """
        
        # Add sample jobs
        for job in jobs_data[:5]:
            title = job.get('title', 'No title')
            company = job.get('company', 'No company')
            location = job.get('location', 'No location')
            html_body += f"<li><strong>{title}</strong> at {company} - {location}</li>"
        
        html_body += """
            </ul>
            
            <p>📁 Full results are attached as JSON and CSV files.</p>
            
            <p><em>Generated by Pipeline Healthcare Job Scraper</em></p>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
        Healthcare Jobs Scraping Report
        ==============================
        
        Total Jobs Found: {len(jobs_data)}
        Generated: {jobs_data[0].get('scraped_at', 'N/A') if jobs_data else 'N/A'}
        
        Top Sources:
        """
        
        for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            text_body += f"- {source}: {count} jobs\n"
        
        text_body += f"""
        
        Sample Jobs:
        """
        
        for job in jobs_data[:5]:
            title = job.get('title', 'No title')
            company = job.get('company', 'No company')
            location = job.get('location', 'No location')
            text_body += f"- {title} at {company} - {location}\n"
        
        text_body += "\nFull results are attached as JSON and CSV files.\n"
        
        return self.send_email(
            to_emails=recipient_emails,
            subject=subject,
            body=text_body,
            html_body=html_body
        )

def setup_gmail_oauth():
    """
    One-time setup function for Gmail OAuth 2.0.
    Run this to configure OAuth credentials.
    """
    print("🚀 Gmail OAuth 2.0 Setup for Pipeline Workforce")
    print("=" * 50)
    
    sender = GmailOAuthSender()
    
    if sender.setup_oauth_credentials():
        print("\n✅ Setup completed! You can now send emails securely.")
        print("\n📧 Test sending an email:")
        
        # Test email
        test_result = sender.send_email(
            to_emails=["info@pipelineworkforce.com"],  # Send to yourself for testing
            subject="🎉 Gmail OAuth Setup Successful!",
            body="Your Gmail OAuth 2.0 setup is working correctly. You're ready for Google's March 2025 security requirements!",
            html_body="<h2>🎉 Gmail OAuth Setup Successful!</h2><p>Your Gmail OAuth 2.0 setup is working correctly. You're ready for Google's <strong>March 2025</strong> security requirements!</p>"
        )
        
        if test_result:
            print("✅ Test email sent successfully!")
        else:
            print("❌ Test email failed. Check your setup.")
    else:
        print("❌ Setup failed. Please check the instructions above.")

if __name__ == "__main__":
    setup_gmail_oauth() 