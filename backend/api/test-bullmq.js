const { Queue } = require('bullmq');

async function testBullMQ() {
  console.log('🧪 Testing BullMQ Setup...\n');

  // Test connection to Redis
  const emailQueue = new Queue('email-queue', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    }
  });

  const scheduledJobsQueue = new Queue('scheduled-jobs', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    }
  });

  try {
    // Test adding a job to email queue
    console.log('📧 Testing email queue...');
    const emailJob = await emailQueue.add('test-email', {
      to: 'test@example.com',
      subject: 'Test Email',
      template: 'welcome-email',
      context: { firstName: 'Test User' }
    });
    console.log(`✅ Email job added with ID: ${emailJob.id}`);

    // Test adding a delayed job to scheduled jobs queue
    console.log('\n⏰ Testing scheduled jobs queue...');
    const scheduledJob = await scheduledJobsQueue.add('test-scheduled', {
      type: 'tier2-followup',
      userId: 'test-user-id',
      userEmail: 'test@example.com',
      attempt: 1
    }, { delay: 5000 }); // 5 second delay
    console.log(`✅ Scheduled job added with ID: ${scheduledJob.id}`);

    // Get queue stats
    console.log('\n📊 Queue Statistics:');
    const emailStats = await emailQueue.getJobCounts();
    const scheduledStats = await scheduledJobsQueue.getJobCounts();
    
    console.log('Email Queue:', emailStats);
    console.log('Scheduled Jobs Queue:', scheduledStats);

    // Clean up test jobs
    console.log('\n🧹 Cleaning up test jobs...');
    await emailJob.remove();
    await scheduledJob.remove();
    console.log('✅ Test jobs cleaned up');

    console.log('\n🎉 BullMQ setup is working correctly!');
    
  } catch (error) {
    console.error('❌ BullMQ test failed:', error.message);
    process.exit(1);
  } finally {
    await emailQueue.close();
    await scheduledJobsQueue.close();
  }
}

testBullMQ(); 