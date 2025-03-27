/**
 * Date Utilities for Therapist's Friend
 * 
 * This file provides consistent date handling functions for the entire application.
 * All date manipulation should use these utilities to ensure consistency.
 */

/**
 * Date and time utility functions
 */

// Date formatting options
const DATE_FORMAT_OPTIONS = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
};

const TIME_FORMAT_OPTIONS = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
};

/**
 * Format a date for display in the UI
 * 
 * @param {string|Date} date - Date to format, either a Date object or a string (YYYY-MM-DD)
 * @param {Object} options - Additional formatting options
 * @returns {string} - Formatted date string
 */
export function formatDateForDisplay(date, options = {}) {
  try {
    let dateObj;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Handle ISO string or date-only string
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        // If just a date (YYYY-MM-DD), create with local time
        const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
        dateObj = new Date(year, month - 1, day);
      }
    } else {
      return 'Invalid date';
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const formatOptions = { ...DATE_FORMAT_OPTIONS, ...options };
    return dateObj.toLocaleDateString(undefined, formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a time for display in the UI
 * 
 * @param {string|Date} time - Time to format, either a Date object or a string (HH:MM)
 * @param {Object} options - Additional formatting options
 * @returns {string} - Formatted time string
 */
export function formatTimeForDisplay(time, options = {}) {
  try {
    let timeObj;
    
    if (time instanceof Date) {
      timeObj = time;
    } else if (typeof time === 'string') {
      if (time.includes('T') || time.includes('Z')) {
        // Handle ISO string
        timeObj = new Date(time);
      } else {
        // Handle time string (HH:MM)
        const today = new Date();
        const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
        timeObj = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      }
    } else {
      return 'Invalid time';
    }
    
    if (isNaN(timeObj.getTime())) {
      return 'Invalid time';
    }
    
    const formatOptions = { ...TIME_FORMAT_OPTIONS, ...options };
    return timeObj.toLocaleTimeString(undefined, formatOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Format a datetime for display in the UI
 * 
 * @param {string|Date} datetime - Datetime to format
 * @param {Object} options - Additional formatting options
 * @returns {string} - Formatted datetime string
 */
export function formatDateTimeForDisplay(datetime, options = {}) {
  try {
    const dateObj = datetime instanceof Date ? datetime : new Date(datetime);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date/time';
    }
    
    const date = formatDateForDisplay(dateObj);
    const time = formatTimeForDisplay(dateObj);
    
    return `${date} at ${time}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date/time';
  }
}

/**
 * Format a date for storage in the database
 * 
 * @param {string|Date} date - Date to format
 * @returns {string} - ISO formatted date string
 */
export function formatDateForStorage(date) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error formatting date for storage:', error);
    return null;
  }
}

/**
 * Calculate duration between two dates in minutes
 * 
 * @param {string|Date} startDate - Start date/time
 * @param {string|Date} endDate - End date/time
 * @returns {number} - Duration in minutes
 */
export function calculateDurationInMinutes(startDate, endDate) {
  try {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Get difference in milliseconds and convert to minutes
    const durationMs = end.getTime() - start.getTime();
    return Math.round(durationMs / 60000);
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
}

/**
 * Parse a date string without timezone conversion
 * 
 * @param {string} dateString - Date string to parse (YYYY-MM-DD)
 * @param {string} timeString - Optional time string (HH:MM)
 * @returns {Date} - Date object with local interpretation
 */
export function parseDateLocally(dateString, timeString = null) {
  try {
    if (!dateString) {
      throw new Error('Date string is required');
    }
    
    // Handle ISO strings
    if (dateString.includes('T')) {
      const [datePart, timePart] = dateString.split('T');
      return parseDateLocally(datePart, timePart.replace('Z', ''));
    }
    
    // Parse date components
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    
    // Create date with or without time
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
      return new Date(year, month - 1, day, hours, minutes);
    }
    
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error('Error parsing date locally:', error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Creates a start time string for an appointment from date and time components
 * This is used when creating appointments from separate date and time inputs
 * 
 * @param {string} dateStr - Date string in format YYYY-MM-DD
 * @param {string} timeStr - Time string in format HH:MM or H:MM
 * @returns {string} Formatted date in our canonical format
 */
export function createAppointmentTimeString(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  
  try {
    // Ensure time has proper format (HH:MM)
    const cleanTime = timeStr.includes(':') ? timeStr : `${timeStr}:00`;
    
    // Create the combined string
    return formatDateForStorage(`${dateStr}T${cleanTime}`);
  } catch (error) {
    console.error('Error creating appointment time string:', error);
    return null;
  }
}

/**
 * Calculate end time based on start time and duration
 * 
 * @param {string} startTimeStr - Start time in our canonical format
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End time in our canonical format
 */
export function calculateEndTime(startTimeStr, durationMinutes) {
  if (!startTimeStr) return null;
  
  try {
    // Parse the start time
    const startDate = parseDateFromStorage(startTimeStr);
    if (!startDate) return null;
    
    // Add the duration
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + parseInt(durationMinutes || 60, 10));
    
    // Format the end time
    return formatDateForStorage(endDate);
  } catch (error) {
    console.error('Error calculating end time:', error);
    return null;
  }
}

/**
 * Parse a date from our storage format into a JavaScript Date object
 * This ensures consistent interpretation across the application
 * 
 * @param {string} dateStr - Date string in our canonical format
 * @returns {Date} JavaScript Date object
 */
export function parseDateFromStorage(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Remove any timezone indicator
    const cleanStr = dateStr.replace('Z', '').replace(/\+\d+:\d+$/, '');
    
    // Split into date and time parts
    const [datePart, timePart] = cleanStr.split('T');
    if (!datePart) return null;
    
    // Split date into components
    const [year, month, day] = datePart.split('-').map(p => parseInt(p, 10));
    
    // Split time into components (default to 0 if missing)
    let hours = 0, minutes = 0, seconds = 0;
    if (timePart) {
      const timePieces = timePart.split(':').map(p => parseInt(p, 10));
      hours = timePieces[0] || 0;
      minutes = timePieces[1] || 0;
      seconds = timePieces[2] || 0;
    }
    
    // Create new date with these exact components
    return new Date(year, month - 1, day, hours, minutes, seconds);
  } catch (error) {
    console.error('Error parsing date from storage:', error);
    return null;
  }
}

/**
 * Format a date for the FullCalendar component
 * This ensures dates are displayed correctly in the calendar
 * 
 * @param {string} dateStr - Date string in our canonical format
 * @returns {string} Formatted string for FullCalendar
 */
export function formatDateForCalendar(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Parse the date
    const dateObj = parseDateFromStorage(dateStr);
    if (!dateObj) return null;
    
    // Format for FullCalendar
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    // IMPORTANT: For FullCalendar, we add Z to explicitly make it UTC
    // This counterintuitive approach ensures that FullCalendar doesn't try to do
    // its own timezone adjustment, since it will see this as already in UTC
    return `${year}-${month}-${day}T${hours}:${minutes}:00Z`;
  } catch (error) {
    console.error('Error formatting date for calendar:', error);
    return null;
  }
}

/**
 * Date utility functions for the Therapist's Friend application
 */

/**
 * Format a date to a readable string (Month Day, Year)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date to a short string (MM/DD/YYYY)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string
 */
export function formatShortDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a datetime to include time (Month Day, Year at HH:MM AM/PM)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  return `${formatDate(dateObj)} at ${dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`;
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 weeks")
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  
  if (diffInDays > 0) {
    if (diffInDays < 7) return `In ${diffInDays} days`;
    if (diffInDays < 30) return `In ${Math.round(diffInDays / 7)} weeks`;
    if (diffInDays < 365) return `In ${Math.round(diffInDays / 30)} months`;
    return `In ${Math.round(diffInDays / 365)} years`;
  } else {
    const absDiff = Math.abs(diffInDays);
    if (absDiff < 7) return `${absDiff} days ago`;
    if (absDiff < 30) return `${Math.round(absDiff / 7)} weeks ago`;
    if (absDiff < 365) return `${Math.round(absDiff / 30)} months ago`;
    return `${Math.round(absDiff / 365)} years ago`;
  }
}

/**
 * Parse an ISO date string, ensuring the date is interpreted in the local timezone
 * @param {string} isoString - ISO date string
 * @returns {Date} Date object in local timezone
 */
export function parseLocalDate(isoString) {
  if (!isoString) return null;
  
  // Remove any 'Z' suffix to prevent timezone conversion
  const cleanedString = isoString.replace('Z', '');
  return new Date(cleanedString);
}

/**
 * Add days to a date
 * @param {Date} date - The original date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the difference in days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Difference in days
 */
export function getDaysDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  // Convert to UTC to avoid timezone issues
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  // Calculate difference in days
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Get an array of dates between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Date[]} Array of dates
 */
export function getDatesBetween(startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const dates = [];
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

export default {
  formatDate,
  formatShortDate,
  formatDateTime,
  formatRelativeTime,
  parseLocalDate,
  addDays,
  getDaysDifference,
  getDatesBetween
}; 