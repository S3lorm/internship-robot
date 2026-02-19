# Notifications & Reminder System

## Overview

A comprehensive notification and reminder system for maintaining student compliance with evaluations, logbooks, reports, and administrative actions.

## Features Implemented

### 1. Request Decision Notifications
- ✅ Automatic notifications when letter requests are approved/rejected
- ✅ Application status change notifications
- ✅ Priority-based notification system

### 2. Evaluation Availability Notifications
- ✅ Notify students when evaluations become available
- ✅ Support for multiple evaluation types (mid-term, final, supervisor, self)
- ✅ Deadline tracking and reminders

### 3. Logbook Deadline Reminders
- ✅ 3-day advance reminder
- ✅ 1-day urgent reminder
- ✅ Overdue notifications
- ✅ Status tracking (pending, submitted, reviewed, overdue)

### 4. Report Deadline Reminders
- ✅ Support for multiple report types (weekly, monthly, final, reflection)
- ✅ 3-day advance reminder
- ✅ 1-day urgent reminder
- ✅ Overdue notifications

### 5. Administrative Action Reminders
- ✅ Track required administrative actions
- ✅ Reminders for profile completion, document uploads, verifications, etc.
- ✅ Overdue action notifications
- ✅ Action completion tracking

## Database Schema

### New Tables Created

1. **evaluations** - Stores evaluation information
   - `id`, `student_id`, `internship_id`
   - `title`, `description`, `evaluation_type`
   - `is_available`, `available_from`, `deadline`
   - `submission_url`, `created_by`

2. **logbooks** - Tracks logbook submissions
   - `id`, `student_id`, `internship_id`
   - `title`, `description`, `submission_deadline`
   - `submitted_at`, `submission_url`, `status`
   - `feedback`, `reviewed_by`, `reviewed_at`

3. **reports** - Tracks report submissions
   - `id`, `student_id`, `internship_id`
   - `title`, `description`, `report_type`
   - `submission_deadline`, `submitted_at`, `submission_url`
   - `status`, `feedback`, `reviewed_by`, `reviewed_at`

4. **administrative_actions** - Tracks required administrative tasks
   - `id`, `student_id`, `action_type`
   - `title`, `description`, `is_required`, `is_completed`
   - `completed_at`, `due_date`, `action_url`, `created_by`

### Enhanced Notifications Table

Added new columns:
- `link` - Direct link to related content
- `priority` - Notification priority (low, medium, high, urgent)
- `action_required` - Boolean flag for action-required notifications
- `expires_at` - Expiration timestamp

New notification types:
- `evaluation_available`
- `deadline_reminder`
- `logbook_deadline`
- `report_deadline`
- `admin_action_required`
- `letter_request`

## Backend Services

### Reminder Service (`backend/services/reminderService.js`)

Functions:
- `notifyEvaluationAvailable(evaluation)` - Send notification when evaluation becomes available
- `sendLogbookDeadlineReminders()` - Check and send logbook deadline reminders
- `sendReportDeadlineReminders()` - Check and send report deadline reminders
- `sendAdministrativeActionReminders()` - Check and send admin action reminders
- `notifyRequestDecision(request, decision)` - Notify about request decisions
- `runAllReminders()` - Run all reminder checks (for cron jobs)

## Setup Instructions

### 1. Run Database Migration

Execute `supabase/migrations/009_notifications_and_reminders.sql` in Supabase SQL Editor.

### 2. Set Up Cron Job (Optional but Recommended)

Add to your server startup or use a cron service:

```javascript
// In backend/server.js or a separate cron file
const cron = require('node-cron');
const { runAllReminders } = require('./services/reminderService');

// Run reminders every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily reminders...');
  await runAllReminders();
});

// Run overdue status updates every hour
cron.schedule('0 * * * *', async () => {
  const { supabase } = require('./models');
  await supabase.rpc('update_overdue_status');
});
```

Or install `node-cron`:
```bash
cd backend
npm install node-cron
```

### 3. Manual Reminder Execution

You can also trigger reminders manually via API endpoint (to be created):

```javascript
// POST /api/reminders/run
// Admin only endpoint to manually trigger reminders
```

## API Endpoints (To Be Created)

### Evaluations
- `GET /api/evaluations` - Get all evaluations for current user
- `GET /api/evaluations/:id` - Get evaluation details
- `POST /api/evaluations` - Create evaluation (admin)
- `PATCH /api/evaluations/:id` - Update evaluation (admin)

### Logbooks
- `GET /api/logbooks` - Get all logbooks for current user
- `GET /api/logbooks/:id` - Get logbook details
- `POST /api/logbooks` - Create logbook (admin)
- `PATCH /api/logbooks/:id` - Update logbook submission
- `POST /api/logbooks/:id/submit` - Submit logbook

### Reports
- `GET /api/reports` - Get all reports for current user
- `GET /api/reports/:id` - Get report details
- `POST /api/reports` - Create report (admin)
- `PATCH /api/reports/:id` - Update report submission
- `POST /api/reports/:id/submit` - Submit report

### Administrative Actions
- `GET /api/administrative-actions` - Get all actions for current user
- `GET /api/administrative-actions/:id` - Get action details
- `POST /api/administrative-actions` - Create action (admin)
- `PATCH /api/administrative-actions/:id` - Mark action as completed

### Reminders
- `POST /api/reminders/run` - Manually trigger reminders (admin)

## Frontend Components (To Be Created)

1. **Dashboard Reminders Widget** - Display upcoming deadlines and action items
2. **Evaluations Page** - List and access available evaluations
3. **Logbooks Page** - View and submit logbooks
4. **Reports Page** - View and submit reports
5. **Administrative Actions Page** - View and complete required actions
6. **Enhanced Notifications Page** - Filter by type, priority, and action required

## Notification Priority Levels

- **low** - Informational notifications
- **medium** - Standard reminders (3 days before deadline)
- **high** - Important notifications (evaluations available, actions required)
- **urgent** - Critical reminders (1 day before deadline, overdue items)

## Reminder Schedule

- **3 days before deadline** - Medium priority reminder
- **1 day before deadline** - Urgent priority reminder
- **After deadline** - Urgent overdue notification

## Next Steps

1. Create API controllers and routes for evaluations, logbooks, reports, and administrative actions
2. Create frontend pages and components
3. Set up cron job for automated reminders
4. Add email notifications (optional enhancement)
5. Add notification preferences (user settings)


