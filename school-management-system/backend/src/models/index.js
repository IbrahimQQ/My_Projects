const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// User Model (Base for all user types)
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('principal', 'teacher', 'parent', 'accountant', 'admin'),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  avatar: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  refreshToken: {
    type: DataTypes.STRING
  },
  passwordResetToken: {
    type: DataTypes.STRING
  },
  passwordResetExpires: {
    type: DataTypes.DATE
  },
  fcmToken: {
    type: DataTypes.STRING
  }
});

// Academic Year Model
const AcademicYear = sequelize.define('AcademicYear', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Term Model
const Term = sequelize.define('Term', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Class/Grade Model
const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  room: {
    type: DataTypes.STRING
  }
});

// Subject Model
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  curriculum: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  creditHours: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
});

// Teacher Profile Model
const TeacherProfile = sequelize.define('TeacherProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.STRING,
    unique: true
  },
  qualification: {
    type: DataTypes.STRING
  },
  specialization: {
    type: DataTypes.STRING
  },
  experience: {
    type: DataTypes.INTEGER
  },
  joiningDate: {
    type: DataTypes.DATEONLY
  },
  address: {
    type: DataTypes.TEXT
  },
  emergencyContact: {
    type: DataTypes.STRING
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2)
  }
});

// Student Model
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other')
  },
  address: {
    type: DataTypes.TEXT
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  enrollmentDate: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'graduated', 'transferred', 'archived'),
    defaultValue: 'active'
  },
  medicalInfo: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  avatar: {
    type: DataTypes.STRING
  }
});

// Parent Profile Model
const ParentProfile = sequelize.define('ParentProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  relationship: {
    type: DataTypes.ENUM('father', 'mother', 'guardian', 'other'),
    allowNull: false
  },
  occupation: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  emergencyContact: {
    type: DataTypes.STRING
  },
  canViewGrades: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  canViewAttendance: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  canViewAssessments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  canMessageTeachers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Schedule/Timetable Model
const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 6 }
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  room: {
    type: DataTypes.STRING
  }
});

// Attendance Model
const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT
  }
});

// Class Record (Daily Teaching Record)
const ClassRecord = sequelize.define('ClassRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  homework: {
    type: DataTypes.TEXT
  }
});

// Student Performance (Daily)
const StudentPerformance = sequelize.define('StudentPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  participation: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  behavior: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  homeworkCompleted: {
    type: DataTypes.BOOLEAN
  },
  comments: {
    type: DataTypes.TEXT
  }
});

// Question Bank Model
const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('mcq', 'theory', 'essay', 'short_answer', 'true_false'),
    allowNull: false
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  correctAnswer: {
    type: DataTypes.JSONB
  },
  topic: {
    type: DataTypes.STRING
  },
  chapter: {
    type: DataTypes.STRING
  },
  bloomsLevel: {
    type: DataTypes.ENUM('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  marks: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  expectedTime: {
    type: DataTypes.INTEGER // in minutes
  },
  explanation: {
    type: DataTypes.TEXT
  }
});

// Assessment/Test Model
const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('quiz', 'test', 'midterm', 'final', 'assignment'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  instructions: {
    type: DataTypes.TEXT
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  passingMarks: {
    type: DataTypes.INTEGER
  },
  duration: {
    type: DataTypes.INTEGER // in minutes
  },
  scheduledDate: {
    type: DataTypes.DATE
  },
  dueDate: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'active', 'completed', 'graded'),
    defaultValue: 'draft'
  },
  questions: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
});

// Assessment Result Model
const AssessmentResult = sequelize.define('AssessmentResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  marksObtained: {
    type: DataTypes.DECIMAL(5, 2)
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  grade: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'submitted', 'graded'),
    defaultValue: 'pending'
  },
  answers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  questionResults: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  comments: {
    type: DataTypes.TEXT
  },
  submittedAt: {
    type: DataTypes.DATE
  },
  gradedAt: {
    type: DataTypes.DATE
  }
});

// Failure Reason for Questions
const FailureReason = sequelize.define('FailureReason', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reason: {
    type: DataTypes.ENUM(
      'conceptual_misunderstanding',
      'calculation_error',
      'incomplete_answer',
      'time_management',
      'careless_mistake',
      'not_attempted'
    ),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT
  }
});

// Notification Model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('announcement', 'assignment', 'grade', 'attendance', 'event', 'message', 'system'),
    defaultValue: 'announcement'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  targetAudience: {
    type: DataTypes.ENUM('all', 'teachers', 'parents', 'students', 'specific'),
    defaultValue: 'all'
  },
  targetIds: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  scheduledAt: {
    type: DataTypes.DATE
  },
  sentAt: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sent'),
    defaultValue: 'draft'
  }
});

// User Notification (Read status tracking)
const UserNotification = sequelize.define('UserNotification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE
  }
});

// Message Model
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE
  }
});

// Audit Log Model
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.UUID
  },
  oldValue: {
    type: DataTypes.JSONB
  },
  newValue: {
    type: DataTypes.JSONB
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.STRING
  }
});

// Fee Structure Model
const FeeStructure = sequelize.define('FeeStructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('tuition', 'registration', 'exam', 'transport', 'library', 'lab', 'sports', 'other'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  frequency: {
    type: DataTypes.ENUM('one_time', 'monthly', 'quarterly', 'yearly'),
    defaultValue: 'monthly'
  },
  dueDay: {
    type: DataTypes.INTEGER
  },
  isOptional: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Invoice Model
const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'pending'
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  }
});

// Payment Model
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'cheque', 'online'),
    allowNull: false
  },
  referenceNumber: {
    type: DataTypes.STRING
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'completed'
  },
  notes: {
    type: DataTypes.TEXT
  }
});

// Expense Model
const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  category: {
    type: DataTypes.ENUM('salary', 'utilities', 'supplies', 'maintenance', 'transport', 'events', 'other'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  receipt: {
    type: DataTypes.STRING
  },
  vendor: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
    defaultValue: 'pending'
  }
});

// Salary Model
const Salary = sequelize.define('Salary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  baseSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  allowances: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  deductions: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  netSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'paid'),
    defaultValue: 'pending'
  },
  paidAt: {
    type: DataTypes.DATE
  }
});

// Student-Subject Enrollment
const StudentSubject = sequelize.define('StudentSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'dropped', 'completed'),
    defaultValue: 'active'
  }
});

// Teacher-Subject Assignment
const TeacherSubject = sequelize.define('TeacherSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Define Relationships
// User - TeacherProfile
User.hasOne(TeacherProfile, { foreignKey: 'userId', as: 'teacherProfile' });
TeacherProfile.belongsTo(User, { foreignKey: 'userId' });

// User - ParentProfile
User.hasOne(ParentProfile, { foreignKey: 'userId', as: 'parentProfile' });
ParentProfile.belongsTo(User, { foreignKey: 'userId' });

// AcademicYear - Term
AcademicYear.hasMany(Term, { foreignKey: 'academicYearId', as: 'terms' });
Term.belongsTo(AcademicYear, { foreignKey: 'academicYearId' });

// AcademicYear - Class
AcademicYear.hasMany(Class, { foreignKey: 'academicYearId', as: 'classes' });
Class.belongsTo(AcademicYear, { foreignKey: 'academicYearId' });

// Class - Student
Class.hasMany(Student, { foreignKey: 'classId', as: 'students' });
Student.belongsTo(Class, { foreignKey: 'classId' });

// Parent - Student (Many-to-Many)
ParentProfile.belongsToMany(Student, { through: 'ParentStudent', as: 'children' });
Student.belongsToMany(ParentProfile, { through: 'ParentStudent', as: 'parents' });

// Teacher - Subject (Many-to-Many with TeacherSubject)
TeacherProfile.belongsToMany(Subject, { through: TeacherSubject, as: 'subjects' });
Subject.belongsToMany(TeacherProfile, { through: TeacherSubject, as: 'teachers' });

// Student - Subject (Many-to-Many with StudentSubject)
Student.belongsToMany(Subject, { through: StudentSubject, as: 'subjects' });
Subject.belongsToMany(Student, { through: StudentSubject, as: 'students' });

// Class - Subject (Many-to-Many)
Class.belongsToMany(Subject, { through: 'ClassSubject', as: 'subjects' });
Subject.belongsToMany(Class, { through: 'ClassSubject', as: 'classes' });

// Schedule relationships
Schedule.belongsTo(Class, { foreignKey: 'classId' });
Schedule.belongsTo(Subject, { foreignKey: 'subjectId' });
Schedule.belongsTo(TeacherProfile, { foreignKey: 'teacherId' });
Schedule.belongsTo(Term, { foreignKey: 'termId' });

// Attendance relationships
Attendance.belongsTo(Student, { foreignKey: 'studentId' });
Attendance.belongsTo(Class, { foreignKey: 'classId' });
Attendance.belongsTo(Subject, { foreignKey: 'subjectId' });
Attendance.belongsTo(TeacherProfile, { foreignKey: 'markedBy' });

// ClassRecord relationships
ClassRecord.belongsTo(Class, { foreignKey: 'classId' });
ClassRecord.belongsTo(Subject, { foreignKey: 'subjectId' });
ClassRecord.belongsTo(TeacherProfile, { foreignKey: 'teacherId' });

// StudentPerformance relationships
StudentPerformance.belongsTo(Student, { foreignKey: 'studentId' });
StudentPerformance.belongsTo(Subject, { foreignKey: 'subjectId' });
StudentPerformance.belongsTo(TeacherProfile, { foreignKey: 'recordedBy' });

// Question relationships
Question.belongsTo(Subject, { foreignKey: 'subjectId' });
Question.belongsTo(TeacherProfile, { foreignKey: 'createdBy' });

// Assessment relationships
Assessment.belongsTo(Subject, { foreignKey: 'subjectId' });
Assessment.belongsTo(Class, { foreignKey: 'classId' });
Assessment.belongsTo(TeacherProfile, { foreignKey: 'createdBy' });
Assessment.belongsTo(Term, { foreignKey: 'termId' });

// AssessmentResult relationships
AssessmentResult.belongsTo(Assessment, { foreignKey: 'assessmentId' });
AssessmentResult.belongsTo(Student, { foreignKey: 'studentId' });
AssessmentResult.belongsTo(TeacherProfile, { foreignKey: 'gradedBy' });

// FailureReason relationships
FailureReason.belongsTo(AssessmentResult, { foreignKey: 'resultId' });
FailureReason.belongsTo(Question, { foreignKey: 'questionId' });

// Notification relationships
Notification.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
UserNotification.belongsTo(User, { foreignKey: 'userId' });
UserNotification.belongsTo(Notification, { foreignKey: 'notificationId' });

// Message relationships
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// AuditLog relationships
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// Fee relationships
FeeStructure.belongsTo(Class, { foreignKey: 'classId' });
FeeStructure.belongsTo(AcademicYear, { foreignKey: 'academicYearId' });

// Invoice relationships
Invoice.belongsTo(Student, { foreignKey: 'studentId' });
Invoice.belongsTo(AcademicYear, { foreignKey: 'academicYearId' });
Invoice.belongsTo(Term, { foreignKey: 'termId' });

// Payment relationships
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });
Payment.belongsTo(User, { foreignKey: 'receivedBy' });

// Expense relationships
Expense.belongsTo(User, { foreignKey: 'createdBy' });
Expense.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Salary relationships
Salary.belongsTo(TeacherProfile, { foreignKey: 'teacherId' });

module.exports = {
  sequelize,
  User,
  AcademicYear,
  Term,
  Class,
  Subject,
  TeacherProfile,
  Student,
  ParentProfile,
  Schedule,
  Attendance,
  ClassRecord,
  StudentPerformance,
  Question,
  Assessment,
  AssessmentResult,
  FailureReason,
  Notification,
  UserNotification,
  Message,
  AuditLog,
  FeeStructure,
  Invoice,
  Payment,
  Expense,
  Salary,
  StudentSubject,
  TeacherSubject
};
