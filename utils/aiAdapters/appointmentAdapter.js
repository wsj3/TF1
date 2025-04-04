/**
 * Appointment Adapter
 * 
 * Transforms appointment data between database schema and external API formats.
 * Provides utilities for date formatting and appointment status handling.
 */

/**
 * AppointmentAdapter utility class for transforming appointment data.
 */
export class AppointmentAdapter {
  /**
   * Format a date string to a human-readable format
   */
  static formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
  
  /**
   * Format a time string (HH:MM) to 12-hour format with AM/PM
   */
  static formatTime(timeString) {
    if (!timeString) return '';
    
    try {
      if (timeString instanceof Date) {
        // Handle Date objects
        const hours = timeString.getHours();
        const minutes = timeString.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12; // Convert 0 to 12
        
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
      } else if (typeof timeString === 'string') {
        // Handle string format (HH:MM)
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12; // Convert 0 to 12
        
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      
      return String(timeString);
    } catch (error) {
      console.error('Error formatting time:', error);
      return String(timeString);
    }
  }
  
  /**
   * Get a human-readable description of the appointment status
   */
  static getStatusDescription(status) {
    switch (status) {
      case 'SCHEDULED':
        return 'Scheduled';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      case 'NO_SHOW':
        return 'No Show';
      default:
        return status;
    }
  }
  
  /**
   * Check if an appointment is in the past
   */
  static isPastAppointment(appointment) {
    if (!appointment || !appointment.startTime) return false;
    
    const now = new Date();
    const appointmentEndTime = appointment.endTime || 
      (appointment.startTime && appointment.duration 
        ? new Date(new Date(appointment.startTime).getTime() + appointment.duration * 60000)
        : null);
    
    if (!appointmentEndTime) return false;
    
    // If appointment end time is in the past, it's a past appointment
    return new Date(appointmentEndTime) < now;
  }
  
  /**
   * Transform database appointment object to external API format
   */
  static toExternal(dbAppointment) {
    if (!dbAppointment) return null;
    
    // Extract date part from startTime
    const appointmentDate = dbAppointment.startTime ? new Date(dbAppointment.startTime) : null;
    const dateStr = appointmentDate ? appointmentDate.toISOString().split('T')[0] : '';
    
    // Calculate whether the appointment is in the past
    const isPast = this.isPastAppointment(dbAppointment);
    
    // Format date and times for display
    const formattedDate = this.formatDate(dbAppointment.startTime);
    const formattedStartTime = this.formatTime(dbAppointment.startTime);
    const formattedEndTime = this.formatTime(dbAppointment.endTime);
    
    return {
      id: dbAppointment.id,
      clientId: dbAppointment.clientId,
      startTime: dbAppointment.startTime,
      endTime: dbAppointment.endTime,
      date: dateStr, // Add date as a string for backward compatibility
      duration: dbAppointment.duration,
      type: dbAppointment.type,
      status: dbAppointment.status,
      notes: dbAppointment.notes,
      
      // Add formatted fields for display
      formattedDate,
      formattedStartTime,
      formattedEndTime,
      formattedTimeRange: `${formattedStartTime} - ${formattedEndTime}`,
      statusDescription: this.getStatusDescription(dbAppointment.status),
      
      // Add helper flags for AI
      isPastAppointment: isPast,
      
      // Include creation and update timestamps
      createdAt: dbAppointment.createdAt,
      updatedAt: dbAppointment.updatedAt,
    };
  }
  
  /**
   * Format a collection of appointments as a summary for the AI assistant
   */
  static formatAppointmentSummary(appointments) {
    if (!appointments || appointments.length === 0) {
      return 'No appointments found.';
    }
    
    // Group appointments by date
    const appointmentsByDate = {};
    
    appointments.forEach(appt => {
      if (!appt.startTime) return;
      
      // Extract date string from startTime
      const appointmentDate = new Date(appt.startTime);
      const dateStr = appointmentDate.toISOString().split('T')[0];
      
      if (!appointmentsByDate[dateStr]) {
        appointmentsByDate[dateStr] = [];
      }
      appointmentsByDate[dateStr].push(appt);
    });
    
    // Sort dates
    const sortedDates = Object.keys(appointmentsByDate).sort();
    
    // Format appointment summary
    const summary = sortedDates.map(dateStr => {
      const dateAppointments = appointmentsByDate[dateStr];
      const formattedDate = this.formatDate(dateStr);
      
      const apptLines = dateAppointments.map(appt => {
        return `  - ${this.formatTime(appt.startTime)} - ${this.formatTime(appt.endTime)}: ${appt.type} (${this.getStatusDescription(appt.status)})`;
      });
      
      return `${formattedDate}:\n${apptLines.join('\n')}`;
    });
    
    return summary.join('\n\n');
  }
} 