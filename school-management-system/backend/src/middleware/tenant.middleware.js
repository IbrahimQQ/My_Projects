/**
 * Multi-Tenant Middleware
 *
 * This middleware handles tenant (school) isolation for all requests.
 * It extracts the school context from:
 * 1. User's schoolId (stored in JWT/user record)
 * 2. Subdomain (e.g., lincoln.schoolms.com)
 * 3. X-School-ID header (for API calls)
 *
 * All subsequent database queries are automatically filtered by schoolId.
 */

const { School } = require('../models');

// Extract tenant from request
const extractTenant = async (req, res, next) => {
  try {
    let schoolId = null;
    let school = null;

    // Priority 1: From authenticated user
    if (req.user && req.user.schoolId) {
      schoolId = req.user.schoolId;
    }
    // Priority 2: From header (for API integrations)
    else if (req.headers['x-school-id']) {
      schoolId = req.headers['x-school-id'];
    }
    // Priority 3: From subdomain
    else {
      const host = req.headers.host || '';
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        school = await School.findOne({ where: { subdomain, isActive: true } });
        if (school) {
          schoolId = school.id;
        }
      }
    }

    // Validate school exists and is active
    if (schoolId && !school) {
      school = await School.findOne({ where: { id: schoolId, isActive: true } });
    }

    if (school) {
      // Attach school context to request
      req.school = school;
      req.schoolId = school.id;

      // Check subscription status
      if (school.subscriptionEndDate && new Date(school.subscriptionEndDate) < new Date()) {
        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Please renew your subscription to continue using the service'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next(error);
  }
};

// Require tenant for protected routes
const requireTenant = (req, res, next) => {
  if (!req.schoolId) {
    return res.status(400).json({
      error: 'School context required',
      message: 'Please specify a valid school context'
    });
  }
  next();
};

// Super admin bypass (for platform-level operations)
const superAdminBypass = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    // Super admins can access all schools
    req.bypassTenant = true;
  }
  next();
};

// Middleware to inject schoolId into query options
const injectTenantScope = (Model) => {
  // Add default scope to filter by schoolId
  Model.addScope('tenant', (schoolId) => ({
    where: { schoolId }
  }));

  // Override findAll, findOne, etc. to auto-filter
  const originalFindAll = Model.findAll.bind(Model);
  Model.findAll = function(options = {}) {
    if (options.bypassTenant) {
      delete options.bypassTenant;
      return originalFindAll(options);
    }

    const schoolId = options.schoolId || global.currentSchoolId;
    if (schoolId && this.rawAttributes.schoolId) {
      options.where = options.where || {};
      options.where.schoolId = schoolId;
    }
    return originalFindAll(options);
  };

  return Model;
};

// Helper to add schoolId to create operations
const addTenantToCreate = (req, data) => {
  if (req.schoolId && !data.schoolId) {
    data.schoolId = req.schoolId;
  }
  return data;
};

// Validation helper for cross-tenant access
const validateTenantAccess = async (req, entitySchoolId) => {
  // Super admins can access any tenant
  if (req.user && req.user.role === 'superadmin') {
    return true;
  }

  // Regular users can only access their own tenant
  if (req.schoolId && entitySchoolId === req.schoolId) {
    return true;
  }

  return false;
};

module.exports = {
  extractTenant,
  requireTenant,
  superAdminBypass,
  injectTenantScope,
  addTenantToCreate,
  validateTenantAccess
};
