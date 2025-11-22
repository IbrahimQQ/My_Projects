const bcrypt = require('bcryptjs');
const { sequelize, User, AcademicYear, Term, Class, Subject, TeacherProfile, Student, ParentProfile, TeacherSubject, StudentSubject, FeeStructure } = require('./models');

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Sync database (creates tables)
    await sequelize.sync({ force: true });
    console.log('✓ Database synced\n');

    // Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await User.create({
      email: 'admin@school.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    const principal = await User.create({
      email: 'principal@school.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'principal',
      isActive: true
    });

    const accountant = await User.create({
      email: 'accountant@school.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'accountant',
      isActive: true
    });

    const teacherUsers = await User.bulkCreate([
      { email: 'teacher1@school.com', password: hashedPassword, firstName: 'Mary', lastName: 'Williams', role: 'teacher', isActive: true },
      { email: 'teacher2@school.com', password: hashedPassword, firstName: 'James', lastName: 'Brown', role: 'teacher', isActive: true },
      { email: 'teacher3@school.com', password: hashedPassword, firstName: 'Patricia', lastName: 'Davis', role: 'teacher', isActive: true },
    ]);

    const parentUsers = await User.bulkCreate([
      { email: 'parent1@school.com', password: hashedPassword, firstName: 'Robert', lastName: 'Miller', role: 'parent', isActive: true },
      { email: 'parent2@school.com', password: hashedPassword, firstName: 'Jennifer', lastName: 'Wilson', role: 'parent', isActive: true },
      { email: 'parent3@school.com', password: hashedPassword, firstName: 'Michael', lastName: 'Moore', role: 'parent', isActive: true },
    ]);

    console.log('✓ Created 9 users\n');

    // Create Academic Year
    console.log('Creating academic year...');
    const academicYear = await AcademicYear.create({
      name: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-06-30',
      isActive: true
    });

    const terms = await Term.bulkCreate([
      { name: 'Fall Term', startDate: '2024-09-01', endDate: '2024-12-20', academicYearId: academicYear.id },
      { name: 'Spring Term', startDate: '2025-01-06', endDate: '2025-03-28', academicYearId: academicYear.id },
      { name: 'Summer Term', startDate: '2025-04-07', endDate: '2025-06-30', academicYearId: academicYear.id },
    ]);
    console.log('✓ Created academic year with 3 terms\n');

    // Create Classes
    console.log('Creating classes...');
    const classes = await Class.bulkCreate([
      { name: 'Grade 1A', gradeLevel: 1, section: 'A', capacity: 30, academicYearId: academicYear.id },
      { name: 'Grade 1B', gradeLevel: 1, section: 'B', capacity: 30, academicYearId: academicYear.id },
      { name: 'Grade 2A', gradeLevel: 2, section: 'A', capacity: 30, academicYearId: academicYear.id },
      { name: 'Grade 3A', gradeLevel: 3, section: 'A', capacity: 30, academicYearId: academicYear.id },
      { name: 'Grade 4A', gradeLevel: 4, section: 'A', capacity: 30, academicYearId: academicYear.id },
      { name: 'Grade 5A', gradeLevel: 5, section: 'A', capacity: 30, academicYearId: academicYear.id },
    ]);
    console.log('✓ Created 6 classes\n');

    // Create Subjects
    console.log('Creating subjects...');
    const subjects = await Subject.bulkCreate([
      { name: 'Mathematics', code: 'MATH', description: 'Core mathematics curriculum' },
      { name: 'English', code: 'ENG', description: 'English language and literature' },
      { name: 'Science', code: 'SCI', description: 'General science' },
      { name: 'Social Studies', code: 'SOC', description: 'History and geography' },
      { name: 'Art', code: 'ART', description: 'Visual arts and creativity' },
      { name: 'Physical Education', code: 'PE', description: 'Sports and fitness' },
    ]);
    console.log('✓ Created 6 subjects\n');

    // Create Teacher Profiles
    console.log('Creating teacher profiles...');
    const teacherProfiles = await TeacherProfile.bulkCreate([
      { userId: teacherUsers[0].id, employeeId: 'TCH001', qualification: 'M.Ed Mathematics', specialization: 'Mathematics', joinDate: '2020-08-15' },
      { userId: teacherUsers[1].id, employeeId: 'TCH002', qualification: 'B.Ed English', specialization: 'English Literature', joinDate: '2019-08-20' },
      { userId: teacherUsers[2].id, employeeId: 'TCH003', qualification: 'M.Sc Physics', specialization: 'Science', joinDate: '2021-08-10' },
    ]);

    // Assign subjects to teachers
    await TeacherSubject.bulkCreate([
      { teacherProfileId: teacherProfiles[0].id, subjectId: subjects[0].id }, // Mary - Math
      { teacherProfileId: teacherProfiles[1].id, subjectId: subjects[1].id }, // James - English
      { teacherProfileId: teacherProfiles[2].id, subjectId: subjects[2].id }, // Patricia - Science
    ]);

    // Assign class teachers
    await classes[0].update({ classTeacherId: teacherProfiles[0].id });
    await classes[1].update({ classTeacherId: teacherProfiles[1].id });
    await classes[2].update({ classTeacherId: teacherProfiles[2].id });

    console.log('✓ Created 3 teacher profiles with subject assignments\n');

    // Create Parent Profiles
    console.log('Creating parent profiles...');
    const parentProfiles = await ParentProfile.bulkCreate([
      { userId: parentUsers[0].id, phone: '555-0101', address: '123 Oak Street', occupation: 'Engineer', canViewGrades: true, canViewAttendance: true, canMessage: true },
      { userId: parentUsers[1].id, phone: '555-0102', address: '456 Maple Avenue', occupation: 'Doctor', canViewGrades: true, canViewAttendance: true, canMessage: true },
      { userId: parentUsers[2].id, phone: '555-0103', address: '789 Pine Road', occupation: 'Lawyer', canViewGrades: true, canViewAttendance: true, canMessage: false },
    ]);
    console.log('✓ Created 3 parent profiles\n');

    // Create Students
    console.log('Creating students...');
    const students = await Student.bulkCreate([
      { firstName: 'Emma', lastName: 'Miller', studentId: 'STU001', dateOfBirth: '2017-03-15', gender: 'female', classId: classes[0].id, parentId: parentProfiles[0].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Liam', lastName: 'Miller', studentId: 'STU002', dateOfBirth: '2015-07-22', gender: 'male', classId: classes[2].id, parentId: parentProfiles[0].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Olivia', lastName: 'Wilson', studentId: 'STU003', dateOfBirth: '2017-05-10', gender: 'female', classId: classes[0].id, parentId: parentProfiles[1].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Noah', lastName: 'Wilson', studentId: 'STU004', dateOfBirth: '2016-11-30', gender: 'male', classId: classes[1].id, parentId: parentProfiles[1].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Ava', lastName: 'Moore', studentId: 'STU005', dateOfBirth: '2017-01-25', gender: 'female', classId: classes[0].id, parentId: parentProfiles[2].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Sophia', lastName: 'Taylor', studentId: 'STU006', dateOfBirth: '2016-08-14', gender: 'female', classId: classes[1].id, parentId: parentProfiles[2].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Jackson', lastName: 'Anderson', studentId: 'STU007', dateOfBirth: '2015-04-05', gender: 'male', classId: classes[2].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Isabella', lastName: 'Thomas', studentId: 'STU008', dateOfBirth: '2014-12-18', gender: 'female', classId: classes[3].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Lucas', lastName: 'Jackson', studentId: 'STU009', dateOfBirth: '2013-09-08', gender: 'male', classId: classes[4].id, enrollmentDate: '2024-09-01', status: 'active' },
      { firstName: 'Mia', lastName: 'White', studentId: 'STU010', dateOfBirth: '2012-06-20', gender: 'female', classId: classes[5].id, enrollmentDate: '2024-09-01', status: 'active' },
    ]);

    // Assign subjects to students
    const studentSubjects = [];
    for (const student of students) {
      for (const subject of subjects.slice(0, 4)) { // First 4 core subjects
        studentSubjects.push({ studentId: student.id, subjectId: subject.id });
      }
    }
    await StudentSubject.bulkCreate(studentSubjects);

    console.log('✓ Created 10 students with subject enrollments\n');

    // Create Fee Structures
    console.log('Creating fee structures...');
    await FeeStructure.bulkCreate([
      { name: 'Tuition Fee', description: 'Monthly tuition fee', amount: 500.00, frequency: 'monthly', academicYearId: academicYear.id, isActive: true },
      { name: 'Registration Fee', description: 'One-time registration', amount: 200.00, frequency: 'once', academicYearId: academicYear.id, isActive: true },
      { name: 'Lab Fee', description: 'Science lab materials', amount: 100.00, frequency: 'term', academicYearId: academicYear.id, isActive: true },
      { name: 'Sports Fee', description: 'Sports equipment and activities', amount: 150.00, frequency: 'term', academicYearId: academicYear.id, isActive: true },
    ]);
    console.log('✓ Created 4 fee structures\n');

    console.log('═'.repeat(50));
    console.log('🎉 Database seeded successfully!\n');
    console.log('Test Login Credentials:');
    console.log('─'.repeat(50));
    console.log('Principal App:  admin@school.com / password123');
    console.log('                principal@school.com / password123');
    console.log('Teacher App:    teacher1@school.com / password123');
    console.log('Parent App:     parent1@school.com / password123');
    console.log('Accounting App: accountant@school.com / password123');
    console.log('─'.repeat(50));
    console.log('\nAll passwords: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
