/**
 * Appointment Actions for AI Assistant
 * 
 * Implements all appointment-related functions that the AI assistant can use.
 * Includes scheduling, rescheduling, cancellation, and availability checking.
 */

import prisma from '../../lib/db';
import { AppointmentAdapter } from '../aiAdapters/appointmentAdapter';

/**
 * Execute database operation with retry logic
 */
async function executeWithRetry(operation, maxRetries = 2) {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries + 1}):`, error.message);
      
      // If this was the last attempt, rethrow the error
      if (attempt > maxRetries) {
        throw error;
      }
      
      // Wait before retrying (with exponential backoff)
      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Check availability for a given time slot
 */
export async function checkAvailability({ date, startTime, endTime }) {
  return executeWithRetry(async () => {
    try {
      // Parse the date and times into DateTime objects
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate)) {
        return {
          success: false,
          message: `Invalid date format: ${date}. Please use YYYY-MM-DD format.`
        };
      }
      
      // Format for date comparison in database query
      const dateString = appointmentDate.toISOString().split('T')[0];
      
      // Find existing appointments that overlap with the requested time slot
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          date: dateString,
          AND: [
            { startTime: { lte: endTime } },
            { endTime: { gte: startTime } }
          ]
        }
      });
      
      const isAvailable = existingAppointments.length === 0;
      
      return {
        success: true,
        data: {
          available: isAvailable,
          conflictingAppointments: isAvailable ? [] : existingAppointments.map(appt => AppointmentAdapter.toExternal(appt))
        },
        message: isAvailable 
          ? `The time slot ${startTime}-${endTime} on ${dateString} is available` 
          : `The time slot ${startTime}-${endTime} on ${dateString} is not available due to scheduling conflicts`
      };
    } catch (error) {
      console.error('Check availability error:', error);
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  });
}

/**
 * Schedule a new appointment
 */
export async function scheduleAppointment({ clientId, date, startTime, endTime, notes, type = 'regular' }) {
  return executeWithRetry(async () => {
    try {
      // First check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });
      
      if (!client) {
        return {
          success: false,
          message: `Client with ID ${clientId} not found`
        };
      }
      
      // Validate the date
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate)) {
        return {
          success: false,
          message: `Invalid date format: ${date}. Please use YYYY-MM-DD format.`
        };
      }
      
      // Format for date comparison
      const dateString = appointmentDate.toISOString().split('T')[0];
      
      // Check availability first
      const availabilityCheck = await checkAvailability({ date: dateString, startTime, endTime });
      if (!availabilityCheck.data.available) {
        return {
          success: false,
          message: `Cannot schedule appointment: time slot is not available`
        };
      }
      
      // Create the appointment
      const appointment = await prisma.appointment.create({
        data: {
          clientId,
          date: dateString,
          startTime,
          endTime,
          type,
          status: 'SCHEDULED',
          notes: notes || ''
        }
      });
      
      // Log the appointment creation
      await prisma.note.create({
        data: {
          clientId,
          content: `Appointment scheduled for ${dateString} from ${startTime} to ${endTime}.${notes ? `\nNotes: ${notes}` : ''}`,
          type: 'appointment',
          createdById: 'system'
        }
      });
      
      return {
        success: true,
        data: AppointmentAdapter.toExternal(appointment),
        message: `Successfully scheduled appointment for ${dateString} from ${startTime} to ${endTime}`
      };
    } catch (error) {
      console.error('Schedule appointment error:', error);
      throw new Error(`Failed to schedule appointment: ${error.message}`);
    }
  });
}

/**
 * Reschedule an existing appointment
 */
export async function rescheduleAppointment({ appointmentId, date, startTime, endTime, notes }) {
  return executeWithRetry(async () => {
    try {
      // First check if appointment exists
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true }
      });
      
      if (!existingAppointment) {
        return {
          success: false,
          message: `Appointment with ID ${appointmentId} not found`
        };
      }
      
      // Validate the date
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate)) {
        return {
          success: false,
          message: `Invalid date format: ${date}. Please use YYYY-MM-DD format.`
        };
      }
      
      // Format for date comparison
      const dateString = appointmentDate.toISOString().split('T')[0];
      
      // Check availability for the new time slot (excluding the current appointment)
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          date: dateString,
          AND: [
            { startTime: { lte: endTime } },
            { endTime: { gte: startTime } },
            { id: { not: appointmentId } }
          ]
        }
      });
      
      if (existingAppointments.length > 0) {
        return {
          success: false,
          message: `Cannot reschedule appointment: the new time slot is not available`
        };
      }
      
      // Store old values for logging
      const oldDate = existingAppointment.date;
      const oldStartTime = existingAppointment.startTime;
      const oldEndTime = existingAppointment.endTime;
      
      // Update the appointment
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          date: dateString,
          startTime,
          endTime,
          ...(notes && { notes })
        }
      });
      
      // Log the rescheduling
      await prisma.note.create({
        data: {
          clientId: existingAppointment.clientId,
          content: `Appointment rescheduled from ${oldDate} ${oldStartTime}-${oldEndTime} to ${dateString} ${startTime}-${endTime}.${notes ? `\nNotes: ${notes}` : ''}`,
          type: 'appointment',
          createdById: 'system'
        }
      });
      
      return {
        success: true,
        data: AppointmentAdapter.toExternal(appointment),
        message: `Successfully rescheduled appointment to ${dateString} from ${startTime} to ${endTime}`
      };
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      throw new Error(`Failed to reschedule appointment: ${error.message}`);
    }
  });
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment({ appointmentId, reason }) {
  return executeWithRetry(async () => {
    try {
      // First check if appointment exists
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true }
      });
      
      if (!existingAppointment) {
        return {
          success: false,
          message: `Appointment with ID ${appointmentId} not found`
        };
      }
      
      // Cancel the appointment
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          notes: reason ? `${existingAppointment.notes}\nCancellation reason: ${reason}` : existingAppointment.notes
        }
      });
      
      // Log the cancellation
      await prisma.note.create({
        data: {
          clientId: existingAppointment.clientId,
          content: `Appointment on ${existingAppointment.date} from ${existingAppointment.startTime} to ${existingAppointment.endTime} has been cancelled.${reason ? `\nReason: ${reason}` : ''}`,
          type: 'appointment',
          createdById: 'system'
        }
      });
      
      return {
        success: true,
        data: AppointmentAdapter.toExternal(appointment),
        message: `Successfully cancelled appointment on ${existingAppointment.date} from ${existingAppointment.startTime} to ${existingAppointment.endTime}`
      };
    } catch (error) {
      console.error('Cancel appointment error:', error);
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
  });
}

/**
 * List upcoming appointments for a client
 */
export async function getClientAppointments({ clientId, status = 'SCHEDULED', limit = 10 }) {
  return executeWithRetry(async () => {
    try {
      // First check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });
      
      if (!client) {
        return {
          success: false,
          message: `Client with ID ${clientId} not found`
        };
      }
      
      // Get client's appointments
      const appointments = await prisma.appointment.findMany({
        where: {
          clientId,
          ...(status ? { status } : {})
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ],
        take: limit
      });
      
      return {
        success: true,
        data: appointments.map(appointment => AppointmentAdapter.toExternal(appointment)),
        message: `Found ${appointments.length} appointments for client ${clientId}`
      };
    } catch (error) {
      console.error('Get client appointments error:', error);
      throw new Error(`Failed to get client appointments: ${error.message}`);
    }
  });
} 