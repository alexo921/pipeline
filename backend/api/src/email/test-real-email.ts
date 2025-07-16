import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserEventsListener } from './user-events.listener';
import { AccountCreatedEvent } from '../events/user-events';

async function testRealEmail() {
  console.log('🚀 Starting real email test...');
  
  try {
    // Create a minimal app context
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the listener
    const listener = app.get(UserEventsListener);
    
    console.log('📧 Sending real welcome email to alex@pipelineworkforce.com...');
    
    // Test welcome email
    await listener.handleAccountCreated(new AccountCreatedEvent('test-user-1'));
    
    console.log('✅ Email sent successfully! Check your inbox at alex@pipelineworkforce.com');
    
    await app.close();
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

// Run the test
testRealEmail(); 