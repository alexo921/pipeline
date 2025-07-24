import * as dotenv from 'dotenv';
import { EmailService } from './email.service';

// Load environment variables from .env file
dotenv.config();

async function testRealEmail() {
  console.log('🚀 Starting real email test...');
  
  try {
    // Create email service directly
    const emailService = new EmailService();
    
    console.log('📧 Sending real welcome email to alex@pipelineworkforce.com...');
    
    // Test welcome email template
    await emailService.sendTemplateMail(
      'alex@pipelineworkforce.com',
      'Welcome to Pipeline - Test Email',
      'welcome-email',
      {
        firstName: 'Alex',
        jobsUrl: 'https://pipelineworkforce.com/jobs'
      }
    );
    
    console.log('✅ Email sent successfully! Check your inbox at alex@pipelineworkforce.com');
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testRealEmail(); 