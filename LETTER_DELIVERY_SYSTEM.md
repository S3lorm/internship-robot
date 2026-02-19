# PDF Letter Delivery & Notification System

## Overview

The PDF Letter Delivery & Notification System provides a complete solution for managing internship letter requests with PDF generation, notifications, and document tracking.

## Features Implemented

### 1. Dashboard Notifications (Real-time Indicators)
- ✅ Visual badges on approved letter requests showing "PDF Ready"
- ✅ Highlighted cards for newly approved requests
- ✅ Notification system integration for status updates
- ✅ Real-time status updates when requests are approved/rejected

### 2. Optional Email Alerts
- ✅ Email notifications sent when letters are approved
- ✅ Configurable email sending (can be disabled)
- ✅ Professional HTML email templates with all request details
- ✅ Email includes reference number and verification code
- ✅ Direct link to download letter from dashboard

### 3. Document Reference Number / Verification Code
- ✅ Auto-generated reference numbers (format: LR-YYYYMMDD-XXXXX)
- ✅ 6-digit verification codes for document authenticity
- ✅ Reference numbers displayed on all letter requests
- ✅ Verification codes included in PDF documents
- ✅ Copy-to-clipboard functionality for easy sharing

### 4. Download and Re-download Capability
- ✅ One-click PDF download from dashboard
- ✅ Print-to-PDF functionality (browser-based)
- ✅ Download count tracking
- ✅ Last downloaded timestamp
- ✅ Unlimited re-downloads for approved letters
- ✅ Download history visible to students

### 5. Approval/Rejection Visibility
- ✅ Clear status badges (Pending, Approved, Rejected)
- ✅ Color-coded status indicators
- ✅ Admin notes visible to students
- ✅ Review timestamp tracking
- ✅ Reviewer information (for admins)

## Database Schema

The system uses the following additional fields in `letter_requests` table:

- `reference_number` - Unique document reference (LR-YYYYMMDD-XXXXX)
- `verification_code` - 6-digit verification code
- `pdf_url` - URL to generated PDF (if stored externally)
- `pdf_generated_at` - Timestamp when PDF was generated
- `email_sent` - Boolean flag for email notification status
- `email_sent_at` - Timestamp when email was sent
- `download_count` - Number of times PDF was downloaded
- `last_downloaded_at` - Timestamp of last download

## API Endpoints

### Student Endpoints
- `GET /api/letters/requests` - Get all student's requests
- `POST /api/letters/requests` - Create new request
- `GET /api/letters/requests/:id` - Get request details
- `GET /api/letters/requests/:id/download` - Download PDF

### Admin Endpoints
- `GET /api/letters/requests` - Get all requests (with filters)
- `PATCH /api/letters/requests/:id/status` - Approve/reject request
  - Body: `{ status: 'approved' | 'rejected', adminNotes?: string, sendEmail?: boolean }`

## Frontend Pages

### Student Dashboard (`/dashboard/letter-requests`)
- **New Request Tab**: Form to submit letter requests
- **All Requests Tab**: View all submitted requests
- **Pending Tab**: View pending requests
- **Approved Tab**: View approved requests with download buttons
- **Rejected Tab**: View rejected requests

### Admin Dashboard (`/admin/letter-requests`)
- **Overview**: Stats cards showing total, pending, approved, rejected
- **Search & Filter**: Search by company/student, filter by status
- **Review Dialog**: 
  - Full request details
  - Student information
  - Company information
  - Approve/Reject buttons
  - Email notification toggle
  - Admin notes field

## Notification Flow

1. **Student Submits Request**
   - Request created with status "pending"
   - Reference number and verification code auto-generated
   - Admin receives notification

2. **Admin Approves Request**
   - Status changed to "approved"
   - PDF generated automatically
   - Student receives dashboard notification
   - Email sent (if enabled)
   - PDF available for download

3. **Student Downloads PDF**
   - Download count incremented
   - Last downloaded timestamp updated
   - PDF opens in new window for printing

## Email Template

The email notification includes:
- Professional HTML template
- Student name and details
- Reference number and verification code
- Company information
- Direct link to download letter
- RMU branding

## Usage Instructions

### For Students

1. Navigate to **Letter Requests** in the dashboard
2. Click **New Request** tab
3. Fill in company and internship details
4. Submit the request
5. Wait for approval notification
6. Once approved, download your letter from the **Approved** tab
7. Use the reference number and verification code to verify the document

### For Admins

1. Navigate to **Letter Requests** in admin dashboard
2. Review pending requests
3. Click **Review** on any request
4. Review all details
5. Add admin notes (optional)
6. Toggle email notification (default: enabled)
7. Click **Approve & Generate PDF** or **Reject**
8. System automatically generates PDF and sends notifications

## Migration Instructions

1. Run migration `007_letter_requests.sql` to create the base table
2. Run migration `008_letter_delivery_enhancements.sql` to add PDF fields
3. Restart the backend server
4. The system is ready to use!

## Technical Notes

- PDFs are generated as HTML that can be printed to PDF by the browser
- For production, consider using Puppeteer or similar for true PDF generation
- Reference numbers are unique and auto-increment per day
- Verification codes are 6-digit random numbers
- Download tracking helps monitor document usage
- Email notifications use the configured SMTP settings

## Future Enhancements

- True PDF generation using Puppeteer
- PDF storage in Supabase Storage or S3
- Batch approval functionality
- Letter templates customization
- Digital signatures
- QR code verification

