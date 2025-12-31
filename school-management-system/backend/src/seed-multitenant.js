/**
 * Multi-Tenant Seed Script
 *
 * Creates multiple schools with their own data for demo purposes.
 * Run: npm run seed:multi
 */

const bcrypt = require('bcryptjs');
const { sequelize, School, User, AcademicYear, Term, Class, Subject, TeacherProfile, Student, ParentProfile, TeacherSubject, StudentSubject, FeeStructure } = require('./models');

const seed = async () => {
  try {
    console.log('🌱 Starting multi-tenant seed...\n');

    // Drop all tables and recreate using force sync (more reliable than drop + sync)
    await sequelize.sync({ force: true });
    console.log('✓ All tables dropped and recreated\n');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    // Create Platform Super Admin (no school association)
    console.log('Creating platform super admin...');
    await User.create({
      email: 'superadmin@platform.com',
      password: hashedPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'superadmin',
      schoolId: null,
      isActive: true
    });
    console.log('✓ Super admin created\n');

    // Define schools to create
    const schoolsData = [
      {
        name: 'Lincoln Elementary School',
        code: 'LINCOLN',
        subdomain: 'lincoln',
        email: 'admin@lincoln.edu',
        phone: '555-100-1000',
        address: '123 Education Ave',
        city: 'Springfield',
        state: 'IL',
        plan: 'premium'
      },
      {
        name: 'Washington High School',
        code: 'WASHINGTON',
        subdomain: 'washington',
        email: 'admin@washington.edu',
        phone: '555-200-2000',
        address: '456 Learning Blvd',
        city: 'Columbus',
        state: 'OH',
        plan: 'standard'
      },
      {
        name: 'Jefferson Academy',
        code: 'JEFFERSON',
        subdomain: 'jefferson',
        email: 'admin@jefferson.edu',
        phone: '555-300-3000',
        address: '789 Knowledge Dr',
        city: 'Austin',
        state: 'TX',
        plan: 'basic'
      }
    ];

    // Create schools and their data
    for (const schoolData of schoolsData) {
      console.log(`\n${'═'.repeat(50)}`);
      console.log(`Creating ${schoolData.name}...`);
      console.log('═'.repeat(50));

      // Create school
      const school = await School.create({
        ...schoolData,
        maxStudents: schoolData.plan === 'premium' ? 1000 : schoolData.plan === 'standard' ? 500 : 100,
        maxTeachers: schoolData.plan === 'premium' ? 100 : schoolData.plan === 'standard' ? 50 : 20,
        subscriptionStartDate: now,
        subscriptionEndDate: oneYearLater,
        isActive: true,
        settings: { gradingScale: 'percentage', attendanceTracking: true },
        features: {
          accounting: schoolData.plan !== 'basic',
          messaging: true,
          reportCards: true,
          questionBank: true
        }
      });

      // Create admin user for this school
      const admin = await User.create({
        email: schoolData.email,
        password: hashedPassword,
        firstName: 'School',
        lastName: 'Admin',
        role: 'admin',
        schoolId: school.id,
        isActive: true
      });

      // Create principal
      const principal = await User.create({
        email: `principal@${schoolData.subdomain}.edu`,
        password: hashedPassword,
        firstName: 'Principal',
        lastName: schoolData.name.split(' ')[0],
        role: 'principal',
        schoolId: school.id,
        isActive: true
      });

      // Create teachers
      const teacherUsers = [];
      for (let i = 1; i <= 3; i++) {
        const teacher = await User.create({
          email: `teacher${i}@${schoolData.subdomain}.edu`,
          password: hashedPassword,
          firstName: `Teacher${i}`,
          lastName: schoolData.name.split(' ')[0],
          role: 'teacher',
          schoolId: school.id,
          isActive: true
        });
        teacherUsers.push(teacher);
      }

      // Create parent users
      const parentUsers = [];
      for (let i = 1; i <= 3; i++) {
        const parent = await User.create({
          email: `parent${i}@${schoolData.subdomain}.edu`,
          password: hashedPassword,
          firstName: `Parent${i}`,
          lastName: `Family${i}`,
          role: 'parent',
          schoolId: school.id,
          isActive: true
        });
        parentUsers.push(parent);
      }

      // Create academic year
      const academicYear = await AcademicYear.create({
        name: '2024-2025',
        startDate: '2024-09-01',
        endDate: '2025-06-30',
        isCurrent: true,
        schoolId: school.id
      });

      // Create terms
      await Term.bulkCreate([
        { name: 'Fall Term', startDate: '2024-09-01', endDate: '2024-12-20', academicYearId: academicYear.id, schoolId: school.id },
        { name: 'Spring Term', startDate: '2025-01-06', endDate: '2025-06-30', academicYearId: academicYear.id, schoolId: school.id }
      ]);

      // Create classes
      const classes = await Class.bulkCreate([
        { name: 'Grade 1A', grade: '1', section: 'A', capacity: 30, academicYearId: academicYear.id, schoolId: school.id },
        { name: 'Grade 2A', grade: '2', section: 'A', capacity: 30, academicYearId: academicYear.id, schoolId: school.id },
        { name: 'Grade 3A', grade: '3', section: 'A', capacity: 30, academicYearId: academicYear.id, schoolId: school.id }
      ]);

      // Create subjects
      const subjects = await Subject.bulkCreate([
        { name: 'Mathematics', code: `${schoolData.code}-MATH`, schoolId: school.id },
        { name: 'English', code: `${schoolData.code}-ENG`, schoolId: school.id },
        { name: 'Science', code: `${schoolData.code}-SCI`, schoolId: school.id }
      ]);

      // Create teacher profiles
      const teacherProfiles = [];
      for (let i = 0; i < teacherUsers.length; i++) {
        const profile = await TeacherProfile.create({
          userId: teacherUsers[i].id,
          employeeId: `${schoolData.code}-TCH${String(i + 1).padStart(3, '0')}`,
          qualification: 'B.Ed',
          joiningDate: '2023-08-01',
          schoolId: school.id
        });
        teacherProfiles.push(profile);

        // Assign subject to teacher
        await TeacherSubject.create({
          TeacherProfileId: profile.id,
          SubjectId: subjects[i].id,
          isPrimary: true
        });
      }

      // Create parent profiles
      const parentProfiles = [];
      for (let i = 0; i < parentUsers.length; i++) {
        const profile = await ParentProfile.create({
          userId: parentUsers[i].id,
          relationship: 'parent',
          canViewGrades: true,
          canViewAttendance: true,
          canMessageTeachers: true,
          schoolId: school.id
        });
        parentProfiles.push(profile);
      }

      // Create students
      const studentNames = [
        ['Emma', 'Johnson'], ['Liam', 'Williams'], ['Olivia', 'Brown'],
        ['Noah', 'Jones'], ['Ava', 'Garcia'], ['Sophia', 'Miller']
      ];

      for (let i = 0; i < studentNames.length; i++) {
        const student = await Student.create({
          studentId: `${schoolData.code}-STU${String(i + 1).padStart(3, '0')}`,
          firstName: studentNames[i][0],
          lastName: studentNames[i][1],
          dateOfBirth: `201${7 - Math.floor(i / 2)}-0${(i % 6) + 1}-15`,
          gender: i % 2 === 0 ? 'female' : 'male',
          classId: classes[i % 3].id,
          enrollmentDate: '2024-09-01',
          status: 'active',
          schoolId: school.id
        });

        // Link to parent
        await sequelize.query(
          `INSERT INTO "ParentStudent" ("ParentProfileId", "StudentId", "createdAt", "updatedAt") VALUES ('${parentProfiles[i % 3].id}', '${student.id}', NOW(), NOW())`
        );

        // Enroll in subjects
        for (const subject of subjects) {
          await StudentSubject.create({
            StudentId: student.id,
            SubjectId: subject.id,
            status: 'active'
          });
        }
      }

      // Create fee structures (if accounting enabled)
      if (school.features.accounting) {
        await FeeStructure.bulkCreate([
          { name: 'Tuition Fee', type: 'tuition', amount: 500.00, frequency: 'monthly', academicYearId: academicYear.id, schoolId: school.id },
          { name: 'Registration Fee', type: 'registration', amount: 200.00, frequency: 'one_time', academicYearId: academicYear.id, schoolId: school.id }
        ]);
      }

      console.log(`✓ ${schoolData.name} created with:`);
      console.log(`  - 1 admin, 1 principal, 3 teachers, 3 parents`);
      console.log(`  - 3 classes, 3 subjects, 6 students`);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 Multi-tenant seed completed!\n');
    console.log('Platform Login:');
    console.log('─'.repeat(50));
    console.log('Super Admin: superadmin@platform.com / password123\n');
    console.log('School Logins (all passwords: password123):');
    console.log('─'.repeat(50));
    console.log('Lincoln:    admin@lincoln.edu, principal@lincoln.edu, teacher1@lincoln.edu');
    console.log('Washington: admin@washington.edu, principal@washington.edu, teacher1@washington.edu');
    console.log('Jefferson:  admin@jefferson.edu, principal@jefferson.edu, teacher1@jefferson.edu');
    console.log('─'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
