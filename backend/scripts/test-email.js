const dotenv = require('dotenv');
const { sendVerificationEmail } = require('../services/emailService');
const { User } = require('../models');

dotenv.config();

async function testEmail() {
  try {
    console.log('Testing email configuration...\n');
    
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
      console.log('❌ SMTP not configured!');
      console.log('   Run: npm run smtp:configure');
      console.log('   Or edit backend/.env manually\n');
      process.exit(1);
    }

    console.log('SMTP Configuration:');
    console.log(`  Host: ${process.env.SMTP_HOST}`);
    console.log(`  Port: ${process.env.SMTP_PORT}`);
    console.log(`  User: ${process.env.SMTP_USER}`);
    console.log(`  From: ${process.env.EMAIL_FROM}`);
    console.log(`  Frontend: ${process.env.FRONTEND_URL}\n`);

    // Create a test user object
    const testUser = {
      email: process.env.SMTP_USER, // Send to yourself for testing
      firstName: 'Test',
      lastName: 'User',
    };

    const testToken = 'test-verification-token-12345';

    console.log('Sending test verification email...');
    await sendVerificationEmail(testUser, testToken);
    
    console.log('✅ Test email sent successfully!');
    console.log(`\nCheck your inbox: ${testUser.email}`);
    console.log('If you don\'t see it, check spam folder.\n');
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error(error.message);
    console.error('\nCommon issues:');
    console.error('  - Wrong SMTP credentials');
    console.error('  - Gmail: Use App Password, not regular password');
    console.error('  - Firewall blocking port 587');
    console.error('  - 2-Step Verification not enabled (Gmail)');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testEmail();
