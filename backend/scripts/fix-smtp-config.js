const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');
let fixed = false;

// Fix SMTP_HOST - remove trailing backticks, quotes, or spaces
const smtpHostMatch = envContent.match(/SMTP_HOST=(.+)/);
if (smtpHostMatch) {
  const oldValue = smtpHostMatch[1];
  const newValue = oldValue.trim().replace(/[`'"]/g, '');
  if (oldValue !== newValue) {
    envContent = envContent.replace(/SMTP_HOST=.*/g, `SMTP_HOST=${newValue}`);
    console.log(`✅ Fixed SMTP_HOST: "${oldValue}" → "${newValue}"`);
    fixed = true;
  }
}

// Fix SMTP_USER - remove trailing backticks, quotes, or spaces
const smtpUserMatch = envContent.match(/SMTP_USER=(.+)/);
if (smtpUserMatch) {
  const oldValue = smtpUserMatch[1];
  const newValue = oldValue.trim().replace(/[`'"]/g, '');
  if (oldValue !== newValue) {
    envContent = envContent.replace(/SMTP_USER=.*/g, `SMTP_USER=${newValue}`);
    console.log(`✅ Fixed SMTP_USER: "${oldValue}" → "${newValue}"`);
    fixed = true;
  }
}

// Fix SMTP_PASS - remove trailing backticks, quotes, or spaces (but keep spaces in middle for app passwords)
const smtpPassMatch = envContent.match(/SMTP_PASS=(.+)/);
if (smtpPassMatch) {
  const oldValue = smtpPassMatch[1];
  // Remove only leading/trailing quotes and backticks, keep spaces in middle
  const newValue = oldValue.trim().replace(/^[`'"]+|[`'"]+$/g, '');
  if (oldValue !== newValue) {
    envContent = envContent.replace(/SMTP_PASS=.*/g, `SMTP_PASS=${newValue}`);
    console.log(`✅ Fixed SMTP_PASS: removed trailing characters`);
    fixed = true;
  }
}

if (fixed) {
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file fixed! Please restart your backend server.');
} else {
  console.log('✅ No issues found in .env file.');
}

// Display current configuration
console.log('\n=== Current SMTP Configuration ===');
const lines = envContent.split('\n');
lines.forEach(line => {
  if (line.includes('SMTP_') || line.includes('EMAIL_') || line.includes('FRONTEND_URL')) {
    if (line.includes('SMTP_PASS')) {
      const passMatch = line.match(/SMTP_PASS=(.+)/);
      if (passMatch) {
        const pass = passMatch[1];
        console.log(`SMTP_PASS=${pass.substring(0, 4)}...${pass.substring(pass.length - 4)} (hidden)`);
      }
    } else {
      console.log(line);
    }
  }
});
