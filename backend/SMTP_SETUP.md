# SMTP Email Configuration Guide

This guide will help you configure SMTP settings to enable email verification for student registrations.

## Quick Setup

Run the interactive configuration script:

```bash
cd backend
npm run smtp:configure
```

## Manual Configuration

Edit `backend/.env` and update these values:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="RMU Internship Portal" <noreply@rmu.edu.gh>
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup (Recommended)

### Step 1: Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Enter "RMU Internship Portal" as the name
4. Click "Generate"
5. Copy the 16-character password (spaces will be removed automatically)

### Step 3: Update .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Use the 16-char app password (spaces optional)
```

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_password
```

## Testing

After configuration:

1. **Restart backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Register a test student:**
   - Go to http://localhost:3000/register
   - Register with a student email (@st.rmu.edu.gh)
   - Check the email inbox for verification link

3. **Check backend logs:**
   - If email fails, check console for error messages
   - Common issues:
     - Wrong app password (Gmail)
     - 2-Step Verification not enabled (Gmail)
     - Firewall blocking port 587
     - Incorrect SMTP credentials

## Troubleshooting

### Gmail "Less secure app access" error
- Use App Password instead of regular password
- Enable 2-Step Verification first

### Connection timeout
- Check firewall settings
- Verify SMTP port (587 for TLS, 465 for SSL)
- Some networks block SMTP ports

### Authentication failed
- Double-check username and password
- For Gmail, ensure you're using App Password, not regular password
- Check if account has any security restrictions

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords for Gmail (more secure)
- Consider using environment variables in production
- Rotate passwords regularly
