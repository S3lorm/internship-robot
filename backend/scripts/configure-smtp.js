const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function configureSMTP() {
  console.log('\n=== SMTP Email Configuration ===\n');
  console.log('This will help you configure email settings for verification emails.\n');
  console.log('For Gmail:');
  console.log('  1. Enable 2-Step Verification in your Google Account');
  console.log('  2. Generate an App Password: https://myaccount.google.com/apppasswords');
  console.log('  3. Use the 16-character app password (not your regular password)\n');

  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Read from env.example
    const examplePath = path.join(__dirname, '..', 'env.example');
    envContent = fs.readFileSync(examplePath, 'utf8');
  }

  console.log('Current SMTP settings:');
  const smtpHostMatch = envContent.match(/SMTP_HOST=(.+)/);
  const smtpUserMatch = envContent.match(/SMTP_USER=(.+)/);
  console.log(`  Host: ${smtpHostMatch ? smtpHostMatch[1] : 'not set'}`);
  console.log(`  User: ${smtpUserMatch ? smtpUserMatch[1] : 'not set'}\n`);

  const useGmail = await question('Are you using Gmail? (y/n): ');
  
  let smtpHost, smtpPort, smtpUser, smtpPass;

  if (useGmail.toLowerCase() === 'y' || useGmail.toLowerCase() === 'yes') {
    smtpHost = 'smtp.gmail.com';
    smtpPort = '587';
    smtpUser = await question('Enter your Gmail address: ');
    console.log('\n⚠️  IMPORTANT: Use an App Password, not your regular Gmail password!');
    console.log('   Get one here: https://myaccount.google.com/apppasswords\n');
    smtpPass = await question('Enter your Gmail App Password (16 characters): ');
  } else {
    smtpHost = await question('Enter SMTP host (e.g., smtp.gmail.com): ');
    smtpPort = await question('Enter SMTP port (587 for TLS, 465 for SSL): ');
    smtpUser = await question('Enter SMTP username/email: ');
    smtpPass = await question('Enter SMTP password: ');
  }

  const emailFrom = await question('Enter sender email display name (default: RMU Internship Portal): ') || 'RMU Internship Portal';
  const frontendUrl = await question('Enter frontend URL (default: http://localhost:3000): ') || 'http://localhost:3000';

  // Update .env file
  let updatedContent = envContent;

  // Replace or add SMTP settings
  updatedContent = updatedContent.replace(/SMTP_HOST=.*/g, `SMTP_HOST=${smtpHost}`);
  updatedContent = updatedContent.replace(/SMTP_PORT=.*/g, `SMTP_PORT=${smtpPort}`);
  updatedContent = updatedContent.replace(/SMTP_USER=.*/g, `SMTP_USER=${smtpUser}`);
  updatedContent = updatedContent.replace(/SMTP_PASS=.*/g, `SMTP_PASS=${smtpPass}`);
  updatedContent = updatedContent.replace(/EMAIL_FROM=.*/g, `EMAIL_FROM="${emailFrom}" <${smtpUser}>`);
  updatedContent = updatedContent.replace(/FRONTEND_URL=.*/g, `FRONTEND_URL=${frontendUrl}`);

  // If settings don't exist, add them
  if (!updatedContent.includes('SMTP_HOST=')) {
    updatedContent += `\n# Email (SMTP)\nSMTP_HOST=${smtpHost}\nSMTP_PORT=${smtpPort}\nSMTP_USER=${smtpUser}\nSMTP_PASS=${smtpPass}\nEMAIL_FROM="${emailFrom}" <${smtpUser}>\n`;
  }

  fs.writeFileSync(envPath, updatedContent);

  console.log('\n✅ SMTP configuration saved to backend/.env');
  console.log('\n📧 Test your configuration:');
  console.log('   1. Restart your backend server');
  console.log('   2. Register a new student account');
  console.log('   3. Check the email inbox for verification link\n');

  rl.close();
}

configureSMTP().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
