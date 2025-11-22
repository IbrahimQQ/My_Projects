# School Management System

A comprehensive school management software suite consisting of 4 cross-platform applications with a shared backend infrastructure.

## Applications

### 1. Principal Application (`principal-app/`)
Full administrative dashboard for school principals and administrators.

**Features:**
- Dashboard with key metrics and analytics
- Teacher management (CRUD, subject assignments)
- Student management with bulk import/export
- Parent account management with permissions
- Class and subject management
- Academic year and term configuration
- Assessment overview and reporting
- Notification composer for announcements
- Audit logs for system activity tracking
- Accounting overview

### 2. Teacher Application (`teacher-app/`)
Dedicated application for teachers to manage their classes and students.

**Features:**
- Dashboard with assigned classes and schedules
- Attendance marking with status tracking
- Question bank creation with Bloom's Taxonomy tagging
- Assessment/test creation from question bank
- Score recording with failure reason tracking
- Student performance viewing
- Daily class records

### 3. Parent Application (`parent-app/`)
Mobile-first application for parents to track their children's progress.

**Features:**
- Multi-child support with easy switching
- View grades and academic performance
- Attendance tracking and statistics
- Push notification support
- Permission-based access (grades, attendance, messaging)
- Profile management

### 4. Accounting Application (`accounting-app/`)
Financial management system for accountants and administrators.

**Features:**
- Fee structure management
- Student billing and invoicing
- Bulk invoice generation
- Payment tracking and receipts
- Staff salary management
- Expense tracking by category
- Financial reporting with charts
- Income vs expenses analysis

## Backend (`backend/`)

Shared REST API serving all applications.

**Technology Stack:**
- Node.js with Express.js
- PostgreSQL with Sequelize ORM
- JWT authentication with refresh tokens
- Socket.io for real-time updates
- Role-based access control (RBAC)

**Key Features:**
- Comprehensive audit logging
- Rate limiting and security middleware
- Input validation and sanitization
- File upload support
- Report generation (PDF/Excel)

## Database Schema

### Core Entities
- Users (with roles: admin, principal, teacher, parent, accountant)
- Academic Years and Terms
- Classes and Subjects
- Teacher Profiles with subject assignments
- Students with class enrollment
- Parent Profiles with child linking

### Academic Features
- Schedules
- Attendance records
- Assessments and Results
- Question Bank with Bloom's Taxonomy
- Failure reason tracking

### Communication
- Notifications (system-wide and targeted)
- User notification preferences
- Messages

### Financial
- Fee Structures
- Invoices with line items
- Payments
- Salaries
- Expenses

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
# Configure .env with database credentials
npm run dev
```

### Frontend Setup (for each app)
```bash
cd principal-app  # or teacher-app, parent-app, accounting-app
npm install
npm start
```

### Environment Variables

Backend `.env`:
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/school_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

Frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `PUT /api/auth/change-password` - Change password

### Users & Roles
- `GET/POST /api/users` - User management
- `GET/PUT/DELETE /api/users/:id`

### Teachers
- `GET/POST /api/teachers`
- `GET/PUT/DELETE /api/teachers/:id`
- `POST /api/teachers/:id/subjects` - Assign subjects

### Students
- `GET/POST /api/students`
- `GET/PUT/DELETE /api/students/:id`
- `POST /api/students/bulk-import`
- `GET /api/students/export`

### Classes & Subjects
- `GET/POST /api/classes`
- `GET/POST /api/subjects`

### Attendance
- `POST /api/attendance/mark`
- `GET /api/attendance/class/:classId`
- `GET /api/attendance/student/:studentId`

### Assessments
- `GET/POST /api/assessments`
- `POST /api/assessments/:id/grade`
- `GET /api/question-bank`

### Accounting
- `GET/POST /api/accounting/fee-structures`
- `GET/POST /api/accounting/invoices`
- `POST /api/accounting/invoices/bulk`
- `GET/POST /api/accounting/payments`
- `GET/POST /api/accounting/salaries`
- `GET/POST /api/accounting/expenses`
- `GET /api/accounting/reports/*`

### Dashboard
- `GET /api/dashboard/principal`
- `GET /api/dashboard/teacher`
- `GET /api/dashboard/parent`
- `GET /api/dashboard/accounting`

## Security Features

- JWT-based authentication with refresh tokens
- Role-based access control
- Input validation and sanitization
- Rate limiting
- Audit logging for all actions
- Password hashing with bcrypt

## License

MIT
