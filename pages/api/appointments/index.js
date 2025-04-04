import { PrismaClient } from '@prisma/client';
import { ironSession } from 'iron-session';
import { ironOptions } from '../../../lib/config';
import { createSafeApiEndpoint } from '../../../utils/apiHelpers';
import { ClientAdapter } from '../../../utils/aiAdapters/clientAdapter';
import { formatDateForStorage } from '../../../utils/dateUtils';

/**
 * API endpoint for fetching appointments
 * Now improved to handle demo mode and better extract client information
 */
async function handler(req, res, prisma) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use /api/appointments/create for creating appointments.' 
    });
  }
  
  console.log('GET /api/appointments called with query:', req.query);
  
  try {
    // Check if demo mode is requested
    const { demo, clientId, startDate, endDate, status } = req.query;
    
    // If in demo mode, return both hardcoded and dynamically created demo appointments
    if (demo === 'true') {
      console.log('Demo mode requested');
      
      // Get hardcoded demo appointments
      const hardcodedAppointments = getDemoAppointments();
      
      // Get dynamically created demo appointments from memory
      const dynamicAppointments = global.demoAppointments || [];
      console.log('Dynamic appointments:', dynamicAppointments);
      
      // Combine both types of appointments
      const allAppointments = [...hardcodedAppointments, ...dynamicAppointments];
      console.log('Total appointments:', allAppointments.length);
      
      return res.status(200).json(allAppointments);
    }
    
    // Build where clause for filtering appointments
    const where = {};
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    if (startDate) {
      where.startTime = {
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.endTime = {
        lte: new Date(endDate)
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    // Fetch appointments with client information
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          include: {
            notes: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    console.log(`Found ${appointments.length} appointments`);
    
    // Process appointments to include client names from notes
    const processedAppointments = appointments.map(appointment => {
      // Extract client info from notes using the adapter
      let name = '';
      let email = '';
      let phone = '';
      
      if (appointment.client?.notes) {
        const clientInfo = ClientAdapter.extractClientInfoFromNotes(appointment.client.notes);
        name = clientInfo.name || '';
        email = clientInfo.email || '';
        phone = clientInfo.phone || '';
      }
      
      // Return processed appointment with client info
      return {
        ...appointment,
        client: {
          ...appointment.client,
          name,
          email,
          phone
        }
      };
    });
    
    return res.status(200).json(processedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch appointments',
      details: error.message
    });
  }
}

function getDemoAppointments() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Create demo appointments for the next 7 days
  const demoAppointments = [];
  
  // Demo clients
  const demoClients = [
    { id: "demo-1", name: "Jane Smith", email: "jane.smith@example.com", phone: "(555) 123-4567" },
    { id: "demo-2", name: "John Doe", email: "john.doe@example.com", phone: "(555) 987-6543" },
    { id: "demo-3", name: "Sarah Johnson", email: "sarah.j@example.com", phone: "(555) 234-5678" },
    { id: "demo-4", name: "Michael Brown", email: "m.brown@example.com", phone: "(555) 345-6789" },
    { id: "demo-5", name: "Emily Davis", email: "emily.d@example.com", phone: "(555) 456-7890" },
  ];
  
  // Types and statuses
  const types = ['initial', 'regular', 'follow-up', 'emergency'];
  const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
  
  // Generate appointments
  for (let i = 0; i < 10; i++) {
    const clientIndex = i % demoClients.length;
    const client = demoClients[clientIndex];
    
    const dayOffset = Math.floor(i / 2); // 2 appointments per day
    const hourOffset = (i % 2) * 2 + 9; // 9am or 11am
    
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + dayOffset);
    appointmentDate.setHours(hourOffset, 0, 0, 0);
    
    const endTime = new Date(appointmentDate);
    endTime.setMinutes(endTime.getMinutes() + 60);
    
    // Format dates consistently using our utility
    const startTimeString = formatDateForStorage(appointmentDate);
    const endTimeString = formatDateForStorage(endTime);
    
    demoAppointments.push({
      id: `demo-appt-${i}`,
      clientId: client.id,
      startTime: startTimeString,
      endTime: endTimeString,
      duration: 60,
      notes: `Demo appointment with ${client.name}`,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      createdAt: formatDateForStorage(new Date()),
      updatedAt: formatDateForStorage(new Date()),
      client
    });
  }
  
  console.log('Generated demo appointments:', demoAppointments);
  return demoAppointments;
}

// Export safe API endpoint
export default createSafeApiEndpoint(handler); 