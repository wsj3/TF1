import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';

// Demo appointments data
const DEMO_EVENTS = [
  {
    id: 1,
    title: 'Initial Consultation',
    start: '2025-03-05T09:00:00',
    end: '2025-03-05T10:00:00',
    backgroundColor: '#4a6cf7',
    borderColor: '#4a6cf7',
    extendedProps: {
      status: 'SCHEDULED',
      clientName: 'John Doe'
    }
  },
  {
    id: 2,
    title: 'Follow-up Session',
    start: '2025-03-06T14:00:00',
    end: '2025-03-06T15:00:00',
    backgroundColor: '#4a6cf7',
    borderColor: '#4a6cf7',
    extendedProps: {
      status: 'SCHEDULED',
      clientName: 'Jane Smith'
    }
  },
  {
    id: 3,
    title: 'Group Therapy',
    start: '2025-03-07T11:00:00',
    end: '2025-03-07T12:30:00',
    backgroundColor: '#28a745',
    borderColor: '#28a745',
    extendedProps: {
      status: 'COMPLETED',
      clientName: 'Support Group'
    }
  },
  {
    id: 4,
    title: 'Emergency Session',
    start: '2025-03-08T16:00:00',
    end: '2025-03-08T17:00:00',
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
    extendedProps: {
      status: 'CANCELLED',
      clientName: 'Alex Johnson'
    }
  }
];

// Status colors
const statusColors = {
  SCHEDULED: '#4a6cf7', // bright blue
  COMPLETED: '#28a745', // green
  CANCELLED: '#dc3545', // red
  NO_SHOW: '#fd7e14',   // orange
};

export default function DemoCalendar({ onSessionClick, onDateSelect }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load demo data
  useEffect(() => {
    console.log('Loading demo calendar data');
    
    // Generate dynamic dates based on current date
    const today = new Date();
    const dynamicEvents = DEMO_EVENTS.map(event => {
      // Keep the time but update the date to be relative to today
      const eventDate = new Date(event.start);
      const daysToAdd = parseInt(event.id) - 1; // Use ID to space out events
      
      const newStart = new Date(today);
      newStart.setDate(today.getDate() + daysToAdd);
      newStart.setHours(eventDate.getHours());
      newStart.setMinutes(eventDate.getMinutes());
      
      const newEnd = new Date(today);
      newEnd.setDate(today.getDate() + daysToAdd);
      newEnd.setHours(new Date(event.end).getHours());
      newEnd.setMinutes(new Date(event.end).getMinutes());
      
      return {
        ...event,
        start: newStart.toISOString(),
        end: newEnd.toISOString()
      };
    });
    
    setEvents(dynamicEvents);
    setIsLoading(false);
  }, []);

  // Calendar options
  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: events,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    select: (selectInfo) => {
      if (onDateSelect) {
        onDateSelect(selectInfo.start, selectInfo.end);
      }
    },
    eventClick: (clickInfo) => {
      if (onSessionClick) {
        onSessionClick(clickInfo.event.extendedProps);
      }
    },
    // Custom styling for fullcalendar
    height: 'auto',
    contentHeight: 600,
    themeSystem: 'standard',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: 'short'
    }
  };

  // Custom styling to better match dark theme
  const calendarStyles = {
    '.fc': {
      '--fc-page-bg-color': '#1f2937',
      '--fc-border-color': '#374151',
      '--fc-neutral-bg-color': '#374151',
      '--fc-today-bg-color': 'rgba(59, 130, 246, 0.15)',
      '--fc-event-selected-bg-color': '#2563eb',
      '--fc-event-selected-border-color': '#1e40af',
      '--fc-button-bg-color': '#3b82f6',
      '--fc-button-border-color': '#2563eb',
      '--fc-button-hover-bg-color': '#2563eb',
      '--fc-button-hover-border-color': '#1e40af',
      '--fc-button-active-bg-color': '#1e40af'
    },
    '.fc .fc-col-header': {
      'background-color': '#374151',
    },
    '.fc .fc-col-header-cell-cushion': {
      'color': '#e5e7eb',
      'padding': '10px 4px'
    },
    '.fc .fc-daygrid-day-number': {
      'color': '#e5e7eb'
    },
    '.fc .fc-toolbar-title': {
      'color': '#e5e7eb'
    },
    '.fc-theme-standard .fc-list-day-cushion': {
      'background-color': '#374151'
    },
    '.fc-direction-ltr .fc-list-day-text, .fc-direction-rtl .fc-list-day-side-text': {
      'color': '#e5e7eb'
    },
    '.fc .fc-list-event-time': {
      'color': '#e5e7eb'
    },
    '.fc-timegrid-slot-label-cushion': {
      'color': '#e5e7eb'
    },
    '.fc-theme-standard .fc-list': {
      'border-color': '#374151'
    },
    '.fc .fc-button': {
      'background-color': '#3b82f6',
      'border-color': '#2563eb',
    },
    '.fc .fc-button:hover': {
      'background-color': '#2563eb',
      'border-color': '#1e40af'
    },
    '.fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active': {
      'background-color': '#1e40af',
      'border-color': '#1d4ed8'
    }
  };

  return (
    <div className="demo-calendar-container">
      {/* Custom styles for calendar */}
      <style jsx global>
        {`
          ${Object.entries(calendarStyles).map(([selector, styles]) => 
            `${selector} { ${Object.entries(styles).map(([prop, value]) => 
              `${prop}: ${value};`).join(' ')} }`
          ).join('\n')}
        `}
      </style>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading calendar...</div>
        </div>
      ) : (
        <div className="calendar-wrapper p-2">
          <div className="mb-4 p-3 bg-blue-900 bg-opacity-20 rounded text-sm">
            <p className="text-white mb-1">
              <span className="font-semibold">Demo Calendar:</span> Showing sample appointment data
            </p>
            <p className="text-gray-300 text-xs">
              This is a demo implementation with hardcoded appointment data. Click an appointment or select a time slot to interact.
            </p>
          </div>
          
          <FullCalendar
            {...calendarOptions}
          />
        </div>
      )}
    </div>
  );
} 