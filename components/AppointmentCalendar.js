import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { useAuth } from '../utils/auth';

// Session status to color mapping
const statusColors = {
  SCHEDULED: '#4a6cf7', // bright blue (changed from original)
  COMPLETED: '#28a745', // green
  CANCELLED: '#dc3545', // red
  NO_SHOW: '#fd7e14', // orange
};

export default function AppointmentCalendar({ onSessionClick, onDateSelect }) {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const calendarRef = useRef(null);
  // Add debug state for troubleshooting
  const [debugInfo, setDebugInfo] = useState({ visible: false, data: null });

  // Toggle debug information display
  const toggleDebugInfo = () => {
    setDebugInfo(prev => ({ ...prev, visible: !prev.visible }));
  };

  // Initial data fetch on component mount
  useEffect(() => {
    if (user) {
      fetchSessions(new Date());
    }
  }, [user]);

  // Fetch sessions based on date
  const fetchSessions = async (date) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      
      console.log(`Fetching sessions from ${startStr} to ${endStr}`);
      
      // Add demo mode query parameter for testing without authentication
      const isDemoMode = router.query.demo === 'true';
      const queryParams = new URLSearchParams({
        start: startStr,
        end: endStr,
        ...(isDemoMode && { demo: 'true' }),
      }).toString();
      
      const response = await fetch(`/api/sessions?${queryParams}`);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from API:', errorText);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Sessions data:', data);
      
      // Store response for debugging
      setDebugInfo(prev => ({ ...prev, data }));
      
      // Handle both response formats - array or {sessions: []}
      const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
      console.log('Sessions array:', sessionsArray);
      
      setSessions(sessionsArray);
      
      // Extract upcoming appointments for sidebar
      const upcoming = sessionsArray
        .filter(session => new Date(session.startTime) > new Date() && session.status === 'SCHEDULED')
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 5);
      
      setUpcomingAppointments(upcoming);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.message);
      setIsLoading(false);
      
      // Store error info for debugging
      setDebugInfo(prev => ({ 
        ...prev, 
        error: {
          message: error.message,
          stack: error.stack,
        }
      }));
    }
  };

  // Fetch sessions when calendar dates change
  const handleDatesSet = async (dateInfo) => {
    const calendarDate = new Date(dateInfo.start);
    fetchSessions(calendarDate);
  };

  // Format event data for the calendar
  const getEvents = () => {
    return sessions.map(session => {
      // Handle both capitalization cases for clients
      const client = session.Client || session.client || {};
      
      const clientName = client 
        ? `${client.firstName || ''} ${client.lastName || ''}`.trim() 
        : 'No Client Name';

      return {
        id: session.id,
        title: clientName,
        start: session.startTime,
        end: session.endTime,
        backgroundColor: statusColors[session.status] || 'gray',
        borderColor: statusColors[session.status] || 'gray',
        extendedProps: {
          status: session.status,
          clientId: session.clientId,
          client,
          notes: session.notes || '',
        }
      };
    });
  };

  // Handle event click
  const handleEventClick = (clickInfo) => {
    if (onSessionClick) {
      // Get the session data from the event
      const sessionId = clickInfo.event.id;
      const session = sessions.find(s => s.id === sessionId);
      
      if (session) {
        onSessionClick(session);
      }
    } else {
      router.push(`/sessions/${clickInfo.event.id}`);
    }
  };

  // Handle date select
  const handleDateSelect = (selectInfo) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    } else {
      // Default date selection behavior
      selectInfo.view.calendar.unselect(); // clear date selection
      
      // Open appointment creation form (without dialog component)
      router.push(`/appointments/new?start=${selectInfo.startStr}&end=${selectInfo.endStr}`);
    }
  };

  // Format appointment time for display
  const formatAppointmentTime = (dateTime) => {
    if (!dateTime) return '';
    return format(new Date(dateTime), 'h:mm a');
  };

  // Format appointment date for display
  const formatAppointmentDate = (dateTime) => {
    if (!dateTime) return '';
    return format(new Date(dateTime), 'MMMM d, yyyy');
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
      {/* Sidebar with upcoming appointments */}
      <div className="w-full md:w-64 bg-gray-800 p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4 text-white">Appointments</h2>
        
        {/* Navigation tabs */}
        <div className="flex border-b border-gray-700 mb-4">
          <button className="py-2 px-4 text-blue-400 border-b-2 border-blue-400 font-medium">
            Upcoming
          </button>
          <button className="py-2 px-4 text-gray-400 font-medium">
            Past
          </button>
        </div>
        
        {/* Upcoming appointments list */}
        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <p className="text-gray-400 text-center py-4">Loading appointments...</p>
          ) : error ? (
            <p className="text-red-400 text-center py-4">{error}</p>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No upcoming appointments</p>
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.map((appointment) => {
                const clientData = appointment.Client || appointment.client;
                const clientName = clientData
                  ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim()
                  : 'No Client';
                
                return (
                  <li 
                    key={appointment.id}
                    className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => router.push(`/sessions/${appointment.id}`)}
                  >
                    <div className="font-medium">{clientName}</div>
                    <div className="text-sm text-gray-300">
                      {formatAppointmentDate(appointment.startTime)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {formatAppointmentTime(appointment.startTime)} - {formatAppointmentTime(appointment.endTime)}
                    </div>
                    <div className="mt-1">
                      <span 
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'SCHEDULED' ? 'bg-blue-900 text-blue-200' : 
                          appointment.status === 'COMPLETED' ? 'bg-green-900 text-green-200' :
                          appointment.status === 'CANCELLED' ? 'bg-red-900 text-red-200' :
                          appointment.status === 'NO_SHOW' ? 'bg-orange-900 text-orange-200' :
                          'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {/* Add new appointment button */}
        <button 
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          onClick={() => router.push('/appointments/new')}
        >
          + New Appointment
        </button>
      </div>
      
      {/* Main calendar area */}
      <div className="flex-grow p-4 bg-gray-900">
        {/* Error display */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-100 p-4 mb-4 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <div className="flex mt-2">
              <button 
                onClick={() => fetchSessions(new Date())} 
                className="mr-2 bg-red-700 hover:bg-red-800 text-white font-bold py-1 px-2 rounded"
              >
                Retry
              </button>
              <button 
                onClick={toggleDebugInfo} 
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-1 px-2 rounded"
              >
                {debugInfo.visible ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && <div className="text-center py-4 text-gray-300">Loading appointments...</div>}
        
        {/* Debug information panel */}
        {debugInfo.visible && (
          <div className="fixed top-0 right-0 w-1/2 h-full bg-gray-800 shadow-md z-50 p-4 overflow-auto border-l border-gray-700">
            <h3 className="text-lg font-bold mb-2 text-white">Debug Information</h3>
            <button 
              onClick={toggleDebugInfo} 
              className="absolute top-2 right-2 bg-red-700 hover:bg-red-800 text-white font-bold py-1 px-2 rounded"
            >
              Close
            </button>
            <div className="bg-gray-900 p-4 rounded overflow-auto max-h-screen border border-gray-700">
              <pre className="text-xs text-gray-300">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </div>
        )}
        
        {/* Demo mode indicator */}
        {router.query.demo === 'true' && (
          <div className="bg-yellow-800 bg-opacity-50 border border-yellow-700 text-yellow-100 p-2 mb-4 rounded">
            DEMO MODE ACTIVE
          </div>
        )}
        
        {/* Calendar */}
        <div className="calendar-container bg-gray-800 rounded-lg p-4 h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
              startTime: '09:00',
              endTime: '17:00',
            }}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={getEvents()}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            select={handleDateSelect}
            height="auto"
            // Custom styling
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }}
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
          />
        </div>
      </div>

      {/* Add custom styles for FullCalendar */}
      <style jsx global>{`
        /* Dark theme styling for calendar */
        .calendar-container .fc {
          --fc-border-color: rgba(255, 255, 255, 0.1);
          --fc-button-bg-color: #2d3748;
          --fc-button-border-color: #2d3748;
          --fc-button-hover-bg-color: #4a5568;
          --fc-button-hover-border-color: #4a5568;
          --fc-button-active-bg-color: #4a6cf7;
          --fc-button-active-border-color: #4a6cf7;
          --fc-event-bg-color: #4a6cf7;
          --fc-event-border-color: #4a6cf7;
          --fc-today-bg-color: rgba(74, 108, 247, 0.1);
          --fc-now-indicator-color: #4a6cf7;
          --fc-page-bg-color: #1a202c;
          --fc-neutral-bg-color: #2d3748;
          --fc-list-event-hover-bg-color: #2d3748;
          --fc-highlight-color: rgba(74, 108, 247, 0.2);
        }
        
        .calendar-container .fc-theme-standard th,
        .calendar-container .fc-theme-standard td {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .calendar-container .fc-col-header,
        .calendar-container .fc-daygrid-body {
          width: 100% !important;
        }
        
        .calendar-container .fc-scrollgrid {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .calendar-container .fc-day-today {
          background-color: rgba(74, 108, 247, 0.1) !important;
        }
        
        .calendar-container .fc-button-primary {
          background-color: #2d3748;
          border-color: #2d3748;
          color: white;
        }
        
        .calendar-container .fc-button-primary:hover {
          background-color: #4a5568;
          border-color: #4a5568;
        }
        
        .calendar-container .fc-button-primary:not(:disabled).fc-button-active,
        .calendar-container .fc-button-primary:not(:disabled):active {
          background-color: #4a6cf7;
          border-color: #4a6cf7;
        }
        
        .calendar-container .fc-daygrid-day-number,
        .calendar-container .fc-col-header-cell-cushion {
          color: white;
        }
        
        .calendar-container .fc-timegrid-slot-label-cushion,
        .calendar-container .fc-list-day-text,
        .calendar-container .fc-list-day-side-text {
          color: #cbd5e0;
        }
        
        .calendar-container .fc-timegrid-slot {
          height: 2rem;
        }
      `}</style>
    </div>
  );
} 