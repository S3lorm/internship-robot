# System Integrity & Security Controls

## Overview

A comprehensive security and integrity system for the academic workflow and compliance platform, ensuring document authenticity, activity tracking, and controlled access.

## Core Security Features

### 1. Activity Logging & Audit Trail
- ✅ Comprehensive activity logging for all user actions
- ✅ Timestamped actions with IP address and user agent tracking
- ✅ Resource-level activity tracking
- ✅ User activity history
- ✅ Admin audit trail access

### 2. Document Verification Mechanisms
- ✅ SHA-256 hash generation for document integrity
- ✅ Reference number and verification code system
- ✅ Public document verification endpoint
- ✅ Verification count tracking
- ✅ Document tampering detection

### 3. Document Transmission Tracking
- ✅ Complete transmission history
- ✅ Transmission method tracking (email, download, API, manual)
- ✅ Delivery status tracking
- ✅ Open/read tracking
- ✅ Recipient information logging

### 4. Security Event Monitoring
- ✅ Security event logging (unauthorized access, failed logins, etc.)
- ✅ Severity-based event classification
- ✅ Suspicious activity detection
- ✅ Event resolution tracking
- ✅ Admin security dashboard

### 5. Enhanced Role-Based Access Control
- ✅ Granular role-based permissions
- ✅ Resource ownership verification
- ✅ Permission denial logging
- ✅ Automatic security event generation

### 6. Rate Limiting
- ✅ API rate limiting (100 requests per 15 minutes)
- ✅ Strict rate limiting for sensitive operations (5 per 15 minutes)
- ✅ Automatic security event logging for rate limit violations

## Database Schema

### activity_logs Table
Tracks all user activities for audit purposes:
- `user_id` - User who performed the action
- `action_type` - Type of action (login, download, generate, etc.)
- `resource_type` - Type of resource affected
- `resource_id` - ID of the resource
- `description` - Human-readable description
- `ip_address` - IP address of the request
- `user_agent` - Browser/client information
- `metadata` - Additional JSON data
- `created_at` - Timestamp

### document_verification Table
Tracks document authenticity and verification:
- `document_type` - Type of document (letter, evaluation, etc.)
- `document_id` - ID of the document
- `reference_number` - Unique reference number
- `verification_code` - Unique verification code
- `hash_value` - SHA-256 hash of document content
- `generated_by` - User who generated the document
- `verified_at` - When document was verified
- `verification_count` - Number of times verified
- `is_valid` - Whether document is still valid

### document_transmissions Table
Tracks all document sharing and transmission:
- `document_id` - ID of the document
- `document_type` - Type of document
- `sender_id` - User who sent/transmitted
- `recipient_type` - Type of recipient
- `recipient_email` - Email of recipient
- `transmission_method` - How it was sent
- `status` - Transmission status
- `sent_at`, `delivered_at`, `opened_at` - Timestamps
- `open_count` - Number of times opened

### security_events Table
Tracks security-related events:
- `event_type` - Type of security event
- `user_id` - User involved (if any)
- `severity` - Severity level (low, medium, high, critical)
- `description` - Event description
- `ip_address` - IP address
- `resource_type`, `resource_id` - Related resource
- `resolved` - Whether event is resolved
- `resolved_at`, `resolved_by` - Resolution info

## API Endpoints

### Security & Activity Logs

#### Get Activity Logs
```
GET /api/security/activity-logs
```
Get activity logs for current user (students see only their own, admins see all).

**Query Parameters:**
- `limit` - Number of logs to return (default: 50)
- `actionType` - Filter by action type
- `resourceType` - Filter by resource type
- `startDate` - Start date filter
- `endDate` - End date filter

#### Get Resource Activity Logs
```
GET /api/security/activity-logs/:resourceType/:resourceId
```
Get all activity logs for a specific resource.

#### Get Security Events (Admin Only)
```
GET /api/security/security-events
```
Get security events (admin only).

**Query Parameters:**
- `limit` - Number of events (default: 50)
- `severity` - Filter by severity
- `eventType` - Filter by event type
- `resolved` - Filter by resolution status
- `startDate`, `endDate` - Date range

#### Resolve Security Event (Admin Only)
```
PATCH /api/security/security-events/:id/resolve
```
Mark a security event as resolved.

### Document Verification

#### Verify Document (Public)
```
POST /api/security/verify-document
```
Public endpoint to verify document authenticity.

**Request Body:**
```json
{
  "referenceNumber": "LR-20240218-00001",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "isValid": true,
  "documentType": "letter",
  "documentId": "uuid",
  "generatedAt": "2024-02-18T10:00:00Z",
  "verificationCount": 1
}
```

#### Get Document Verification
```
GET /api/security/verification/:documentType/:documentId
```
Get verification details for a document (authenticated).

### Document Transmissions

#### Get Document Transmissions
```
GET /api/security/transmissions/:documentType/:documentId
```
Get transmission history for a document.

#### Get User Transmissions
```
GET /api/security/transmissions
```
Get current user's transmission history.

## Middleware

### Activity Logger
Automatically logs all API requests:
- Logs after response is sent
- Captures IP address, user agent, method, path
- Determines action type and resource type automatically
- Skips health checks and static files

### Security Middleware

#### requireRole(...roles)
Ensures user has one of the specified roles:
```javascript
router.get('/admin-only', requireRole('admin'), controller.adminAction);
```

#### requireOwnership(resourceType, getResourceFn)
Ensures user owns the resource:
```javascript
router.get('/:id', requireOwnership('letter_request', getLetterRequest), controller.getRequest);
```

#### Rate Limiters
- `apiLimiter` - 100 requests per 15 minutes (applied globally)
- `strictLimiter` - 5 requests per 15 minutes (for sensitive operations)

## Services

### Activity Log Service
- `logActivity()` - Log user activity
- `getUserActivityLogs()` - Get user's activity logs
- `getResourceActivityLogs()` - Get resource activity logs
- `getAllActivityLogs()` - Get all logs (admin)

### Document Verification Service
- `generateDocumentHash()` - Generate SHA-256 hash
- `createDocumentVerification()` - Create verification record
- `verifyDocument()` - Verify using reference/code
- `verifyDocumentIntegrity()` - Verify hash integrity
- `getDocumentVerification()` - Get verification record

### Document Transmission Service
- `recordDocumentTransmission()` - Record transmission
- `updateTransmissionStatus()` - Update status
- `getDocumentTransmissions()` - Get transmission history
- `getUserTransmissions()` - Get user's transmissions

### Security Service
- `logSecurityEvent()` - Log security event
- `getSecurityEvents()` - Get security events
- `resolveSecurityEvent()` - Resolve event
- `checkSuspiciousActivity()` - Check for suspicious patterns

## Integration Examples

### Letter Generation with Verification
```javascript
// In letterController.js
const html = generateLetterHTML(student, null, request);

await createDocumentVerification({
  documentType: 'letter',
  documentId: request.id,
  referenceNumber: request.referenceNumber,
  verificationCode: request.verificationCode,
  content: html,
  generatedBy: adminId,
});
```

### Document Download Tracking
```javascript
// Automatically logged via activityLogger middleware
// Also manually record transmission
await recordDocumentTransmission({
  documentId: id,
  documentType: 'letter',
  senderId: user.id,
  recipientType: 'student',
  transmissionMethod: 'download',
});
```

### Security Event Logging
```javascript
await logSecurityEvent({
  eventType: 'unauthorized_access',
  severity: 'high',
  description: 'User attempted unauthorized access',
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

## Setup Instructions

1. **Run Database Migration**
   Execute `supabase/migrations/011_security_and_integrity.sql` in Supabase SQL Editor.

2. **Install Dependencies**
   ```bash
   cd backend
   npm install express-rate-limit
   ```

3. **Middleware is Already Applied**
   - Activity logging is enabled globally
   - Rate limiting is applied to all API routes
   - Security middleware is available for use

## Security Best Practices

1. **Always Log Sensitive Actions**
   - Document generation
   - Document downloads
   - Status changes
   - Administrative actions

2. **Verify Document Integrity**
   - Generate hash on creation
   - Verify hash on access
   - Detect tampering attempts

3. **Track All Transmissions**
   - Record every document share
   - Track delivery status
   - Monitor open rates

4. **Monitor Security Events**
   - Review security events regularly
   - Resolve high-severity events promptly
   - Investigate suspicious patterns

5. **Use Rate Limiting**
   - Apply strict limits to sensitive operations
   - Monitor rate limit violations
   - Adjust limits based on usage patterns

## Benefits

1. **Complete Audit Trail** - Every action is logged with full context
2. **Document Authenticity** - Cryptographic verification ensures documents haven't been tampered with
3. **Compliance** - Meets academic and regulatory requirements for record-keeping
4. **Security Monitoring** - Real-time detection of suspicious activities
5. **Accountability** - Clear tracking of who did what and when
6. **Forensics** - Detailed logs for incident investigation

