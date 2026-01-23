const express = require('express');
const { sendVerificationEmail } = require('../services/emailService');
const router = express.Router();

// Test email endpoint (for debugging)
router.post('/email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }

  try {
    const testUser = {
      email: email,
      firstName: 'Test',
      lastName: 'User',
    };
    const testToken = 'test-verification-token-' + Date.now();

    await sendVerificationEmail(testUser, testToken);
    
    return res.json({ 
      success: true, 
      message: `Test email sent successfully to ${email}` 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to send test email',
      message: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

module.exports = router;
