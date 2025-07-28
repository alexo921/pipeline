import * as dotenv from 'dotenv';
import { EmailService } from './email.service';

// Load environment variables from .env file
dotenv.config();

async function testAllEmails() {
  console.log('📧 Starting comprehensive email testing...\n');
  
  const emailService = new EmailService();
  
  // Test data
  const testEmail = 'test@example.com';
  const testName = 'Test User';
  const testFirstName = 'Test';
  const testToken = 'test-token-12345';
  const testCity = 'Hartford';
  const testJobCount = 15;

  try {
    console.log('🧪 Testing all email types...\n');

    // 1. Test basic email
    console.log('1️⃣ Testing basic email...');
    await emailService.sendMail(testEmail, 'Test Basic Email', testName, 'This is a test of the basic email functionality.');
    console.log('✅ Basic email sent\n');

    // 2. Test password reset email
    console.log('2️⃣ Testing password reset email...');
    await emailService.sendPasswordResetEmail(testEmail, testToken, testName);
    console.log('✅ Password reset email sent\n');

    // 3. Test verification email
    console.log('3️⃣ Testing verification email...');
    await emailService.sendVerificationEmail(testEmail, testToken);
    console.log('✅ Verification email sent\n');

    // 4. Test welcome email
    console.log('4️⃣ Testing welcome email...');
    await emailService.sendWelcomeEmail(testEmail, testFirstName);
    console.log('✅ Welcome email sent\n');

    // 5. Test partial signup reminder
    console.log('5️⃣ Testing partial signup reminder...');
    await emailService.sendPartialSignupReminder(testEmail, testFirstName);
    console.log('✅ Partial signup reminder sent\n');

    // 6. Test apply nudge email
    console.log('6️⃣ Testing apply nudge email...');
    await emailService.sendApplyNudgeEmail(testEmail, testFirstName);
    console.log('✅ Apply nudge email sent\n');

    // 7. Test local job alert
    console.log('7️⃣ Testing local job alert...');
    await emailService.sendLocalJobAlert(testEmail, testFirstName, testCity, testJobCount);
    console.log('✅ Local job alert sent\n');

    // 8. Test launch email
    console.log('8️⃣ Testing launch email...');
    await emailService.sendLaunchEmail(testEmail, testFirstName);
    console.log('✅ Launch email sent\n');

    // 9. Test Gmail fallback method
    console.log('9️⃣ Testing Gmail fallback method...');
    await emailService.sendMailWithGmailFallback(testEmail, 'Test Gmail Fallback', testName, 'This tests the Gmail API fallback functionality.');
    console.log('✅ Gmail fallback email sent\n');

    // 10. Test template mail
    console.log('🔟 Testing template mail...');
    await emailService.sendTemplateMail(testEmail, 'Test Template Email', 'verification-email', { url: 'https://example.com/verify' });
    console.log('✅ Template email sent\n');

    console.log('🎉 All email tests completed successfully!');
    console.log('📬 Check your inboxes at:');
    console.log('   - alex@pipelineworkforce.com');
    console.log('   - jonathan@pipelineworkforce.com');
    console.log('\n📧 All emails should have [TEST] prefix in the subject line.');

  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testAllEmails(); 