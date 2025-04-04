import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import Link from 'next/link';
import { 
  formatDateForStorage, 
  parseDateFromStorage, 
  formatDateForCalendar,
  formatDateForDisplay,
  formatTimeForDisplay
} from '../../utils/dateUtils';
import { getAppointmentClasses, getAppointmentTypeById } from '../../utils/appointmentUtils';
import AppointmentTypeBadge from '../../components/AppointmentTypeBadge';

export default function Appointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarKey, setCalendarKey] = useState(Date.now());

  // Load demo appointments directly from localStorage
  const loadFromLocalStorage = () => {
    try {
      console.log("Loading appointments from localStorage");
      const storedData = localStorage.getItem('demoAppointments');
      if (storedData) {
        const stored = JSON.parse(storedData);
        console.log("Found stored appointments:", stored);
        return stored;
      }
      return [];
    } catch (err) {
      console.error("Error loading from localStorage:", err);
      return [];
    }
  };
  
  // Directly convert appointments to calendar events
  const convertToCalendarEvents = (appointments) => {
    const events = [];
    
    appointments.forEach(appt => {
      // Skip invalid appointments
      if (!appt || !appt.startTime || !appt.endTime) {
        console.error("Invalid appointment data:", appt);
        return;
      }
      
      try {
        // Use our consistent date utilities to format dates for FullCalendar
        // This ensures they'll be displayed on the correct day
        const startForCalendar = formatDateForCalendar(appt.startTime);
        const endForCalendar = formatDateForCalendar(appt.endTime);
        
        // Get nice human-readable formats for tooltips and display
        const displayDate = formatDateForDisplay(appt.startTime);
        const displayTime = formatTimeForDisplay(appt.startTime);
        
        // Get the appointment type details
        const typeId = appt.type || 'regular';
        const type = getAppointmentTypeById(typeId);
        
        // Get appropriate styling classes based on type and status
        const appointmentClasses = getAppointmentClasses(typeId, appt.status || 'scheduled');
        
        console.log(`Appointment for ${appt.client?.name}:`, {
          original: {
            start: appt.startTime,
            end: appt.endTime
          },
          formatted: {
            start: startForCalendar,
            end: endForCalendar
          },
          display: `${displayDate} at ${displayTime}`,
          type: type.name
        });
        
        events.push({
          id: appt.id,
          title: `${appt.client?.name || 'Unknown'} - ${type.name}`,
          start: startForCalendar,
          end: endForCalendar,
          allDay: false,
          className: appointmentClasses,
          extendedProps: {
            clientName: appt.client?.name || 'Unknown',
            notes: appt.notes || '',
            status: appt.status || 'scheduled',
            type: typeId,
            typeName: type.name,
            typeIcon: type.icon,
            displayDate: displayDate,
            displayTime: displayTime,
            // Add original times for debugging
            originalStart: appt.startTime,
            originalEnd: appt.endTime
          }
        });
      } catch (err) {
        console.error(`Error creating event for appointment ${appt.id}:`, err);
      }
    });
    
    console.log("Created calendar events:", events);
    return events;
  };
  
  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any existing errors
      
      // Get appointments from localStorage first
      const localAppointments = loadFromLocalStorage();
      
      try {
        // Get appointments from API
        console.log('Fetching appointments from API...');
        const response = await fetch('/api/appointments?demo=true', {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from server');
        }

        const apiAppointments = await response.json();
        console.log('API appointments:', apiAppointments);

        // Create a map of appointment IDs to avoid duplicates
        const appointmentMap = new Map();
        
        // Add local appointments first (they take precedence)
        localAppointments.forEach(appt => {
          if (appt && appt.id) { // Validate appointment has required fields
            try {
              // Ensure dates are in our canonical format
              appt.startTime = formatDateForStorage(appt.startTime || new Date());
              appt.endTime = formatDateForStorage(appt.endTime || new Date());
              appointmentMap.set(appt.id, appt);
            } catch (err) {
              console.error(`Error processing local appointment ${appt.id}:`, err);
            }
          }
        });
        
        // Then add API appointments if not already present
        if (Array.isArray(apiAppointments)) {
          apiAppointments.forEach(appt => {
            if (appt && appt.id && !appointmentMap.has(appt.id)) {
              try {
                // Ensure dates are in our canonical format
                appt.startTime = formatDateForStorage(appt.startTime || new Date());
                appt.endTime = formatDateForStorage(appt.endTime || new Date());
                appointmentMap.set(appt.id, appt);
              } catch (err) {
                console.error(`Error processing API appointment ${appt.id}:`, err);
              }
            }
          });
        }
        
        // Convert the map back to an array
        const combinedAppointments = Array.from(appointmentMap.values());
        
        // Update state with all appointments
        setAppointments(combinedAppointments);
        
        // Convert to calendar events
        const events = convertToCalendarEvents(combinedAppointments);
        setCalendarEvents(events);
        
        // Force calendar to re-render
        setCalendarKey(Date.now());
        
      } catch (apiError) {
        console.error('API Error:', apiError);
        // If API fails but we have local appointments, use those
        if (localAppointments.length > 0) {
          console.log('Using local appointments due to API error');
          const events = convertToCalendarEvents(localAppointments);
          setAppointments(localAppointments);
          setCalendarEvents(events);
          setCalendarKey(Date.now());
        } else {
          throw apiError; // Re-throw if we have no fallback data
        }
      }
      
    } catch (err) {
      console.error('Error in fetchAppointments:', err);
      setError(`Unable to load appointments. ${err.message}`);
      // Set empty states to prevent undefined errors
      setAppointments([]);
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle newly created appointments
  const handleAppointmentCreated = (event) => {
    console.log("Appointment created event received:", event.detail);
    // Trigger a fresh data load
    fetchAppointments();
  };
  
  useEffect(() => {
    // Initial fetch
    fetchAppointments();
    
    // Expose reload method to window
    window.reloadCalendar = fetchAppointments;
    
    // Listen for appointment creation events
    window.addEventListener('appointment-created', handleAppointmentCreated);
    window.addEventListener('refreshCalendar', handleAppointmentCreated);
    
    return () => {
      // Clean up
      delete window.reloadCalendar;
      window.removeEventListener('appointment-created', handleAppointmentCreated);
      window.removeEventListener('refreshCalendar', handleAppointmentCreated);
    };
  }, []);
  
  // Custom event rendering component
  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const displayTime = event.extendedProps.displayTime || 
      (event.start ? 
        formatTimeForDisplay(event.start) : 
        '');
    
    return (
      <div className="p-2 cursor-pointer hover:opacity-80 transition-colors duration-150 h-full overflow-hidden">
        <div className="font-semibold text-sm mb-1">{event.extendedProps.clientName}</div>
        <div className="text-xs opacity-75">{displayTime}</div>
        <AppointmentTypeBadge 
          typeId={event.extendedProps.type} 
          showIcon={true}
          showDuration={false}
          className="text-xs mt-1"
        />
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <Link
            href="/appointments/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            New Appointment
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 bg-opacity-50 rounded text-red-200 border border-red-700">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <FullCalendar
            key={calendarKey}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            slotMinTime="06:00:00" // Start at 6am
            slotMaxTime="19:00:00" // End at 7pm
            events={calendarEvents}
            eventContent={renderEventContent}
            slotDuration="00:30:00" // 30-minute slots
            allDaySlot={false} // Hide "all day" section
            height="auto"
            expandRows={true}
            dayHeaderFormat={{ 
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            eventMinHeight={80}
            slotMinHeight={40}
            nowIndicator={true}
            scrollTime="08:00:00" // Scroll to 8am by default
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
              startTime: '06:00',
              endTime: '19:00',
            }}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            slotEventOverlap={false}
            eventOverlap={false}
            eventClick={(info) => {
              router.push(`/appointments/${info.event.id}`);
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        .fc {
          background: #1a202c;
          border-radius: 0.5rem;
          overflow: hidden;
          font-size: 14px;
        }
        
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #2d3748;
        }

        .fc-theme-standard .fc-scrollgrid {
          border-color: #2d3748;
        }

        .fc-col-header-cell {
          padding: 8px 4px;
          background-color: #2d3748;
        }

        .fc-col-header-cell-cushion {
          color: #e2e8f0;
          font-weight: 500;
          font-size: 0.95em;
          padding: 12px 8px;
          text-transform: uppercase;
          white-space: normal;
          text-align: center;
          line-height: 1.3;
          display: block;
          letter-spacing: 0.5px;
        }

        /* Style for the day number and month */
        .fc-col-header-cell-cushion::after {
          content: attr(data-date);
          display: block;
          font-size: 0.85em;
          font-weight: 400;
          text-transform: none;
          opacity: 0.9;
          margin-top: 4px;
          color: #a0aec0;
        }

        /* Current day header styling */
        .fc-day-today .fc-col-header-cell-cushion {
          color: #90cdf4;
          position: relative;
        }

        .fc-day-today .fc-col-header-cell-cushion::after {
          color: #90cdf4;
          opacity: 0.8;
        }

        .fc-day-today .fc-col-header-cell-cushion::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(66, 153, 225, 0.15);
          z-index: -1;
          border-radius: 4px;
        }

        /* Current day content area styling */
        .fc-day-today {
          background-color: #1a202c !important;
        }

        .fc-day-today .fc-timegrid-col-frame {
          background: rgba(44, 82, 130, 0.2) !important;
        }

        .fc-timegrid-slot {
          height: 40px !important;
        }

        .fc-timegrid-slot-label-cushion {
          color: #a0aec0;
          font-size: 0.9em;
          padding: 4px 8px;
          font-weight: 500;
        }

        .fc-timegrid-axis-cushion {
          color: #a0aec0;
          font-size: 0.9em;
          padding: 4px 8px;
          font-weight: 500;
        }

        .fc-toolbar-title {
          color: #e2e8f0;
          font-size: 1.4em !important;
          font-weight: 700;
        }

        .fc-button {
          background-color: #4a5568 !important;
          border-color: #2d3748 !important;
          color: #e2e8f0 !important;
          font-size: 0.9em !important;
          padding: 8px 16px !important;
          font-weight: 600 !important;
        }

        .fc-button:hover {
          background-color: #2d3748 !important;
        }

        .fc-button-active {
          background-color: #2b6cb0 !important;
        }

        .fc-timegrid-event {
          border-radius: 4px;
          margin: 1px;
          min-height: 80px !important;
          overflow: hidden;
          border: none !important;
        }

        .fc-timegrid-event .fc-event-main {
          padding: 4px;
        }

        .fc-timegrid-now-indicator-line {
          border-color: #e53e3e;
          border-width: 2px;
        }

        .fc-timegrid-now-indicator-arrow {
          border-color: #e53e3e;
          color: #e53e3e;
        }

        .fc-timegrid-cols table {
          width: 100% !important;
        }

        .fc-timegrid-col {
          min-width: 180px !important;
        }

        @media (max-width: 768px) {
          .fc-toolbar {
            flex-direction: column;
            gap: 1rem;
          }
          
          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }

          .fc-col-header-cell-cushion {
            font-size: 1em;
            padding: 8px 4px;
          }
        }
      `}</style>
    </Layout>
  );
} 