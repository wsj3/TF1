/**
 * Client Utilities for Therapist's Friend
 * 
 * This file provides utility functions for client-related operations,
 * including data formatting, sorting, filtering, and validation.
 */

/**
 * Format client name in 'Last, First' format
 * 
 * @param {Object} client - Client object
 * @returns {string} Formatted name
 */
export function formatClientName(client) {
  if (!client) return '';
  
  const firstName = client.firstName || '';
  const lastName = client.lastName || '';
  
  if (!firstName && !lastName) return 'Unknown Client';
  if (!lastName) return firstName;
  if (!firstName) return lastName;
  
  return `${lastName}, ${firstName}`;
}

/**
 * Get client full name in 'First Last' format
 * 
 * @param {Object} client - Client object
 * @returns {string} Full name
 */
export function getClientFullName(client) {
  if (!client) return '';
  
  const firstName = client.firstName || '';
  const lastName = client.lastName || '';
  
  if (!firstName && !lastName) return 'Unknown Client';
  
  return `${firstName} ${lastName}`.trim();
}

/**
 * Sort clients by last name, then first name
 * 
 * @param {Array} clients - Array of client objects
 * @returns {Array} Sorted client array
 */
export function sortClientsByName(clients) {
  if (!Array.isArray(clients)) return [];
  
  return [...clients].sort((a, b) => {
    // First compare last names
    const lastA = (a.lastName || '').toLowerCase();
    const lastB = (b.lastName || '').toLowerCase();
    
    if (lastA < lastB) return -1;
    if (lastA > lastB) return 1;
    
    // If last names are the same, compare first names
    const firstA = (a.firstName || '').toLowerCase();
    const firstB = (b.firstName || '').toLowerCase();
    
    if (firstA < firstB) return -1;
    if (firstA > firstB) return 1;
    
    return 0;
  });
}

/**
 * Search clients by name
 * 
 * @param {Array} clients - Array of client objects
 * @param {string} query - Search query
 * @returns {Array} Filtered clients array
 */
export function searchClientsByName(clients, query) {
  if (!Array.isArray(clients) || !query) {
    return clients || [];
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return clients.filter(client => {
    const firstName = (client.firstName || '').toLowerCase();
    const lastName = (client.lastName || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`;
    const reverseName = `${lastName} ${firstName}`;
    
    return firstName.includes(normalizedQuery) ||
           lastName.includes(normalizedQuery) ||
           fullName.includes(normalizedQuery) ||
           reverseName.includes(normalizedQuery);
  });
}

/**
 * Generate client initials (e.g., "JD" for "John Doe")
 * 
 * @param {Object} client - Client object
 * @returns {string} Client initials
 */
export function getClientInitials(client) {
  if (!client) return '';
  
  const firstName = client.firstName || '';
  const lastName = client.lastName || '';
  
  if (!firstName && !lastName) return '??';
  
  const firstInitial = firstName ? firstName[0].toUpperCase() : '';
  const lastInitial = lastName ? lastName[0].toUpperCase() : '';
  
  return `${firstInitial}${lastInitial}`;
}

/**
 * Validate client data before saving
 * 
 * @param {Object} clientData - Client data to validate
 * @returns {Object} Object with isValid boolean and errors array
 */
export function validateClientData(clientData) {
  const errors = [];
  
  // Required fields
  if (!clientData.firstName || clientData.firstName.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!clientData.lastName || clientData.lastName.trim() === '') {
    errors.push('Last name is required');
  }
  
  // Email format validation (if provided)
  if (clientData.email && clientData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Phone format validation (if provided)
  if (clientData.phone && clientData.phone.trim() !== '') {
    // Allow various phone formats, but require at least 10 digits
    const phoneDigits = clientData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.push('Phone number should have at least 10 digits');
    }
  }
  
  // Date of birth validation (if provided)
  if (clientData.dateOfBirth) {
    const dob = new Date(clientData.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date of birth');
    } else {
      // Ensure client is not born in the future
      if (dob > new Date()) {
        errors.push('Date of birth cannot be in the future');
      }
      
      // Check if client is at least 18 years old (for adult clients)
      if (clientData.isAdult) {
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        if (dob > eighteenYearsAgo) {
          errors.push('Adult clients must be at least 18 years old');
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get demo clients (for use in demonstration or testing)
 * 
 * @returns {Array} Array of demo client objects
 */
export function getDemoClients() {
  return [
    {
      id: 'demo-1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-123-4567',
      dateOfBirth: '1980-05-15',
      status: 'active'
    },
    {
      id: 'demo-2',
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.j@example.com',
      phone: '555-987-6543',
      dateOfBirth: '1992-11-23',
      status: 'active'
    },
    {
      id: 'demo-3',
      firstName: 'Michael',
      lastName: 'Williams',
      email: 'mwilliams@example.com',
      phone: '555-789-0123',
      dateOfBirth: '1975-08-30',
      status: 'inactive'
    }
  ];
}

/**
 * Get a specific demo client by ID
 * 
 * @param {string} clientId - The ID of the demo client to retrieve
 * @returns {Object|null} The demo client object or null if not found
 */
export function getDemoClientById(clientId) {
  const demoClients = getDemoClients();
  return demoClients.find(client => client.id === clientId) || null;
}

export default {
  formatClientName,
  getClientFullName,
  sortClientsByName,
  searchClientsByName,
  getClientInitials,
  validateClientData,
  getDemoClients,
  getDemoClientById
}; 