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

  // Initial data fetch on component mount
  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching sessions');
      fetchSessions(new Date());
    } else {
      console.log('No user data available, cannot fetch sessions');
      setIsLoading(false);
    }
  }, [user]);

  // Fetch sessions for a date range
  const fetchSessions = async (date) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentDate = date || new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 30); // 30 days before
      
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 60); // 60 days ahead
      
      console.log(`Fetching sessions from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Add a timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      const url = `/api/sessions?startDate=${formattedStartDate}&endDate=${formattedEndDate}&_t=${timestamp}`;
      
      console.log('Fetching sessions from URL:', url);
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle both formats: direct array or {sessions: [...]}
      const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
      console.log(`Received ${sessionsArray.length} sessions from API`);
      
      setSessions(sessionsArray);

      // Set upcoming appointments for the sidebar
      const now = new Date();
      const upcoming = sessionsArray
        .filter(session => new Date(session.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 5); // Get only next 5 appointments
      
      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(`Error fetching sessions: ${error.message}`);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle calendar date range changes
  const handleDatesSet = async (dateInfo) => {
    console.log('Calendar dates set:', dateInfo.startStr, 'to', dateInfo.endStr);
    fetchSessions(dateInfo.start);
  };

  // Transform sessions to calendar events
  const getEvents = () => {
    if (!sessions || sessions.length === 0) {
      return [];
    }
    
    console.log(`Transforming ${sessions.length} sessions into calendar events`);
    
    return sessions.map((session) => {
      // Make sure we have all required properties
      if (!session.id || !session.startTime || !session.endTime) {
        console.warn('Session missing required properties:', session);
        return null;
      }
      
      // Handle both capitalization cases (client vs Client)
      const clientData = session.Client || session.client;
      const clientName = clientData
        ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() 
        : 'No Client';
      
      return {
        id: session.id,
        title: clientName,
        start: new Date(session.startTime),
        end: new Date(session.endTime),
        backgroundColor: statusColors[session.status] || '#999',
        borderColor: statusColors[session.status] || '#999',
        allDay: false,
        extendedProps: { session },
      };
    }).filter(Boolean); // Remove any null events
  };

  // Handle event click (appointment selection)
  const handleEventClick = (clickInfo) => {
    if (onSessionClick) {
      onSessionClick(clickInfo.event.id);
    } else {
      router.push(`/sessions/${clickInfo.event.id}`);
    }
  };

  // Handle date selection (for new appointment creation)
  const handleDateSelect = (selectInfo) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
    } else {
      // Default date selection behavior
      selectInfo.view.calendar.unselect(); // clear date selection
      
      // Open appointment creation dialog in a more modern way
      const startTime = new Date(selectInfo.startStr);
      const endTime = new Date(selectInfo.endStr);
      
      // Could replace with a modal component instead of alert
      if (confirm(`Create a new appointment from ${format(startTime, 'h:mm aa')} to ${format(endTime, 'h:mm aa')}?`)) {
        router.push(`/appointments/new?start=${selectInfo.startStr}&end=${selectInfo.endStr}`);
      }
    }
  };

  // Format time for the upcoming appointments sidebar
  const formatAppointmentTime = (dateTime) => {
    return format(new Date(dateTime), 'h:mm aa');
  };

  // Format date for the upcoming appointments sidebar
  const formatAppointmentDate = (dateTime) => {
    return format(new Date(dateTime), 'MMMM d, yyyy');
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
      {/* Sidebar with upcoming appointments */}
      <div className="w-full md:w-64 bg-gray-800 p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4 text-white">Appointments</h2>
        
        {/* Navigation tabs - could be made functional */}
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
        {isLoading && <div className="text-center py-4 text-gray-300">Loading appointments...</div>}
        {error && <div className="text-center py-4 text-red-400">{error}</div>}
        
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