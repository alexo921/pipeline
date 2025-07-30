#!/usr/bin/env node

/**
 * Launch Email Sender Script
 * ==========================
 * 
 * Sends launch emails to waitlist subscribers from CSV file.
 * 
 * Usage:
 *   node scripts/send-launch-emails.js [limit]
 * 
 * Examples:
 *   node scripts/send-launch-emails.js 10    # Send to first 10 people
 *   node scripts/send-launch-emails.js all   # Send to all people
 *   node scripts/send-launch-emails.js       # Send to all people (default)
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// Configuration
const CSV_FILE = 'Pipeline Waitlist_Submissions_2025-07-15.csv';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const EMAIL_ENDPOINT = `${API_BASE_URL}/api/auth/send-launch`;

// Parse command line arguments
const limitArg = process.argv[2];
const limit = limitArg === 'all' || !limitArg ? null : parseInt(limitArg);

if (limit && (isNaN(limit) || limit <= 0)) {
  console.error('❌ Invalid limit. Please provide a positive number or "all".');
  console.log('Usage: node scripts/send-launch-emails.js [limit]');
  process.exit(1);
}

console.log('🚀 Pipeline Launch Email Sender');
console.log('================================');
console.log(`📁 CSV File: ${CSV_FILE}`);
console.log(`📧 API Endpoint: ${EMAIL_ENDPOINT}`);
console.log(`📊 Limit: ${limit ? limit : 'all'}`);
console.log('');

// Read and parse CSV file
function readWaitlistCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    const csvPath = path.join(process.cwd(), CSV_FILE);
    
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file not found: ${csvPath}`));
      return;
    }
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        // Extract first name from full name
        const fullName = data['Full Name']?.trim();
        const firstName = fullName ? fullName.split(' ')[0] : 'there';
        
        results.push({
          fullName: fullName || 'Unknown',
          firstName: firstName,
          email: data['Email']?.trim(),
          phone: data['Phone Number']?.trim()
        });
      })
      .on('end', () => {
        console.log(`✅ Loaded ${results.length} subscribers from CSV`);
        resolve(results);
      })
      .on('error', reject);
  });
}

// Send launch email to a single subscriber
async function sendLaunchEmail(subscriber) {
  try {
    const response = await axios.post(EMAIL_ENDPOINT, {
      email: subscriber.email,
      firstName: subscriber.firstName
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    return { success: true, subscriber, response: response.data };
  } catch (error) {
    return { 
      success: false, 
      subscriber, 
      error: error.response?.data?.message || error.message 
    };
  }
}

// Main execution
async function main() {
  try {
    // Read CSV file
    console.log('📖 Reading waitlist CSV...');
    const subscribers = await readWaitlistCSV();
    
    if (subscribers.length === 0) {
      console.log('❌ No subscribers found in CSV file.');
      return;
    }
    
    // Filter and limit subscribers
    let subscribersToEmail = subscribers.filter(sub => sub.email);
    
    if (limit) {
      subscribersToEmail = subscribersToEmail.slice(0, limit);
    }
    
    console.log(`📧 Preparing to send emails to ${subscribersToEmail.length} subscribers`);
    console.log('');
    
    // Confirm before sending
    console.log('⚠️  WARNING: This will send actual launch emails!');
    console.log('Press Ctrl+C to cancel, or any key to continue...');
    
    // Wait for user input (simple timeout-based approach)
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 3000); // 3 second timeout
      process.stdin.once('data', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    console.log('');
    console.log('🚀 Starting email send process...');
    console.log('');
    
    // Send emails with progress tracking
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < subscribersToEmail.length; i++) {
      const subscriber = subscribersToEmail[i];
      const progress = `${i + 1}/${subscribersToEmail.length}`;
      
      console.log(`📧 [${progress}] Sending to ${subscriber.firstName} (${subscriber.email})...`);
      
      const result = await sendLaunchEmail(subscriber);
      
      if (result.success) {
        console.log(`✅ [${progress}] Sent successfully to ${subscriber.firstName}`);
        results.sent++;
      } else {
        console.log(`❌ [${progress}] Failed to send to ${subscriber.firstName}: ${result.error}`);
        results.failed++;
        results.errors.push({
          subscriber: subscriber.firstName,
          email: subscriber.email,
          error: result.error
        });
      }
      
      // Add a small delay between emails to avoid rate limiting
      if (i < subscribersToEmail.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Print summary
    console.log('');
    console.log('📊 Email Send Summary');
    console.log('====================');
    console.log(`✅ Successfully sent: ${results.sent}`);
    console.log(`❌ Failed to send: ${results.failed}`);
    console.log(`📈 Success rate: ${((results.sent / subscribersToEmail.length) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
      console.log('');
      console.log('❌ Failed emails:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.subscriber} (${error.email}): ${error.error}`);
      });
    }
    
    console.log('');
    console.log('🎉 Launch email campaign completed!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { readWaitlistCSV, sendLaunchEmail }; 