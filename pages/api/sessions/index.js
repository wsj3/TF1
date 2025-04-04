import prisma from '../../../lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../utils/session';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // In development, bypass authentication
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        data: generateMockSessions(),
        isDemoData: true
      });
    }

    // Get the session
    const session = await getIronSession(req, res, sessionOptions);

    // Basic auth check for production
    if (!session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch both sessions and appointments
    const [sessions, appointments] = await Promise.all([
      // Get existing sessions
      prisma.session.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          client: true
        }
      }),
      // Get appointments that don't have associated sessions
      prisma.appointment.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          },
          NOT: {
            session: {
              some: {}
            }
          }
        },
        include: {
          client: true
        }
      })
    ]);

    // Convert appointments to session format
    const appointmentSessions = appointments.map(apt => ({
      id: `apt-${apt.id}`,
      date: apt.date,
      status: 'SCHEDULED',
      client_name: apt.client?.name || 'Unknown Client',
      client_id: apt.clientId,
      duration: apt.duration || 50,
      type: apt.type || 'Regular Session',
      notes: apt.notes || '',
      fromAppointment: true,
      appointmentId: apt.id
    }));

    // Combine and sort all sessions
    const allSessions = [...sessions, ...appointmentSessions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return res.status(200).json({
      success: true,
      data: allSessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
}

// Helper function to generate mock sessions for development
function generateMockSessions() {
  const today = new Date();
  const sessions = [
    {
      id: 'mock-1',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0).toISOString(),
      status: 'SCHEDULED',
      client_name: 'John Doe',
      client_id: 'mock-client-1',
      duration: 50,
      type: 'Regular Session',
      notes: 'Initial consultation',
      fromAppointment: true
    },
    {
      id: 'mock-2',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0).toISOString(),
      status: 'SCHEDULED',
      client_name: 'Jane Smith',
      client_id: 'mock-client-2',
      duration: 50,
      type: 'Regular Session',
      notes: 'Follow-up session',
      fromAppointment: true
    }
  ];

  console.log('Generated mock sessions:', sessions);
  return sessions;
} 