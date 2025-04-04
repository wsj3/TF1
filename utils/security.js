import { encryptData, decryptData } from './encryption';
import { validateHIPAACompliance } from './hipaaUtils';

// Role-based access control (RBAC) configuration
const ROLES = {
  ADMIN: 'admin',
  THERAPIST: 'therapist',
  CLIENT: 'client',
  STAFF: 'staff'
};

// Permission matrix
const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'manage_users',
    'manage_roles',
    'view_audit_logs',
    'manage_settings',
    'view_all_records',
    'manage_treatment_plans',
    'manage_appointments'
  ],
  [ROLES.THERAPIST]: [
    'view_client_records',
    'create_treatment_plans',
    'edit_treatment_plans',
    'manage_appointments',
    'view_own_appointments',
    'create_progress_notes'
  ],
  [ROLES.CLIENT]: [
    'view_own_records',
    'view_own_appointments',
    'schedule_appointments',
    'view_own_treatment_plan'
  ],
  [ROLES.STAFF]: [
    'view_appointments',
    'manage_appointments',
    'view_client_list',
    'create_progress_notes'
  ]
};

/**
 * Check if a user has a specific permission
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasPermission = (role, permission) => {
  return PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a user has any of the specified permissions
 * @param {string} role - User's role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} - Whether the user has any of the permissions
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a user has all of the specified permissions
 * @param {string} role - User's role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} - Whether the user has all of the permissions
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.action - Action performed
 * @param {string} params.resource - Resource affected
 * @param {Object} params.details - Additional details
 * @param {string} params.ipAddress - IP address of the user
 * @returns {Object} - Audit log entry
 */
export const createAuditLog = async ({
  userId,
  action,
  resource,
  details,
  ipAddress
}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userId,
    action,
    resource,
    details,
    ipAddress
  };

  try {
    // Validate HIPAA compliance of log entry
    if (!validateHIPAACompliance(JSON.stringify(logEntry))) {
      throw new Error('Audit log contains potentially sensitive information');
    }

    // Encrypt sensitive details
    const encryptedDetails = encryptData(JSON.stringify(details));

    // Store the audit log
    const response = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...logEntry,
        details: encryptedDetails
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create audit log');
    }

    return logEntry;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

/**
 * Verify session token
 * @param {string} token - Session token to verify
 * @returns {Object} - Decoded token data
 */
export const verifySessionToken = async (token) => {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid session token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying session token:', error);
    throw error;
  }
};

/**
 * Generate a secure session token
 * @param {Object} userData - User data to include in token
 * @returns {string} - Secure session token
 */
export const generateSessionToken = async (userData) => {
  try {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to generate session token');
    }

    const { token } = await response.json();
    return token;
  } catch (error) {
    console.error('Error generating session token:', error);
    throw error;
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
export const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    errors: []
  };

  // Check minimum length
  if (password.length < 12) {
    result.errors.push('Password must be at least 12 characters long');
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    result.errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    result.errors.push('Password cannot contain repeated characters');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Sanitize user input
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/&/g, '&amp;') // Encode ampersands
    .replace(/"/g, '&quot;') // Encode double quotes
    .replace(/'/g, '&#x27;') // Encode single quotes
    .replace(/\//g, '&#x2F;'); // Encode forward slashes
}; 