const nodemailer = require('nodemailer');

// Clean SMTP_HOST (remove any trailing characters like backticks)
const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim().replace(/[`'"]/g, '');
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').trim();

// Determine if we should use secure connection (SSL) based on port
const useSecure = process.env.SMTP_PORT === '465' || process.env.SMTP_PORT === 465;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

// Check if SMTP is configured
const isConfigured = smtpUser && smtpPass && smtpHost;

if (!isConfigured) {
  console.warn('⚠️  SMTP not fully configured. Email sending will fail.');
  console.warn('   Required: SMTP_HOST, SMTP_USER, SMTP_PASS');
  console.warn('   Current:');
  console.warn(`     SMTP_HOST: ${smtpHost || 'NOT SET'}`);
  console.warn(`     SMTP_USER: ${smtpUser || 'NOT SET'}`);
  console.warn(`     SMTP_PASS: ${smtpPass ? '***SET***' : 'NOT SET'}`);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: useSecure, // true for 465, false for other ports
  auth: isConfigured ? {
    user: smtpUser,
    pass: smtpPass,
  } : undefined,
  // For @rmu.edu.gh or other institutional emails, may need TLS
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates if needed
  },
  // Add connection timeout
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verify connection on startup (async)
(async function verifySMTP() {
  if (!isConfigured) {
    console.error('❌ SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env');
    return;
  }

  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to send emails');
    console.log(`   Host: ${smtpHost}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   User: ${smtpUser}`);
    console.log(`   From: ${process.env.EMAIL_FROM || smtpUser}`);
  } catch (error) {
    console.error('❌ SMTP Configuration Error:', error.message);
    console.error('   Full error:', error);
    console.error('   Please check your SMTP settings in backend/.env');
    console.error('   Email verification will not work until SMTP is configured correctly.');
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('   → Authentication failed. Check SMTP_USER and SMTP_PASS');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('   → Connection failed. Check SMTP_HOST and SMTP_PORT');
      console.error('   → Make sure the SMTP server is accessible');
    } else if (error.code === 'ESOCKET') {
      console.error('   → Socket error. Check network/firewall settings');
    }
  }
})();

module.exports = transporter;

