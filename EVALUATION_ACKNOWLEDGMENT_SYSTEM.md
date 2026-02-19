# Evaluation Acknowledgment Mechanism

## Overview

A comprehensive system for tracking student acknowledgment of evaluations and feedback, ensuring procedural completeness and compliance.

## Features Implemented

### 1. Evaluation Viewing & Acknowledgment
- ✅ Track when students view evaluations (`viewed_at`, `viewed_by`)
- ✅ Track when students acknowledge evaluation feedback (`feedback_acknowledged_at`, `feedback_acknowledged_by`)
- ✅ Configurable acknowledgment requirements (`requires_acknowledgment`)
- ✅ Acknowledgment deadlines (`acknowledgment_deadline`)
- ✅ Automatic notifications when evaluations become available

### 2. Logbook Feedback Acknowledgment
- ✅ Track when students view logbook feedback (`feedback_viewed_at`, `feedback_viewed_by`)
- ✅ Track when students acknowledge logbook feedback (`feedback_acknowledged_at`, `feedback_acknowledged_by`)
- ✅ Configurable acknowledgment requirements (`requires_feedback_acknowledgment`)
- ✅ Automatic notifications to reviewers when feedback is acknowledged

### 3. Report Feedback Acknowledgment
- ✅ Track when students view report feedback (`feedback_viewed_at`, `feedback_viewed_by`)
- ✅ Track when students acknowledge report feedback (`feedback_acknowledged_at`, `feedback_acknowledged_by`)
- ✅ Configurable acknowledgment requirements (`requires_feedback_acknowledgment`)
- ✅ Automatic notifications to reviewers when feedback is acknowledged

## Database Schema

### Evaluations Table - New Fields
- `viewed_at` - Timestamp when evaluation was viewed
- `viewed_by` - User ID who viewed the evaluation
- `feedback_acknowledged_at` - Timestamp when feedback was acknowledged
- `feedback_acknowledged_by` - User ID who acknowledged feedback
- `requires_acknowledgment` - Boolean flag (default: true)
- `acknowledgment_deadline` - Deadline for acknowledgment

### Logbooks Table - New Fields
- `feedback_viewed_at` - Timestamp when feedback was viewed
- `feedback_viewed_by` - User ID who viewed feedback
- `feedback_acknowledged_at` - Timestamp when feedback was acknowledged
- `feedback_acknowledged_by` - User ID who acknowledged feedback
- `requires_feedback_acknowledgment` - Boolean flag (default: false)

### Reports Table - New Fields
- `feedback_viewed_at` - Timestamp when feedback was viewed
- `feedback_viewed_by` - User ID who viewed feedback
- `feedback_acknowledged_at` - Timestamp when feedback was acknowledged
- `feedback_acknowledged_by` - User ID who acknowledged feedback
- `requires_feedback_acknowledgment` - Boolean flag (default: false)

## API Endpoints

### Evaluations

#### Get All Evaluations
```
GET /api/evaluations
```
Returns all evaluations for the current user (filtered by role).

#### Get Evaluation by ID
```
GET /api/evaluations/:id
```
Returns a specific evaluation.

#### Mark Evaluation as Viewed
```
POST /api/evaluations/:id/view
```
Marks an evaluation as viewed by the current user.

**Response:**
```json
{
  "message": "Evaluation marked as viewed"
}
```

#### Acknowledge Evaluation Feedback
```
POST /api/evaluations/:id/acknowledge
```
Acknowledges that the student has received and understood the evaluation feedback.

**Response:**
```json
{
  "message": "Evaluation feedback acknowledged successfully"
}
```

#### Create Evaluation (Admin Only)
```
POST /api/evaluations
```
Creates a new evaluation.

**Request Body:**
```json
{
  "studentId": "uuid",
  "internshipId": "uuid",
  "title": "Final Evaluation",
  "description": "End of internship evaluation",
  "evaluationType": "final",
  "isAvailable": true,
  "availableFrom": "2024-01-01T00:00:00Z",
  "deadline": "2024-01-31T23:59:59Z",
  "submissionUrl": "https://...",
  "requiresAcknowledgment": true,
  "acknowledgmentDeadline": "2024-02-05T23:59:59Z"
}
```

#### Update Evaluation (Admin Only)
```
PATCH /api/evaluations/:id
```
Updates an existing evaluation.

### Feedback Acknowledgment

#### Mark Logbook Feedback as Viewed
```
POST /api/feedback/logbooks/:id/view
```
Marks logbook feedback as viewed.

#### Acknowledge Logbook Feedback
```
POST /api/feedback/logbooks/:id/acknowledge
```
Acknowledges logbook feedback.

#### Mark Report Feedback as Viewed
```
POST /api/feedback/reports/:id/view
```
Marks report feedback as viewed.

#### Acknowledge Report Feedback
```
POST /api/feedback/reports/:id/acknowledge
```
Acknowledges report feedback.

## Database Functions

### Get Unacknowledged Evaluations
```sql
SELECT * FROM get_unacknowledged_evaluations();
```
Returns evaluations that require acknowledgment but haven't been acknowledged.

### Get Unacknowledged Feedback
```sql
SELECT * FROM get_unacknowledged_feedback();
```
Returns logbooks and reports with feedback that hasn't been acknowledged.

## Workflow

### Evaluation Acknowledgment Flow

1. **Admin Creates Evaluation**
   - Sets `requiresAcknowledgment = true`
   - Optionally sets `acknowledgmentDeadline`
   - Sets `isAvailable = true` when ready

2. **Student Views Evaluation**
   - Student accesses evaluation
   - System automatically marks as viewed (`POST /api/evaluations/:id/view`)
   - `viewed_at` and `viewed_by` are recorded

3. **Student Acknowledges Feedback**
   - Student reviews feedback
   - Student clicks "Acknowledge Feedback" button
   - System records acknowledgment (`POST /api/evaluations/:id/acknowledge`)
   - `feedback_acknowledged_at` and `feedback_acknowledged_by` are recorded
   - Admin/reviewer receives notification

### Logbook/Report Feedback Acknowledgment Flow

1. **Admin Reviews Submission**
   - Admin provides feedback
   - Sets `requiresFeedbackAcknowledgment = true` if needed
   - Student receives notification

2. **Student Views Feedback**
   - Student accesses logbook/report
   - System automatically marks feedback as viewed
   - `feedback_viewed_at` and `feedback_viewed_by` are recorded

3. **Student Acknowledges Feedback**
   - Student reviews feedback
   - Student clicks "Acknowledge Feedback" button
   - System records acknowledgment
   - `feedback_acknowledged_at` and `feedback_acknowledged_by` are recorded
   - Reviewer receives notification

## Frontend Implementation Guide

### Evaluation Acknowledgment Component

```typescript
// Example component structure
interface EvaluationAcknowledgmentProps {
  evaluation: Evaluation;
  onAcknowledge: () => void;
}

function EvaluationAcknowledgment({ evaluation, onAcknowledge }: Props) {
  const hasViewed = !!evaluation.viewedAt;
  const hasAcknowledged = !!evaluation.feedbackAcknowledgedAt;
  const requiresAck = evaluation.requiresAcknowledgment;
  
  return (
    <div>
      {!hasViewed && (
        <Button onClick={() => markAsViewed(evaluation.id)}>
          Mark as Viewed
        </Button>
      )}
      
      {hasViewed && !hasAcknowledged && requiresAck && (
        <div>
          <Alert>
            Please acknowledge that you have reviewed the feedback.
          </Alert>
          <Button onClick={onAcknowledge}>
            Acknowledge Feedback
          </Button>
        </div>
      )}
      
      {hasAcknowledged && (
        <Badge variant="success">
          Feedback Acknowledged
        </Badge>
      )}
    </div>
  );
}
```

### Status Indicators

- **Not Viewed** - Show "View Evaluation" button
- **Viewed, Not Acknowledged** - Show acknowledgment prompt with deadline (if set)
- **Acknowledged** - Show confirmation badge with timestamp
- **Overdue** - Highlight in red if past acknowledgment deadline

## Reminder Integration

The system integrates with the reminder service to:
- Send reminders for unacknowledged evaluations approaching deadline
- Send overdue notifications for missed acknowledgment deadlines
- Track acknowledgment compliance for reporting

## Setup Instructions

1. **Run Database Migration**
   Execute `supabase/migrations/010_evaluation_acknowledgment.sql` in Supabase SQL Editor.

2. **Backend is Ready**
   All controllers and routes are implemented and registered.

3. **Frontend Implementation**
   - Create evaluation viewing page
   - Add acknowledgment buttons
   - Display acknowledgment status
   - Show acknowledgment deadlines and overdue warnings

## Benefits

1. **Procedural Completeness** - Ensures students have actually seen and acknowledged evaluations/feedback
2. **Compliance Tracking** - Records when acknowledgments occur for audit purposes
3. **Deadline Management** - Supports acknowledgment deadlines for time-sensitive evaluations
4. **Notification System** - Automatically notifies relevant parties when acknowledgments occur
5. **Reporting** - Enables tracking of acknowledgment rates and compliance

