/**
 * Multi-Tenancy Migration
 *
 * This migration adds schoolId to all tenant-scoped tables
 * and creates the Schools table.
 *
 * Run: node src/migrations/add-multi-tenancy.js
 */

const { sequelize } = require('../models');
const { DataTypes, QueryInterface } = require('sequelize');

const TENANT_TABLES = [
  'Users',
  'AcademicYears',
  'Terms',
  'Classes',
  'Subjects',
  'TeacherProfiles',
  'Students',
  'ParentProfiles',
  'Schedules',
  'Attendances',
  'ClassRecords',
  'StudentPerformances',
  'Questions',
  'Assessments',
  'AssessmentResults',
  'FailureReasons',
  'Notifications',
  'Messages',
  'FeeStructures',
  'Invoices',
  'Payments',
  'Expenses',
  'Salaries'
];

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Starting multi-tenancy migration...\n');

  // 1. Create Schools table
  console.log('Creating Schools table...');
  await queryInterface.createTable('Schools', {
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
      unique: true,
      allowNull: false
    },
    subdomain: {
      type: DataTypes.STRING,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: {
      type: DataTypes.STRING,
      defaultValue: 'USA'
    },
    postalCode: DataTypes.STRING,
    logo: DataTypes.STRING,
    website: DataTypes.STRING,
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'America/New_York'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    plan: {
      type: DataTypes.ENUM('trial', 'basic', 'standard', 'premium', 'enterprise'),
      defaultValue: 'trial'
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    maxTeachers: {
      type: DataTypes.INTEGER,
      defaultValue: 20
    },
    subscriptionStartDate: DataTypes.DATEONLY,
    subscriptionEndDate: DataTypes.DATEONLY,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Add indexes
  await queryInterface.addIndex('Schools', ['code']);
  await queryInterface.addIndex('Schools', ['subdomain']);
  await queryInterface.addIndex('Schools', ['isActive']);

  console.log('✓ Schools table created\n');

  // 2. Create a default school for existing data
  console.log('Creating default school for existing data...');
  const [defaultSchool] = await sequelize.query(`
    INSERT INTO "Schools" (id, name, code, email, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      'Default School',
      'DEFAULT',
      'admin@default.school',
      NOW(),
      NOW()
    )
    RETURNING id;
  `);
  const defaultSchoolId = defaultSchool[0]?.id;
  console.log(`✓ Default school created with ID: ${defaultSchoolId}\n`);

  // 3. Add schoolId column to all tenant tables
  console.log('Adding schoolId to tenant tables...');
  for (const table of TENANT_TABLES) {
    try {
      // Check if table exists
      const tableExists = await queryInterface.showAllTables();
      if (!tableExists.includes(table)) {
        console.log(`  - Skipping ${table} (table doesn't exist)`);
        continue;
      }

      // Check if column already exists
      const tableDesc = await queryInterface.describeTable(table);
      if (tableDesc.schoolId) {
        console.log(`  - Skipping ${table} (schoolId already exists)`);
        continue;
      }

      // Add schoolId column
      await queryInterface.addColumn(table, 'schoolId', {
        type: DataTypes.UUID,
        references: {
          model: 'Schools',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      // Update existing records with default school
      if (defaultSchoolId) {
        await sequelize.query(`UPDATE "${table}" SET "schoolId" = '${defaultSchoolId}' WHERE "schoolId" IS NULL`);
      }

      // Add index for performance
      await queryInterface.addIndex(table, ['schoolId']);

      console.log(`  ✓ ${table}`);
    } catch (error) {
      console.log(`  ✗ ${table}: ${error.message}`);
    }
  }

  console.log('\n✓ Multi-tenancy migration completed!');
  console.log('\nNext steps:');
  console.log('1. Update your models to include schoolId');
  console.log('2. Add tenant middleware to your routes');
  console.log('3. Create schools via the admin API');
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Rolling back multi-tenancy migration...\n');

  // Remove schoolId from all tables
  for (const table of TENANT_TABLES) {
    try {
      await queryInterface.removeColumn(table, 'schoolId');
      console.log(`  ✓ Removed schoolId from ${table}`);
    } catch (error) {
      console.log(`  ✗ ${table}: ${error.message}`);
    }
  }

  // Drop Schools table
  await queryInterface.dropTable('Schools');
  console.log('\n✓ Schools table dropped');
}

// Run migration
const args = process.argv.slice(2);
if (args.includes('--down')) {
  down()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
} else {
  up()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}
