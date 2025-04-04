import { withAuth } from '../../../utils/auth';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

// Helper to create appointment time for a specific date
function createAppointmentTime(date, hours, minutes) {
  try {
    // Get the local timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Create the appointment time for the specific date
    const appointmentDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // Validate the date
    if (isNaN(appointmentDate.getTime())) {
      throw new Error('Invalid date created');
    }
    
    console.log('Creating appointment time:', {
      date: date.toISOString(),
      hours,
      minutes,
      timezone,
      appointmentDate: appointmentDate.toISOString(),
      localString: appointmentDate.toLocaleString()
    });

    return appointmentDate.toISOString();
  } catch (error) {
    console.error('Error creating appointment time:', error);
    throw error;
  }
}

// Create mock appointments for a specific date
function createMockAppointments(targetDate) {
  try {
    const date = targetDate ? new Date(targetDate) : new Date();
    
    // Get the current week's dates
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start from Sunday
    
    // Define appointment types with their durations
    const appointmentTypes = [
      { type: 'Initial Consultation', duration: 90 },
      { type: 'Follow-up', duration: 45 },
      { type: 'Regular Session', duration: 60 },
      { type: 'Emergency Session', duration: 60 },
      { type: 'Group Session', duration: 120 }
    ];
    
    // Create appointments for each day of the week
    const appointments = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      
      // Only create appointments for weekdays
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Morning appointments (8 AM to 12 PM)
        let currentTime = 8; // Start at 8 AM
        while (currentTime < 12) {
          const appointmentType = appointmentTypes[Math.floor(Math.random() * 3)]; // Use first 3 types for morning
          
          appointments.push({
            id: `${i}-${currentTime}`,
            clientName: ['Jane Smith', 'Sarah Johnson', 'John Doe', 'Michael Brown'][Math.floor(Math.random() * 4)],
            startTime: createAppointmentTime(currentDate, currentTime, 0),
            duration: appointmentType.duration,
            type: appointmentType.type,
            status: 'SCHEDULED',
            notes: `${appointmentType.type} appointment`
          });
          
          // Increment time based on appointment duration (with 15-min buffer)
          currentTime += (appointmentType.duration + 15) / 60;
        }
        
        // Afternoon appointments (1 PM to 5 PM)
        currentTime = 13; // Start at 1 PM
        while (currentTime < 17) {
          const appointmentType = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
          
          appointments.push({
            id: `${i}-${currentTime}`,
            clientName: ['Emily Davis', 'Robert Wilson', 'Maria Garcia', 'David Chen'][Math.floor(Math.random() * 4)],
            startTime: createAppointmentTime(currentDate, currentTime, 0),
            duration: appointmentType.duration,
            type: appointmentType.type,
            status: 'SCHEDULED',
            notes: `${appointmentType.type} appointment`
          });
          
          // Increment time based on appointment duration (with 15-min buffer)
          currentTime += (appointmentType.duration + 15) / 60;
        }
      }
    }
    
    // Return all appointments for the week
    return appointments;
  } catch (error) {
    console.error('Error creating mock appointments:', error);
    throw error;
  }
}

async function handler(req, res) {
  // Get timezone early to include in error responses
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    // Validate request method
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed',
        data: null,
        timezone
      });
    }

    // Get the target date from query parameters
    const { date: targetDate } = req.query;
    console.log('Handling appointments request for date:', targetDate);
    
    // Create mock appointments for the target date
    const mockAppointments = createMockAppointments(targetDate);
    
    // Log the appointments being returned
    console.log('Returning appointments:', {
      targetDate,
      count: mockAppointments.length,
      appointments: mockAppointments.map(apt => ({
        ...apt,
        localTime: new Date(apt.startTime).toLocaleTimeString(),
        timezone
      }))
    });
    
    // Return the response
    return res.status(200).json({
      success: true,
      data: mockAppointments,
      isDemoData: true,
      timezone,
      message: 'Successfully retrieved appointments'
    });
  } catch (error) {
    console.error('Error in appointments handler:', {
      error,
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments: ' + error.message,
      data: null,
      timezone
    });
  }
}

export default withAuth(handler); 