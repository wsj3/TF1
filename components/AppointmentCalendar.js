import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { useAuth } from '../utils/auth';
import styles from '../styles/Calendar.module.css';

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
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const calendarRef = useRef(null);
  // Add debug state for troubleshooting
  const [debugInfo, setDebugInfo] = useState({ visible: false, data: null });

  // Toggle debug information display
  const toggleDebugInfo = () => {
    setDebugInfo(prev => ({ ...prev, visible: !prev.visible }));
  };

  // Process sessions into events
  useEffect(() => {
    if (!sessions || !Array.isArray(sessions)) {
      setEvents([]);
      return;
    }

    const processedEvents = [];
    
    for (const session of sessions) {
      if (!session) continue;
      
      try {
        // Ensure we have valid date objects
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime || new Date(startTime.getTime() + (session.duration || 60) * 60000));

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.error('Invalid date for session:', session);
          continue;
        }

        // Create the event object with all required data
        const event = {
          id: String(session.id || ''),
          title: String(session.clientName || 'No Client Name'),
          start: startTime,
          end: endTime,
          backgroundColor: statusColors[session.status] || 'gray',
          borderColor: statusColors[session.status] || 'gray',
          extendedProps: {
            status: String(session.status || 'SCHEDULED'),
            clientId: String(session.clientId || ''),
            type: String(session.type || 'Regular Session'),
            notes: String(session.notes || ''),
            duration: Number(session.duration || 60)
          }
        };

        processedEvents.push(event);
      } catch (error) {
        console.error('Error formatting event:', error, session);
      }
    }

    setEvents(processedEvents);
  }, [sessions]);

  // Initial data fetch on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeCalendar = async () => {
      if (!user) {
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
        return;
      }

      try {
        await fetchSessions(new Date());
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing calendar:', error);
        if (isMounted) {
          setError(error.message);
          setIsInitialized(true);
        }
      }
    };

    initializeCalendar();

    return () => {
      isMounted = false;
    };
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
      
      const isStaging = typeof window !== 'undefined' && 
                       (window.location.hostname.includes('staging') || 
                        window.location.hostname.includes('vercel.app'));
      
      const isDemoMode = router.query.demo === 'true' || isStaging;
      
      const queryParams = new URLSearchParams({
        start: startStr,
        end: endStr,
        ...(isDemoMode && { demo: 'true' }),
      }).toString();
      
      const response = await fetch(`/api/sessions?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
      
      // Process the sessions synchronously
      const processedSessions = sessionsArray
        .map(session => {
          if (!session) return null;
          
          try {
            const client = session.Client || session.client || {};
            const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'No Client Name';
            const startTime = new Date(session.startTime);
            const endTime = session.endTime 
              ? new Date(session.endTime)
              : new Date(startTime.getTime() + (session.duration || 60) * 60000);

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
              console.error('Invalid date for session:', session);
              return null;
            }

            return {
              ...session,
              id: String(session.id || ''),
              clientName: String(clientName),
              startTime,
              endTime,
              status: String(session.status || 'SCHEDULED'),
              type: String(session.type || 'Regular Session'),
              duration: Number(session.duration || 60)
            };
          } catch (error) {
            console.error('Error processing session:', error, session);
            return null;
          }
        })
        .filter(Boolean);

      setSessions(processedSessions);
      
      const upcoming = processedSessions
        .filter(session => session.startTime > new Date() && session.status === 'SCHEDULED')
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, 5);
      
      setUpcomingAppointments(upcoming);
      setError(null);
      
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.message);
      setSessions([]);
      setUpcomingAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions when calendar dates change
  const handleDatesSet = async (dateInfo) => {
    const calendarDate = new Date(dateInfo.start);
    fetchSessions(calendarDate);
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

  // Update the renderEventContent function to show more appointment details
  const renderEventContent = (eventInfo) => {
    if (!eventInfo?.event) {
      return null;
    }

    try {
      const { event } = eventInfo;
      const startDate = event.start instanceof Date ? event.start : new Date(event.start);
      const endDate = event.end instanceof Date ? event.end : new Date(event.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      const startTime = format(startDate, 'h:mm a');
      const endTime = format(endDate, 'h:mm a');
      const title = String(event.title || 'Untitled');
      const status = String(event.extendedProps?.status || 'UNKNOWN');
      const type = event.extendedProps?.type ? String(event.extendedProps.type) : null;
      const notes = event.extendedProps?.notes;

      return (
        <div className="event-content h-full">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="font-medium text-base mb-1">{title}</div>
              <div className="text-sm opacity-90 flex items-center mb-1">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {startTime} - {endTime}
              </div>
              {type && (
                <div className="text-sm opacity-75 flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {type}
                </div>
              )}
            </div>
            
            <div className="mt-auto">
              {notes && (
                <div className="text-xs opacity-75 mb-2 line-clamp-2">
                  {notes}
                </div>
              )}
              <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
                status === 'SCHEDULED' ? 'bg-blue-900 text-blue-200' :
                status === 'COMPLETED' ? 'bg-green-900 text-green-200' :
                status === 'CANCELLED' ? 'bg-red-900 text-red-200' :
                status === 'NO_SHOW' ? 'bg-orange-900 text-orange-200' :
                'bg-gray-700 text-gray-300'
              }`}>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {status === 'SCHEDULED' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  ) : status === 'COMPLETED' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : status === 'CANCELLED' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                {status}
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering event content:', error);
      return null;
    }
  };

  // Simplified calendar options focusing on time range
  const calendarOptions = {
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    // Core time settings
    slotMinTime: '07:00:00',
    slotMaxTime: '18:00:00',
    scrollTime: '07:00:00',
    slotDuration: '00:30:00',
    allDaySlot: false,
    
    // Essential display settings
    height: 'auto',
    expandRows: true,
    handleWindowResize: true,
    nowIndicator: true,
    
    // Event settings
    events: events,
    eventContent: renderEventContent,
    eventDisplay: 'block',
    eventMinHeight: 80,
    
    // Interaction settings
    selectable: true,
    selectMirror: true,
    selectConstraint: 'businessHours',
    
    // Business hours to constrain both display and selection
    businessHours: {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '07:00',
      endTime: '18:00',
    },
    
    // Event handlers
    datesSet: handleDatesSet,
    eventClick: handleEventClick,
    select: handleDateSelect,
    
    // View-specific settings
    views: {
      timeGridWeek: {
        type: 'timeGrid',
        duration: { weeks: 1 },
        slotDuration: '00:30:00',
        slotMinTime: '07:00:00',
        slotMaxTime: '18:00:00',
        dayHeaderFormat: { weekday: 'long', month: 'numeric', day: 'numeric' },
        slotLabelFormat: {
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
          hour12: true
        }
      },
      timeGridDay: {
        type: 'timeGrid',
        duration: { days: 1 },
        slotDuration: '00:30:00',
        slotMinTime: '07:00:00',
        slotMaxTime: '18:00:00',
        slotLabelFormat: {
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
          hour12: true
        }
      }
    }
  };

  // Only render the calendar once we're initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading calendar...</p>
        </div>
      </div>
    );
  }

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
        
        {/* Calendar container */}
        <div className="calendar-wrapper bg-gray-800 rounded-lg p-4">
          <FullCalendar
            {...calendarOptions}
            ref={calendarRef}
          />
        </div>
      </div>

      {/* Essential styles only */}
      <style jsx global>{`
        .calendar-wrapper .fc {
          height: 100%;
        }
        
        .calendar-wrapper .fc-timegrid-slot {
          height: 4rem;
        }
        
        .calendar-wrapper .fc-timegrid-col {
          min-width: 150px;
        }
        
        /* Hide non-business hours completely */
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane:not([data-time^="07"]):not([data-time^="08"]):not([data-time^="09"]):not([data-time^="10"]):not([data-time^="11"]):not([data-time^="12"]):not([data-time^="13"]):not([data-time^="14"]):not([data-time^="15"]):not([data-time^="16"]):not([data-time^="17"]) {
          display: none !important;
        }
        
        /* Ensure business hours are visible */
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="07"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="08"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="09"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="10"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="11"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="12"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="13"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="14"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="15"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="16"],
        .fc .fc-timegrid-slot.fc-timegrid-slot-lane[data-time^="17"]) {
          display: table-row !important;
        }
      `}</style>
    </div>
  );
} 