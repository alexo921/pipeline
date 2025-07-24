import * as dotenv from 'dotenv';
import { EmailService } from './email.service';

// Load environment variables from .env file
dotenv.config();

async function testGmailAPI() {
  console.log('🚀 Testing Gmail API directly...');
  
  try {
    const emailService = new EmailService();
    
    // Check if Gmail is authorized
    console.log('📧 Checking Gmail authorization...');
    const isAuthorized = emailService.isGmailAuthorized();
    console.log('Gmail authorized:', isAuthorized);
    
    if (!isAuthorized) {
      console.log('❌ Gmail not authorized');
      return;
    }
    
    // Get tokens
    const tokens = emailService.getGmailTokens();
    console.log('✅ Tokens loaded:', !!tokens);
    console.log('Token expires in:', tokens?.expires_in, 'seconds');
    
    // Test a simple email send
    console.log('📧 Testing Gmail API email send...');
    
    const testHtml = `
      <html>
        <body>
          <h1>Test Email</h1>
          <p>This is a test email sent via Gmail API.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </body>
      </html>
    `;
    
    const result = await emailService.sendEmailViaGmailAPI(
      'alex@pipelineworkforce.com',
      'Gmail API Test - ' + new Date().toISOString(),
      testHtml
    );
    
    console.log('✅ Gmail API email sent successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Gmail API test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testGmailAPI(); 