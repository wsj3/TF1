import { PrismaClient } from '@prisma/client';
import { ironSession } from 'iron-session';
import { ironOptions } from '../../../lib/config';
import { createSafeApiEndpoint } from '../../../utils/apiHelpers';
import { ClientAdapter } from '../../../utils/aiAdapters/clientAdapter';
import { formatDateForStorage } from '../../../utils/dateUtils';
import { APPOINTMENT_TYPES, getAppointmentTypeById } from '../../../utils/appointmentUtils';

/**
 * API endpoint for creating new appointments
 * Handles both database and demo appointments
 */
async function handler(req, res, prisma) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use /api/appointments/create for creating appointments.' 
    });
  }
  
  console.log('POST /api/appointments/create called');
  
  try {
    const { 
      clientId, 
      startTime, 
      endTime, 
      duration, 
      notes = '', 
      type = 'regular', 
      status = 'scheduled',
      demo = false  // Flag to indicate if this is a demo appointment
    } = req.body;
    
    // Input validation
    if (!clientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Client ID is required' 
      });
    }
    
    if (!startTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start time is required' 
      });
    }
    
    // Validate appointment type
    const appointmentType = getAppointmentTypeById(type);
    if (!appointmentType) {
      return res.status(400).json({
        success: false,
        error: `Invalid appointment type: ${type}`
      });
    }
    
    // Use default duration from appointment type if not provided
    const appointmentDuration = duration || appointmentType.defaultDuration || 60;
    
    // Handle demo appointments
    if (demo || clientId.startsWith('demo-')) {
      return await handleDemoAppointment(req, res, appointmentDuration);
    }
    
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { notes: true }
    });
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: `Client with ID ${clientId} not found` 
      });
    }
    
    // Calculate end time if not provided
    let appointmentEndTime = endTime ? new Date(endTime) : null;
    if (!appointmentEndTime && startTime && appointmentDuration) {
      appointmentEndTime = new Date(new Date(startTime).getTime() + appointmentDuration * 60000);
    }
    
    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        startTime: new Date(startTime),
        endTime: appointmentEndTime,
        duration: appointmentDuration,
        notes,
        type,
        status
      },
      include: {
        client: {
          include: {
            notes: true
          }
        }
      }
    });

    // Extract client info from notes
    const clientInfo = ClientAdapter.extractClientInfoFromNotes(client.notes);
    
    // Return the created appointment with client info
    return res.status(201).json({ 
      success: true, 
      appointment: {
        ...appointment,
        client: {
          ...appointment.client,
          name: clientInfo.name || '',
          email: clientInfo.email || '',
          phone: clientInfo.phone || ''
        }
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create appointment', 
      details: error.message 
    });
  }
}

/**
 * Handle demo appointment creation (store in localStorage when in browser environment)
 */
export async function handleDemoAppointment(req, res, calculatedDuration) {
  // Extract data from request
  const { clientId, startTime, endTime, duration, notes, type = 'regular', status } = req.body;
  
  console.log('Creating demo appointment:', req.body);

  try {
    // Define some demo clients to use for testing
    const demoClients = [
      { id: 'demo-1', name: 'Jane Smith', email: 'jane@example.com', phone: '555-123-4567' },
      { id: 'demo-2', name: 'Michael Johnson', email: 'michael@example.com', phone: '555-765-4321' },
      { id: 'demo-3', name: 'Sarah Williams', email: 'sarah@example.com', phone: '555-987-6543' },
      { id: 'demo-4', name: 'John Doe', email: 'john@example.com', phone: '555-567-8901' },
      { id: 'demo-5', name: 'Emily Davis', email: 'emily@example.com', phone: '555-456-7890' }
    ];
    
    // Find client info
    const client = demoClients.find(c => c.id === clientId) || { 
      id: clientId, 
      name: 'Demo Client', 
      email: 'demo@example.com', 
      phone: '555-555-5555' 
    };
    
    // Get appointment type info
    const appointmentType = getAppointmentTypeById(type);
    
    // Use provided duration, or default from type, or 60 minutes
    const finalDuration = calculatedDuration || 
      duration || 
      appointmentType.defaultDuration || 
      60;
    
    // Generate an appointment id based on timestamp
    const appointmentId = `appt-${Date.now()}`;
    
    // Ensure consistent date formatting using our utility
    const normalizedStartTime = formatDateForStorage(startTime);
    const normalizedEndTime = endTime ? 
      formatDateForStorage(endTime) :
      calculateEndTime(normalizedStartTime, finalDuration);
    
    console.log('Normalized start time:', normalizedStartTime);
    console.log('Normalized end time:', normalizedEndTime);
    
    const appointment = {
      id: appointmentId,
      clientId,
      client,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      duration: parseInt(finalDuration, 10),
      notes: notes || `${appointmentType.name} for ${client.name}`,
      type: type,
      status: status || 'scheduled',
      createdAt: formatDateForStorage(new Date()),
      demo: true
    };
    
    // Store in global object for demo purposes
    let existingAppointments = [];
    
    // If running in browser, get from localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedAppointments = localStorage.getItem('demoAppointments');
        existingAppointments = storedAppointments ? JSON.parse(storedAppointments) : [];
      } catch (err) {
        console.error('Error reading from localStorage:', err);
      }
    } else if (typeof global.demoAppointments !== 'undefined') {
      // If running on server side
      existingAppointments = global.demoAppointments || [];
    }
    
    // Check if appointment already exists
    const existingIndex = existingAppointments.findIndex(a => a.id === appointmentId);
    
    if (existingIndex >= 0) {
      // Update existing appointment
      existingAppointments[existingIndex] = appointment;
    } else {
      // Add new appointment
      existingAppointments.push(appointment);
    }
    
    // Save updated appointments
    if (typeof window !== 'undefined') {
      localStorage.setItem('demoAppointments', JSON.stringify(existingAppointments));
    } else {
      global.demoAppointments = existingAppointments;
    }
    
    // In a server environment, we need to set CORS headers for the response
    if (res) {
      // Add a script tag to trigger a refresh event on the client side
      const refreshScript = `
        <script>
          window.parent.dispatchEvent(new CustomEvent('appointment-created', { 
            detail: { appointment: ${JSON.stringify(appointment)} }
          }));
          window.parent.reloadCalendar && window.parent.reloadCalendar();
        </script>
      `;
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        success: true,
        appointment,
        refreshScript
      });
    }
    
    return {
      success: true,
      appointment
    };
  } catch (error) {
    console.error('Error creating demo appointment:', error);
    
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error creating demo appointment'
      });
    }
    
    return {
      success: false,
      error: error.message || 'Error creating demo appointment'
    };
  }
}

/**
 * Helper function to calculate end time from start time and duration
 */
function calculateEndTime(startTimeStr, durationMinutes) {
  try {
    const startDate = new Date(startTimeStr);
    const endDate = new Date(startDate.getTime() + parseInt(durationMinutes, 10) * 60000);
    return formatDateForStorage(endDate);
  } catch (error) {
    console.error('Error calculating end time:', error);
    return null;
  }
}

export default createSafeApiEndpoint(handler); 