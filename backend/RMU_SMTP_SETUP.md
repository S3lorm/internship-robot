# RMU Email (@rmu.edu.gh) SMTP Configuration

This guide will help you configure SMTP using the @rmu.edu.gh email domain for sending verification emails.

## Configuration Steps

### 1. Get SMTP Settings from IT Department

Contact your IT department to get the SMTP server details for @rmu.edu.gh emails. Common settings:

- **SMTP Host**: `mail.rmu.edu.gh` or `smtp.rmu.edu.gh`
- **SMTP Port**: `587` (TLS) or `465` (SSL)
- **Authentication**: Usually your full email and password

### 2. Update backend/.env

Edit `backend/.env` and set:

```env
SMTP_HOST=mail.rmu.edu.gh
SMTP_PORT=587
SMTP_USER=noreply@rmu.edu.gh
SMTP_PASS=your_email_password
EMAIL_FROM="RMU Internship Portal" <noreply@rmu.edu.gh>
FRONTEND_URL=http://localhost:3000
```

**Note**: Replace `noreply@rmu.edu.gh` with an actual email account that has SMTP access.

### 3. Test Email Configuration

Run the test script:

```bash
cd backend
npm run email:test
```

This will send a test verification email to verify your SMTP settings are correct.

### 4. Restart Backend Server

After configuration:

```bash
cd backend
npm run dev
```

You should see:
```
✅ SMTP server is ready to send emails
   Host: mail.rmu.edu.gh
   From: RMU Internship Portal <noreply@rmu.edu.gh>
```

## Common SMTP Settings for Institutional Emails

### Option 1: Standard SMTP (Port 587 - TLS)
```env
SMTP_HOST=mail.rmu.edu.gh
SMTP_PORT=587
SMTP_USER=your_email@rmu.edu.gh
SMTP_PASS=your_password
```

### Option 2: SSL SMTP (Port 465)
```env
SMTP_HOST=mail.rmu.edu.gh
SMTP_PORT=465
SMTP_USER=your_email@rmu.edu.gh
SMTP_PASS=your_password
```

### Option 3: Microsoft Exchange/Office 365
If RMU uses Office 365:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your_email@rmu.edu.gh
SMTP_PASS=your_password
```

## Troubleshooting

### Error: "Connection timeout"
- Check if port 587 or 465 is blocked by firewall
- Verify SMTP_HOST is correct
- Try port 465 if 587 doesn't work

### Error: "Authentication failed"
- Verify username is full email: `your_email@rmu.edu.gh`
- Check password is correct
- Some servers require domain\username format

### Error: "Self-signed certificate"
- The code already handles this with `rejectUnauthorized: false`
- If still having issues, contact IT for certificate details

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check backend console for error messages
- Ensure SMTP server allows relaying from your server IP

## Verification Flow

1. **Student registers** → Verification email sent automatically
2. **Student clicks link** → Email verified, can access dashboard
3. **Unverified student tries to login** → Blocked, redirected to verification page
4. **Unverified student tries to access dashboard** → Redirected to verification page

## Security Notes

- Never commit `.env` file to version control
- Use a dedicated email account for sending (not personal)
- Consider using email service like SendGrid or Mailgun for production
- Rotate passwords regularly

## Production Recommendations

For production, consider:
- Using a dedicated email service (SendGrid, Mailgun, AWS SES)
- Setting up SPF/DKIM records for better deliverability
- Using environment variables instead of .env file
- Implementing email queue for better reliability
