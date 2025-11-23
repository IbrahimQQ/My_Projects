# School Management System - SaaS Platform

A comprehensive, multi-tenant school management software suite designed for licensing to multiple schools. Built with React, Node.js, Express, and PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Applications](#applications)
- [Features by Application](#features-by-application)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation Guide](#installation-guide)
- [Server Deployment](#server-deployment)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Applications](#running-the-applications)
- [Default Credentials](#default-credentials)
- [API Documentation](#api-documentation)
- [Multi-Tenancy](#multi-tenancy)
- [Troubleshooting](#troubleshooting)

---

## Overview

This is a complete SaaS (Software as a Service) school management platform that allows you to host and manage multiple schools from a single server. Each school gets their own isolated data while sharing the same infrastructure.

### Key Capabilities

- **Multi-tenant architecture** - Host unlimited schools on a single server
- **Role-based access control** - Different interfaces for principals, teachers, parents, and accountants
- **Real-time notifications** - Socket.io powered instant updates
- **Comprehensive reporting** - Automated report cards, analytics, and insights
- **Financial management** - Fee collection, expenses, salary processing
- **Central administration** - Platform-wide management for SaaS operators

---

## System Architecture

```
+------------------------------------------------------------------+
|                     PLATFORM ADMIN APP                            |
|                  (Central SaaS Management)                        |
|                     Port: 3005                                    |
+------------------------------------------------------------------+
                               |
                               v
+------------------------------------------------------------------+
|                      SHARED BACKEND API                           |
|                    Node.js + Express                              |
|                     Port: 5000                                    |
|   +-------------+  +-------------+  +-------------+              |
|   |  Auth API   |  |  School API |  | Platform API|              |
|   +-------------+  +-------------+  +-------------+              |
|   +-------------+  +-------------+  +-------------+              |
|   | Student API |  | Teacher API |  | Reports API |              |
|   +-------------+  +-------------+  +-------------+              |
|   +-------------+  +-------------+  +-------------+              |
|   |Accounting   |  |Attendance   |  |Assessment   |              |
|   +-------------+  +-------------+  +-------------+              |
+------------------------------------------------------------------+
                               |
                               v
+------------------------------------------------------------------+
|                       PostgreSQL Database                         |
|                     (Multi-tenant Schema)                         |
+------------------------------------------------------------------+
                               |
         +---------------------+---------------------+
         v                     v                     v
+----------------+    +----------------+    +----------------+
|    School A    |    |    School B    |    |    School C    |
|     Data       |    |     Data       |    |     Data       |
+----------------+    +----------------+    +----------------+

+------------------------------------------------------------------+
|                      FRONTEND APPLICATIONS                        |
+-----------------+-----------------+-----------------+-------------+
|  Principal App  |  Teacher App    |  Parent App     | Accounting  |
|   Port: 3001    |   Port: 3002    |   Port: 3003    |  Port: 3004 |
+-----------------+-----------------+-----------------+-------------+
```

---

## Applications

| Application | Port | Description | Users |
|-------------|------|-------------|-------|
| **Backend API** | 5000 | Shared REST API server | All apps |
| **Principal App** | 3001 | School administration & oversight | Principals, Admins |
| **Teacher App** | 3002 | Classroom & student management | Teachers |
| **Parent App** | 3003 | Student progress monitoring | Parents, Guardians |
| **Accounting App** | 3004 | Financial management | Accountants |
| **Platform Admin** | 3005 | SaaS central management | Platform Superadmin |

---

## Features by Application

### 1. Principal App (Port 3001)

The command center for school administrators.

| Module | Features |
|--------|----------|
| **Dashboard** | School statistics, enrollment trends, quick actions |
| **Teacher Management** | Add/edit teachers, assign subjects, view performance |
| **Student Management** | Enrollment, class assignment, student records |
| **Class Management** | Create classes, assign teachers, manage schedules |
| **Academic Calendar** | Academic years, terms, holidays, events |
| **Attendance Overview** | School-wide attendance reports and analytics |
| **Assessment Management** | Create exams, view results, grade distribution |
| **Report Card Generator** | Automated comprehensive report cards with: |
|  | - Individual student performance analysis |
|  | - Class-wide report generation |
|  | - Comparative analysis (student vs class average) |
|  | - Performance trends (improving/stable/declining) |
|  | - Personalized improvement suggestions |
|  | - Parent-friendly explanations |
| **Notifications** | Send announcements to teachers, parents, students |
| **Reports & Analytics** | Enrollment, performance, financial summaries |

### 2. Teacher App (Port 3002)

Comprehensive classroom management tools.

| Module | Features |
|--------|----------|
| **Dashboard** | Today's schedule, pending tasks, class overview |
| **My Classes** | View assigned classes and students |
| **Attendance** | Daily attendance marking with status options |
| **Gradebook** | Enter and manage student grades |
| **Assessments** | Create quizzes, tests, assignments |
| **Question Bank** | Build reusable question library with: |
|  | - Multiple question types (MCQ, essay, short answer) |
|  | - Difficulty levels and Bloom's taxonomy |
|  | - Topic/chapter organization |
| **Class Records** | Daily teaching logs and notes |
| **Student Performance** | Track participation, behavior, homework |
| **Messaging** | Communicate with parents and administration |
| **Schedule** | View weekly timetable |

### 3. Parent App (Port 3003)

Stay connected with your child's education.

| Module | Features |
|--------|----------|
| **Dashboard** | Child's summary, upcoming events, notifications |
| **Children Profiles** | View all enrolled children |
| **Attendance** | View attendance history and patterns |
| **Grades & Results** | Access test scores and assessments |
| **Report Cards** | Download/view comprehensive report cards |
| **Fee Status** | View invoices, payment history, due amounts |
| **Messages** | Communicate with teachers |
| **Notifications** | School announcements and alerts |
| **Calendar** | School events and important dates |

### 4. Accounting App (Port 3004)

Complete financial management system.

| Module | Features |
|--------|----------|
| **Dashboard** | Financial overview, revenue vs expenses |
| **Fee Management** | Create fee structures by class/type |
| **Invoicing** | Generate and manage student invoices |
| **Payments** | Record payments, multiple payment methods |
| **Expenses** | Track and categorize school expenses |
| **Salary Management** | Teacher salary processing and history |
| **Financial Reports** | Income statements, collection reports |
| **Outstanding Dues** | Track overdue payments |

### 5. Platform Admin App (Port 3005)

Central SaaS administration for platform operators.

| Module | Features |
|--------|----------|
| **Dashboard** | Platform-wide statistics |
|  | - Total schools, students, teachers |
|  | - Monthly revenue tracking |
|  | - Plan distribution charts |
|  | - System health status |
| **School Management** | Full school lifecycle management |
|  | - Create new schools with admin accounts |
|  | - Edit school details and settings |
|  | - Subscription plan management |
|  | - Student/teacher limit configuration |
|  | - Suspend/activate schools |
|  | - Subscription extension |
| **User Management** | Cross-school user administration |
|  | - View all platform users |
|  | - Filter by role, school, status |
|  | - Password reset functionality |
|  | - Account activation/deactivation |
| **Billing & Revenue** | Financial tracking |
|  | - Invoice management |
|  | - Payment status tracking |
|  | - Revenue analytics |
|  | - Send payment reminders |
| **Storage Management** | Resource monitoring |
|  | - Per-school storage usage |
|  | - Quota management |
|  | - Usage alerts |
| **Activity Logs** | Security and auditing |
|  | - Login tracking |
|  | - Action history |
|  | - Security alerts |
| **System Settings** | Platform configuration |
|  | - General settings |
|  | - Email (SMTP) configuration |
|  | - Backup settings |
|  | - Security controls |
|  | - Subscription plan pricing |

---

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **ORM:** Sequelize
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.io
- **Security:** Helmet, bcrypt, express-rate-limit

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Charts:** Chart.js / React-Chartjs-2
- **Styling:** CSS3 with modern dark theme

### DevOps
- **Process Manager:** PM2 (recommended for production)
- **Reverse Proxy:** Nginx (recommended)
- **Containerization:** Docker (optional)

---

## Prerequisites

Before installation, ensure you have:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 18.x or higher | `node --version` |
| npm | 9.x or higher | `npm --version` |
| PostgreSQL | 14.x or higher | `psql --version` |
| Git | Any recent version | `git --version` |

---

## Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/IbrahimQQ/My_Projects.git
cd My_Projects/school-management-system
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

Install dependencies for each app:

```bash
# Principal App
cd ../principal-app
npm install

# Teacher App
cd ../teacher-app
npm install

# Parent App
cd ../parent-app
npm install

# Accounting App
cd ../accounting-app
npm install

# Platform Admin App
cd ../platform-admin-app
npm install
```

**Quick Install Script (All at once):**

```bash
# From school-management-system directory
cd backend && npm install && cd ..
cd principal-app && npm install && cd ..
cd teacher-app && npm install && cd ..
cd parent-app && npm install && cd ..
cd accounting-app && npm install && cd ..
cd platform-admin-app && npm install && cd ..
```

---

## Server Deployment

### Option A: Amazon Lightsail (Recommended for SaaS)

#### Step 1: Create Lightsail Instance

1. Log into AWS Console -> Lightsail
2. Click "Create instance"
3. Select:
   - **Platform:** Linux/Unix
   - **Blueprint:** Ubuntu 22.04 LTS
   - **Instance Plan:** Minimum 2GB RAM ($10/month) or higher based on expected load
4. Name your instance and create

#### Step 2: Configure Networking

1. Go to instance -> Networking tab
2. Add firewall rules:

| Port | Protocol | Description |
|------|----------|-------------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 5000 | TCP | API (optional, use Nginx proxy) |
| 3001-3005 | TCP | React apps (dev only) |

#### Step 3: Connect and Setup Server

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 4: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE school_management;
CREATE USER school_admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;
\q
```

#### Step 5: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/IbrahimQQ/My_Projects.git
sudo chown -R ubuntu:ubuntu My_Projects
cd My_Projects/school-management-system

# Install all dependencies
cd backend && npm install --production
cd ../principal-app && npm install && npm run build
cd ../teacher-app && npm install && npm run build
cd ../parent-app && npm install && npm run build
cd ../accounting-app && npm install && npm run build
cd ../platform-admin-app && npm install && npm run build
```

#### Step 6: Configure Environment Variables

```bash
cd /var/www/My_Projects/school-management-system/backend
nano .env
```

Add these values:

```env
# Server
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_management
DB_USER=school_admin
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-very-long-random-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-very-long-random-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email (Optional - for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/school-management
```

Add this configuration:

```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# Principal App
server {
    listen 80;
    server_name principal.yourdomain.com;
    root /var/www/My_Projects/school-management-system/principal-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Teacher App
server {
    listen 80;
    server_name teacher.yourdomain.com;
    root /var/www/My_Projects/school-management-system/teacher-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Parent App
server {
    listen 80;
    server_name parent.yourdomain.com;
    root /var/www/My_Projects/school-management-system/parent-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Accounting App
server {
    listen 80;
    server_name accounting.yourdomain.com;
    root /var/www/My_Projects/school-management-system/accounting-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Platform Admin
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/My_Projects/school-management-system/platform-admin-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 8: Start Application with PM2

```bash
cd /var/www/My_Projects/school-management-system/backend

# Start the backend
pm2 start src/index.js --name "school-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

#### Step 9: Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d principal.yourdomain.com -d teacher.yourdomain.com -d parent.yourdomain.com -d accounting.yourdomain.com -d admin.yourdomain.com
```

### Option B: Local Development Setup

For local testing and development:

```bash
# Terminal 1: Start PostgreSQL (if not running)
sudo service postgresql start

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3-7: Start Frontend Apps (each in separate terminal)
cd principal-app && npm start
cd teacher-app && npm start
cd parent-app && npm start
cd accounting-app && npm start
cd platform-admin-app && npm start
```

---

## Configuration

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | API server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `school_management` |
| `DB_USER` | Database user | `school_admin` |
| `DB_PASSWORD` | Database password | `your_password` |
| `JWT_SECRET` | JWT signing secret | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Refresh token secret | Random 32+ char string |
| `JWT_EXPIRES_IN` | Access token expiry | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CORS_ORIGIN` | Allowed origins | `*` or specific domain |
| `SMTP_HOST` | Email server host | `smtp.sendgrid.net` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USER` | Email username | `apikey` |
| `SMTP_PASS` | Email password | Your API key |

---

## Database Setup

### Initial Setup

```bash
cd backend

# Run database migrations (creates tables)
npm run migrate

# Seed with demo data (optional)
npm run seed
```

### Multi-Tenant Setup

For SaaS deployment with multiple schools:

```bash
# Run multi-tenancy migration
npm run migrate:multi

# Seed with multiple demo schools
npm run seed:multi
```

This creates:
- 3 demo schools (Lincoln, Washington, Jefferson)
- Admin and principal accounts for each school
- Sample teachers, students, and data
- Platform superadmin account

---

## Running the Applications

### Development Mode

```bash
# Backend (with hot reload)
cd backend
npm run dev

# Frontend apps (each in separate terminal)
cd principal-app && npm start     # http://localhost:3001
cd teacher-app && npm start       # http://localhost:3002
cd parent-app && npm start        # http://localhost:3003
cd accounting-app && npm start    # http://localhost:3004
cd platform-admin-app && npm start # http://localhost:3005
```

### Production Mode

```bash
# Build all frontend apps
cd principal-app && npm run build
cd teacher-app && npm run build
cd parent-app && npm run build
cd accounting-app && npm run build
cd platform-admin-app && npm run build

# Start backend with PM2
cd backend
pm2 start src/index.js --name "school-api"
```

---

## Default Credentials

### Platform Admin (SaaS Operator)

| Role | Email | Password |
|------|-------|----------|
| Superadmin | `superadmin@platform.com` | `password123` |

### Demo Schools (After running seed:multi)

#### Lincoln High School
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lincoln.edu` | `password123` |
| Principal | `principal@lincoln.edu` | `password123` |
| Teacher | `teacher1@lincoln.edu` | `password123` |
| Parent | `parent1@lincoln.edu` | `password123` |
| Accountant | `accountant@lincoln.edu` | `password123` |

#### Washington Academy
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@washington.edu` | `password123` |
| Principal | `principal@washington.edu` | `password123` |

#### Jefferson Elementary
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@jefferson.edu` | `password123` |
| Principal | `principal@jefferson.edu` | `password123` |

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/auth/refresh` | POST | Refresh access token |
| `/students` | GET/POST | Student management |
| `/teachers` | GET/POST | Teacher management |
| `/classes` | GET/POST | Class management |
| `/attendance` | GET/POST | Attendance records |
| `/assessments` | GET/POST | Assessment management |
| `/reports/report-card/:studentId` | GET | Generate report card |
| `/accounting/invoices` | GET/POST | Invoice management |
| `/schools` | GET/POST | School management (superadmin) |
| `/platform/stats` | GET | Platform statistics (superadmin) |

### Example: Login Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lincoln.edu", "password": "password123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@lincoln.edu",
    "role": "admin",
    "schoolId": "school-uuid"
  }
}
```

---

## Multi-Tenancy

### How It Works

1. **Shared Schema Approach**: All schools share the same database tables with a `schoolId` column for isolation.

2. **Tenant Identification**: The system identifies the tenant (school) through:
   - JWT token (contains user's schoolId)
   - `X-School-ID` header
   - Subdomain (e.g., `lincoln.schoolsaas.com`)

3. **Data Isolation**: All queries automatically filter by schoolId to ensure schools only see their own data.

### Subscription Plans

| Plan | Students | Teachers | Storage | Price/Month |
|------|----------|----------|---------|-------------|
| Trial | 100 | 20 | 5 GB | Free (30 days) |
| Basic | 300 | 30 | 20 GB | $99 |
| Standard | 500 | 50 | 50 GB | $199 |
| Premium | 1,000 | 100 | 100 GB | $399 |
| Enterprise | 5,000 | 500 | 500 GB | $799 |

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```
Error: ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Verify connection
psql -U school_admin -d school_management -h localhost
```

#### 2. Port Already in Use

```
Error: EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 npm start
```

#### 3. JWT Token Invalid

```
Error: JsonWebTokenError: invalid signature
```

**Solution:**
- Ensure `JWT_SECRET` in `.env` matches what was used to generate the token
- Clear browser localStorage and login again

#### 4. CORS Error

```
Access-Control-Allow-Origin header missing
```

**Solution:**
- Update `CORS_ORIGIN` in `.env` to include your frontend URL
- For development: `CORS_ORIGIN=*`

#### 5. Build Fails on Frontend

```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Logs

```bash
# Backend logs (PM2)
pm2 logs school-api

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## Project Structure

```
school-management-system/
|
+-- backend/                    # Shared API Server
|   +-- src/
|   |   +-- config/            # Database & app configuration
|   |   +-- controllers/       # Route handlers
|   |   +-- middleware/        # Auth, tenant, validation
|   |   +-- models/            # Sequelize models
|   |   +-- routes/            # API route definitions
|   |   +-- migrations/        # Database migrations
|   |   +-- index.js           # App entry point
|   +-- package.json
|
+-- principal-app/             # Principal/Admin Frontend
|   +-- src/
|   |   +-- components/        # Reusable components
|   |   +-- pages/             # Page components
|   |   +-- services/          # API services
|   |   +-- context/           # React context (auth, etc.)
|   +-- package.json
|
+-- teacher-app/               # Teacher Frontend
|   +-- src/
|   +-- package.json
|
+-- parent-app/                # Parent Frontend
|   +-- src/
|   +-- package.json
|
+-- accounting-app/            # Accounting Frontend
|   +-- src/
|   +-- package.json
|
+-- platform-admin-app/        # Platform Admin Frontend
|   +-- src/
|   +-- package.json
|
+-- README.md                  # This file
```

---

## Support

For issues and feature requests, please open an issue on GitHub:
https://github.com/IbrahimQQ/My_Projects/issues

---

## License

This project is proprietary software intended for commercial licensing to educational institutions.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial release with 4 apps (Principal, Teacher, Parent, Accounting) |
| 1.1.0 | 2024-01 | Added Report Card Generator with comprehensive analysis |
| 1.2.0 | 2024-01 | Added Multi-tenancy support for SaaS hosting |
| 1.3.0 | 2024-01 | Added Platform Admin app for central school management |
