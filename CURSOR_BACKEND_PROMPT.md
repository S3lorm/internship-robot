# RMU Internship Management System - Backend Development Prompt for Cursor

## Project Overview

Build a complete Node.js/Express backend API for the Regional Maritime University (RMU) Internship Management System. This backend will serve a React.js frontend application.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize OR mysql2 with raw SQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Joi or express-validator

---

## Project Structure

```
backend/
├── config/
│   ├── database.js          # MySQL connection config
│   ├── jwt.js               # JWT configuration
│   └── email.js             # Email service config
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── internshipController.js
│   ├── applicationController.js
│   ├── noticeController.js
│   └── analyticsController.js
├── middleware/
│   ├── auth.js              # JWT verification middleware
│   ├── roleCheck.js         # Role-based access control
│   ├── upload.js            # File upload middleware
│   └── validate.js          # Request validation middleware
├── models/
│   ├── index.js             # Sequelize initialization
│   ├── User.js
│   ├── Internship.js
│   ├── Application.js
│   ├── Notice.js
│   └── Notification.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── internships.js
│   ├── applications.js
│   ├── notices.js
│   └── analytics.js
├── services/
│   ├── emailService.js      # Email sending service
│   └── fileService.js       # File handling service
├── utils/
│   ├── helpers.js
│   └── constants.js
├── uploads/                  # CV/document uploads
├── app.js                   # Express app setup
├── server.js                # Server entry point
└── .env                     # Environment variables
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    role ENUM('student', 'admin') DEFAULT 'student',
    department VARCHAR(100),
    program VARCHAR(100),
    year_of_study INT,
    avatar VARCHAR(255),
    bio TEXT,
    skills JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires DATETIME,
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_student_id (student_id)
);
```

### Internships Table
```sql
CREATE TABLE internships (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    type ENUM('full-time', 'part-time', 'remote') DEFAULT 'full-time',
    duration VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    requirements JSON,
    responsibilities JSON,
    stipend VARCHAR(100),
    deadline DATETIME NOT NULL,
    slots INT DEFAULT 1,
    status ENUM('open', 'closed', 'filled') DEFAULT 'open',
    posted_by VARCHAR(36) NOT NULL,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_deadline (deadline)
);
```

### Applications Table
```sql
CREATE TABLE applications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    internship_id VARCHAR(36) NOT NULL,
    cover_letter TEXT,
    cv_url VARCHAR(255),
    status ENUM('pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending',
    feedback TEXT,
    reviewed_by VARCHAR(36),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_application (student_id, internship_id),
    INDEX idx_status (status),
    INDEX idx_student (student_id)
);
```

### Notices Table
```sql
CREATE TABLE notices (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    target_audience ENUM('all', 'students', 'admins') DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_active (is_active),
    INDEX idx_priority (priority)
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('application_status', 'new_internship', 'notice', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
);
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

```
POST   /register           - Register new student (validates @st.rmu.edu.gh email)
POST   /login              - Login with email/password
POST   /logout             - Logout (invalidate token)
POST   /verify-email       - Verify email with token
POST   /resend-verification - Resend verification email
POST   /forgot-password    - Request password reset
POST   /reset-password     - Reset password with token
GET    /me                 - Get current user profile
```

### User Routes (`/api/users`) - Admin only

```
GET    /                   - Get all users (with pagination, filtering)
GET    /:id                - Get user by ID
PATCH  /:id                - Update user
PATCH  /:id/status         - Activate/deactivate user
DELETE /:id                - Delete user
POST   /export             - Export users to CSV
```

### Internship Routes (`/api/internships`)

```
GET    /                   - Get all internships (with pagination, filtering)
GET    /:id                - Get internship by ID
POST   /                   - Create internship (admin only)
PATCH  /:id                - Update internship (admin only)
DELETE /:id                - Delete internship (admin only)
PATCH  /:id/status         - Update internship status (admin only)
```

### Application Routes (`/api/applications`)

```
GET    /                   - Get applications (filtered by user role)
GET    /my                 - Get current student's applications
GET    /:id                - Get application by ID
POST   /                   - Submit new application (student only)
PATCH  /:id/status         - Update application status (admin only)
POST   /bulk-action        - Bulk approve/reject (admin only)
POST   /export             - Export applications to CSV (admin only)
```

### Notice Routes (`/api/notices`)

```
GET    /                   - Get all active notices (filtered by audience)
GET    /:id                - Get notice by ID
POST   /                   - Create notice (admin only)
PATCH  /:id                - Update notice (admin only)
DELETE /:id                - Delete notice (admin only)
```

### Notification Routes (`/api/notifications`)

```
GET    /                   - Get user's notifications
PATCH  /:id/read           - Mark notification as read
PATCH  /read-all           - Mark all as read
DELETE /:id                - Delete notification
```

### Analytics Routes (`/api/analytics`) - Admin only

```
GET    /dashboard          - Get dashboard statistics
GET    /applications       - Get application analytics
GET    /internships        - Get internship analytics
GET    /users              - Get user analytics
```

### Profile Routes (`/api/profile`)

```
GET    /                   - Get current user profile
PATCH  /                   - Update profile
PATCH  /password           - Change password
POST   /avatar             - Upload avatar
DELETE /avatar             - Remove avatar
```

---

## Key Implementation Details

### 1. Email Validation (Student Registration)

```javascript
// Only allow @st.rmu.edu.gh email addresses for students
const validateStudentEmail = (email) => {
    const studentEmailRegex = /^[a-zA-Z0-9._%+-]+@st\.rmu\.edu\.gh$/;
    return studentEmailRegex.test(email);
};
```

### 2. JWT Authentication

```javascript
// config/jwt.js
module.exports = {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
    refreshExpiresIn: '30d'
};

// Generate tokens
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, config.secret, { expiresIn: config.expiresIn });
};
```

### 3. File Upload Configuration

```javascript
// middleware/upload.js
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/cvs/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `cv-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Word documents are allowed'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
```

### 4. Email Service

```javascript
// services/emailService.js
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendVerificationEmail = async (user, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    await transporter.sendMail({
        from: '"RMU Internship Portal" <noreply@rmu.edu.gh>',
        to: user.email,
        subject: 'Verify Your Email - RMU Internship Portal',
        html: `
            <h1>Welcome to RMU Internship Portal</h1>
            <p>Hi ${user.firstName},</p>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
        `
    });
};

const sendApplicationStatusEmail = async (user, application, internship) => {
    const statusMessages = {
        approved: 'Congratulations! Your application has been approved.',
        rejected: 'We regret to inform you that your application was not successful.',
        under_review: 'Your application is now under review.'
    };
    
    await transporter.sendMail({
        from: '"RMU Internship Portal" <noreply@rmu.edu.gh>',
        to: user.email,
        subject: `Application Update - ${internship.title}`,
        html: `
            <h1>Application Status Update</h1>
            <p>Hi ${user.firstName},</p>
            <p>${statusMessages[application.status]}</p>
            <p><strong>Position:</strong> ${internship.title}</p>
            <p><strong>Company:</strong> ${internship.company}</p>
            ${application.feedback ? `<p><strong>Feedback:</strong> ${application.feedback}</p>` : ''}
        `
    });
};
```

### 5. Role-Based Access Control

```javascript
// middleware/roleCheck.js
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        next();
    };
};

// Usage in routes
router.post('/', auth, checkRole('admin'), internshipController.create);
```

---

## Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rmu_internship
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

---

## Sample Controller Implementation

```javascript
// controllers/applicationController.js
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const User = require('../models/User');
const { sendApplicationStatusEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

exports.submitApplication = async (req, res) => {
    try {
        const { internshipId, coverLetter } = req.body;
        const studentId = req.user.id;
        
        // Check if internship exists and is open
        const internship = await Internship.findByPk(internshipId);
        if (!internship || internship.status !== 'open') {
            return res.status(400).json({ message: 'Internship not available' });
        }
        
        // Check deadline
        if (new Date(internship.deadline) < new Date()) {
            return res.status(400).json({ message: 'Application deadline has passed' });
        }
        
        // Check for existing application
        const existing = await Application.findOne({
            where: { studentId, internshipId }
        });
        if (existing) {
            return res.status(400).json({ message: 'You have already applied' });
        }
        
        // Create application
        const application = await Application.create({
            studentId,
            internshipId,
            coverLetter,
            cvUrl: req.file ? req.file.path : null,
            status: 'pending'
        });
        
        res.status(201).json({
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;
        
        const application = await Application.findByPk(id, {
            include: [
                { model: User, as: 'student' },
                { model: Internship }
            ]
        });
        
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        application.status = status;
        application.feedback = feedback;
        application.reviewedBy = req.user.id;
        application.reviewedAt = new Date();
        await application.save();
        
        // Send email notification
        await sendApplicationStatusEmail(
            application.student,
            application,
            application.Internship
        );
        
        // Create in-app notification
        await createNotification({
            userId: application.studentId,
            type: 'application_status',
            title: 'Application Status Updated',
            message: `Your application for ${application.Internship.title} has been ${status}`,
            relatedId: application.id
        });
        
        res.json({
            message: 'Application status updated',
            application
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
```

---

## Getting Started Commands

```bash
# Initialize project
mkdir backend && cd backend
npm init -y

# Install dependencies
npm install express mysql2 sequelize jsonwebtoken bcryptjs multer nodemailer 
npm install cors helmet morgan dotenv express-validator uuid
npm install -D nodemon

# Add scripts to package.json
# "scripts": {
#   "start": "node server.js",
#   "dev": "nodemon server.js"
# }

# Create database
mysql -u root -p -e "CREATE DATABASE rmu_internship;"

# Run migrations (if using Sequelize CLI)
npx sequelize-cli db:migrate

# Start development server
npm run dev
```

---

## Integration with Frontend

The React frontend at `/app` is already built with:
- Authentication context expecting JWT tokens
- API utility functions in `/lib/api.ts`
- Mock data structure matching the database schema

To integrate:
1. Update `NEXT_PUBLIC_API_URL` in frontend `.env` to point to your backend
2. Replace mock data calls with actual API calls
3. Update auth context to use real JWT authentication

---

## 3-Month Development Timeline

### Month 1: Core Setup & Authentication
- Week 1-2: Project setup, database schema, Sequelize models
- Week 3-4: Authentication system (register, login, email verification)

### Month 2: Core Features
- Week 5-6: Internship CRUD, file upload for applications
- Week 7-8: Application workflow, status management

### Month 3: Advanced Features & Polish
- Week 9-10: Notice system, notifications, analytics
- Week 11-12: Testing, bug fixes, deployment preparation

---

## Security Checklist

- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize outputs)
- [ ] Rate limiting on auth endpoints
- [ ] CORS configuration
- [ ] Helmet.js security headers
- [ ] Password hashing with bcrypt
- [ ] JWT token expiration
- [ ] File upload validation
- [ ] Environment variables for secrets
