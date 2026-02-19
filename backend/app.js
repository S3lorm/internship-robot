const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const supabase = require('./config/supabase');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const internshipRoutes = require('./routes/internships');
const applicationRoutes = require('./routes/applications');
const noticeRoutes = require('./routes/notices');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const profileRoutes = require('./routes/profile');
const testRoutes = require('./routes/test');
const letterRoutes = require('./routes/letters');
const reminderRoutes = require('./routes/reminders');
const evaluationRoutes = require('./routes/evaluations');
const feedbackAcknowledgmentRoutes = require('./routes/feedback-acknowledgment');
const securityRoutes = require('./routes/security');
const activityLogger = require('./middleware/activityLogger');
const { apiLimiter } = require('./middleware/security');

const app = express();

// Middleware
// Configure helmet to allow CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Activity logging middleware
app.use('/api', activityLogger);

// Static files (uploads)
const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadPath));

// Static files (signatures)
app.use('/signatures', express.static(path.join(__dirname, 'public', 'signatures')));

// Health check endpoint (before auth middleware)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'RMU Internship API is running' 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/test', testRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/feedback', feedbackAcknowledgmentRoutes);
app.use('/api/security', securityRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Server error',
  });
});

// Test Supabase connection (non-blocking)
(async () => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase query error:', error.message || error);
    } else {
      console.log('✅ Supabase connection established');
    }
  } catch (err) {
    console.error('❌ Unable to connect to Supabase:', err.message || err);
    // Don't crash the server - just log the error
    // The server can still start, but database operations will fail
  }
})();

module.exports = app;

