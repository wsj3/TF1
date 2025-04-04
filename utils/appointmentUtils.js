/**
 * Appointment Utilities for Therapist's Friend
 * 
 * This file provides utilities for working with appointments,
 * including type definitions, status management, and related functions.
 */

/**
 * Utility functions for handling appointment types and related operations
 */

/**
 * List of available appointment types with their properties
 */
export const APPOINTMENT_TYPES = [
  {
    id: 'regular',
    name: 'Regular Session',
    icon: 'calendar',
    color: 'blue',
    description: 'Standard appointment for existing clients',
    defaultDuration: 60
  },
  {
    id: 'initial',
    name: 'Initial Consultation',
    icon: 'user-plus',
    color: 'green',
    description: 'First appointment for new clients',
    defaultDuration: 90
  },
  {
    id: 'follow-up',
    name: 'Follow-up',
    icon: 'clipboard-check',
    color: 'purple',
    description: 'Short check-in after a previous appointment',
    defaultDuration: 30
  },
  {
    id: 'emergency',
    name: 'Emergency Session',
    icon: 'exclamation',
    color: 'red',
    description: 'Urgent care appointment',
    defaultDuration: 45
  },
  {
    id: 'group',
    name: 'Group Session',
    icon: 'users',
    color: 'orange',
    description: 'Sessions with multiple clients',
    defaultDuration: 120
  }
];

/**
 * Appointment status options
 */
export const APPOINTMENT_STATUSES = [
  {
    id: 'scheduled',
    name: 'Scheduled',
    description: 'Appointment is confirmed and scheduled',
    color: 'blue'
  },
  {
    id: 'completed',
    name: 'Completed',
    description: 'Appointment has been conducted',
    color: 'green'
  },
  {
    id: 'cancelled',
    name: 'Cancelled',
    description: 'Appointment was cancelled',
    color: 'red'
  },
  {
    id: 'no-show',
    name: 'No Show',
    description: 'Client did not attend the appointment',
    color: 'gray'
  },
  {
    id: 'rescheduled',
    name: 'Rescheduled',
    description: 'Appointment has been rescheduled',
    color: 'yellow'
  }
];

/**
 * Get appointment type details by ID
 * 
 * @param {string} id - The appointment type ID to look up
 * @returns {Object|null} - The appointment type object or null if not found
 */
export function getAppointmentTypeById(id) {
  return APPOINTMENT_TYPES.find(type => type.id === id) || null;
}

/**
 * Get appointment status details by ID
 * 
 * @param {string} statusId - The ID of the appointment status
 * @returns {Object} The appointment status object or a default if not found
 */
export function getAppointmentStatusById(statusId) {
  return APPOINTMENT_STATUSES.find(status => status.id === statusId) || 
    APPOINTMENT_STATUSES.find(status => status.id === 'scheduled'); // Default to scheduled
}

/**
 * Get CSS classes for styling an appointment based on its type and status
 * 
 * @param {string} typeId - The appointment type ID
 * @param {string} status - The appointment status
 * @returns {Object} - Object containing CSS classes for various elements
 */
export function getAppointmentClasses(typeId, status = 'scheduled') {
  const type = getAppointmentTypeById(typeId) || { color: 'gray' };
  
  // Base colors for each type
  const colorMap = {
    blue: 'bg-blue-100 border-blue-300 text-blue-800',
    green: 'bg-green-100 border-green-300 text-green-800',
    purple: 'bg-purple-100 border-purple-300 text-purple-800',
    red: 'bg-red-100 border-red-300 text-red-800',
    orange: 'bg-orange-100 border-orange-300 text-orange-800',
    gray: 'bg-gray-100 border-gray-300 text-gray-800'
  };
  
  // Status-specific styles
  const statusStyles = {
    completed: 'opacity-75',
    cancelled: 'line-through opacity-50',
    'no-show': 'italic opacity-50',
    scheduled: ''
  };
  
  const baseClasses = colorMap[type.color] || colorMap.gray;
  const statusClass = statusStyles[status] || '';
  
  return {
    container: `${baseClasses} border rounded-md ${statusClass}`,
    dot: `bg-${type.color}-500`,
    icon: `text-${type.color}-500`,
    border: `border-${type.color}-300`,
    text: `text-${type.color}-800`,
    badge: `bg-${type.color}-500 text-white`
  };
}

/**
 * Get a filtered list of appointment types (can be used for custom filtering)
 * 
 * @param {Function} filterFn - Optional filter function
 * @returns {Array} - Filtered array of appointment types
 */
export function getFilteredAppointmentTypes(filterFn = null) {
  if (typeof filterFn === 'function') {
    return APPOINTMENT_TYPES.filter(filterFn);
  }
  return [...APPOINTMENT_TYPES];
}

/**
 * Calculate end time from start time and duration
 * 
 * @param {string} startTime - ISO string or date string
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} - Calculated end time as ISO string
 */
export function calculateEndTime(startTime, durationMinutes) {
  try {
    const startDate = new Date(startTime);
    if (isNaN(startDate)) {
      throw new Error('Invalid start time');
    }
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toISOString();
  } catch (error) {
    console.error('Error calculating end time:', error);
    return null;
  }
} 