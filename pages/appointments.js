import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

function Appointments() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState('');
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  
  // Initial events for the calendar
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Alice Johnson',
      start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().substring(0, 10) + 'T10:00:00',
      end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().substring(0, 10) + 'T11:00:00',
      backgroundColor: '#3788d8',
      borderColor: '#3788d8'
    },
    {
      id: '2',
      title: 'Bob Smith',
      start: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().substring(0, 10) + 'T14:30:00',
      end: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().substring(0, 10) + 'T15:30:00',
      backgroundColor: '#3788d8',
      borderColor: '#3788d8'
    },
    {
      id: '3',
      title: 'Carol Davis',
      start: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().substring(0, 10) + 'T09:00:00',
      end: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().substring(0, 10) + 'T10:00:00',
      backgroundColor: '#3788d8',
      borderColor: '#3788d8'
    }
  ]);
  
  // Set upcoming appointments based on events
  useEffect(() => {
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start) - new Date(b.start)
    );
    
    // Filter events to only show upcoming ones (from today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = sortedEvents.filter(event => 
      new Date(event.start) >= today
    );
    
    setUpcomingAppointments(upcoming.slice(0, 5)); // Show up to 5 upcoming appointments
  }, [events]);
  
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Handle date click
  const handleDateClick = (arg) => {
    // Navigate to new appointment page with selected date
    router.push(`/appointments/new?date=${arg.dateStr}`);
  };
  
  // Handle event click
  const handleEventClick = (info) => {
    // Navigate to appointment details page
    router.push(`/appointments/${info.event.id}`);
  };
  
  return (
    <Layout>
      <Head>
        <title>Appointments | Therapist's Friend</title>
      </Head>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
        {/* Left side: Navigation and Upcoming Appointments */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold text-white mb-4">Upcoming Appointments</h2>
            
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition"
                    onClick={() => router.push(`/appointments/${appointment.id}`)}
                  >
                    <h3 className="text-white font-medium">{appointment.title}</h3>
                    <p className="text-gray-300 text-sm">
                      {formatDate(appointment.start)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No upcoming appointments scheduled.
              </p>
            )}
          </div>
        </div>
        
        {/* Right side: Calendar */}
        <div className="md:col-span-3">
          <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Calendar</h2>
              <button
                onClick={() => router.push('/appointments/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                New Appointment
              </button>
            </div>
            
            <div className="p-4 bg-gray-800">
              {/* Add custom styles to improve text readability */}
              <style jsx global>{`
                .fc-day-today {
                  background-color: rgba(96, 165, 250, 0.2) !important;
                }
                .fc-col-header-cell {
                  background-color: #374151 !important;
                }
                .fc-col-header-cell-cushion {
                  color: white !important;
                  font-weight: bold !important;
                  padding: 8px 4px !important;
                }
                .fc-daygrid-day-number {
                  color: white !important;
                  font-weight: 500 !important;
                  padding: 8px !important;
                }
                /* Event styling for better readability */
                .fc-event {
                  background-color: #3b82f6 !important;
                  border: 1px solid #2563eb !important;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
                }
                .fc-event-title, .fc-event-time {
                  color: white !important;
                  font-weight: bold !important;
                  text-shadow: 0px 0px 2px rgba(0,0,0,0.5) !important;
                  padding: 3px 4px !important;
                  font-size: 0.9rem !important;
                }
                .fc-event-time {
                  font-weight: 500 !important;
                }
                .fc-button {
                  background-color: #4b5563 !important;
                  border-color: #374151 !important;
                }
                .fc-button:hover {
                  background-color: #6b7280 !important;
                }
                .fc-button-active {
                  background-color: #3b82f6 !important;
                  border-color: #2563eb !important;
                }
                .fc-toolbar-title {
                  color: white !important;
                  font-weight: bold !important;
                }
                .fc-daygrid-day.fc-day-sat, .fc-daygrid-day.fc-day-sun {
                  background-color: rgba(31, 41, 55, 0.5) !important;
                }
                /* Better contrast for day cells */
                .fc-daygrid-day {
                  border-color: #4b5563 !important;
                }
                /* Fix for time grid view */
                .fc-timegrid-slot-label-cushion, .fc-timegrid-axis-cushion {
                  color: white !important;
                }
                .fc-timegrid-event-harness .fc-event {
                  margin: 1px 0 !important;
                }
                .fc-timegrid-event .fc-event-main {
                  padding: 2px 4px !important;
                }
                .fc-v-event .fc-event-title {
                  font-weight: bold !important;
                }
              `}</style>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="auto"
                themeSystem="standard"
                dayMaxEvents={true}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Appointments); 