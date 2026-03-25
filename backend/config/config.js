const dotenv = require('dotenv');
dotenv.config();

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const config = {
  // Environment
  isDev,
  isProd,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Server
  port: parseInt(process.env.PORT || '5000', 10),

  // Frontend URL — used for CORS, email links, evaluation URLs
  frontendUrl: process.env.FRONTEND_URL || (isDev
    ? 'http://localhost:3000'
    : 'https://internship-robot-omega.vercel.app'),

  // API URL — used when backend needs to reference itself
  apiUrl: process.env.API_URL || (isDev
    ? 'http://localhost:5000/api'
    : 'https://internship-robot-omlp.vercel.app/api'),

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-keys',

  // SMTP / Email
  smtp: {
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim().replace(/[`'"]/g, ''),
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    user: (process.env.SMTP_USER || '').trim(),
    pass: (process.env.SMTP_PASS || '').trim(),
    secure: (process.env.SMTP_PORT || '465') === '465',
  },
  emailFrom: process.env.EMAIL_FROM || `"RMU Internship Portal" <${(process.env.SMTP_USER || 'noreply@rmu.edu.gh').trim()}>`,

  // CORS — allowed origins
  corsOrigins: [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    'https://internship-robot-omega.vercel.app',
  ].filter(Boolean),
};

// Startup log
if (isDev) {
  console.log('🔧 [DEV] Configuration loaded:');
  console.log(`   Frontend URL: ${config.frontendUrl}`);
  console.log(`   API URL:      ${config.apiUrl}`);
  console.log(`   Port:         ${config.port}`);
} else {
  console.log(`🚀 [PROD] Server starting on port ${config.port}`);
}

module.exports = config;
