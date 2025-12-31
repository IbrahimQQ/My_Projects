const { DataTypes } = require('sequelize');

// School/Tenant Model Definition
const defineSchoolModel = (sequelize) => {
  const School = sequelize.define('School', {
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
      allowNull: false,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.TEXT
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'USA'
    },
    postalCode: {
      type: DataTypes.STRING
    },
    logo: {
      type: DataTypes.STRING
    },
    website: {
      type: DataTypes.STRING
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'America/New_York'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    // Subscription/License info
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
    subscriptionStartDate: {
      type: DataTypes.DATEONLY
    },
    subscriptionEndDate: {
      type: DataTypes.DATEONLY
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Settings
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        gradingScale: 'percentage',
        attendanceTracking: true,
        parentPortal: true,
        onlinePayments: false,
        reportCardTemplate: 'standard'
      }
    },
    // Features enabled
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        accounting: true,
        messaging: true,
        reportCards: true,
        questionBank: true,
        onlineAssessments: false
      }
    }
  }, {
    indexes: [
      { fields: ['code'] },
      { fields: ['subdomain'] },
      { fields: ['is_active'] }  // Use snake_case for index (underscored: true in config)
    ]
  });

  return School;
};

module.exports = defineSchoolModel;
