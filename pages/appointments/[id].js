import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AppointmentEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchAppointment = async () => {
      try {
        setLoading(true);
        
        // For demo appointments, first check localStorage
        const storedAppointments = JSON.parse(localStorage.getItem('demoAppointments') || '[]');
        const foundAppointment = storedAppointments.find(app => app.id === id);
        
        if (foundAppointment) {
          setAppointment(foundAppointment);
          setError(null);
        } else {
          // If not found in localStorage, try the API
          const response = await fetch(`/api/appointments?demo=true`);
          if (!response.ok) throw new Error('Failed to fetch appointment');
          
          const appointments = await response.json();
          const apiAppointment = appointments.find(app => app.id === id);
          
          if (apiAppointment) {
            setAppointment(apiAppointment);
            setError(null);
          } else {
            throw new Error('Appointment not found');
          }
        }
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Handle saving changes to the appointment
    // For demo purposes, we'll just update localStorage
    try {
      const storedAppointments = JSON.parse(localStorage.getItem('demoAppointments') || '[]');
      const updatedAppointments = storedAppointments.map(app => 
        app.id === appointment.id ? appointment : app
      );
      localStorage.setItem('demoAppointments', JSON.stringify(updatedAppointments));
      
      // Trigger calendar refresh
      const refreshEvent = new CustomEvent('refreshCalendar', {
        detail: { appointment }
      });
      window.dispatchEvent(refreshEvent);
      
      router.push('/appointments');
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError('Failed to save changes');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      // For demo appointments, remove from localStorage
      const storedAppointments = JSON.parse(localStorage.getItem('demoAppointments') || '[]');
      const updatedAppointments = storedAppointments.filter(app => app.id !== appointment.id);
      localStorage.setItem('demoAppointments', JSON.stringify(updatedAppointments));
      
      // Trigger calendar refresh
      const refreshEvent = new CustomEvent('refreshCalendar', {
        detail: { 
          type: 'delete',
          appointmentId: appointment.id 
        }
      });
      window.dispatchEvent(refreshEvent);
      
      router.push('/appointments');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Failed to delete appointment');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center">Loading appointment details...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-red-500 text-center">{error}</div>
            <div className="mt-4 text-center">
              <Link href="/appointments" className="text-blue-400 hover:text-blue-300">
                Return to Appointments
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!appointment) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center">Appointment not found</div>
            <div className="mt-4 text-center">
              <Link href="/appointments" className="text-blue-400 hover:text-blue-300">
                Return to Appointments
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Edit Appointment</h1>
              <Link
                href="/appointments"
                className="text-blue-400 hover:text-blue-300"
              >
                Back to Calendar
              </Link>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Client</label>
                <div className="text-lg">{appointment.client.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <div className="text-lg">{formatDateTime(appointment.startTime)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <div className="text-lg">{formatDateTime(appointment.endTime)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <div className="text-lg">{appointment.type}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={appointment.status}
                  onChange={(e) => setAppointment({...appointment, status: e.target.value})}
                  className="bg-gray-700 text-white rounded px-3 py-2 w-full"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={appointment.notes}
                  onChange={(e) => setAppointment({...appointment, notes: e.target.value})}
                  className="bg-gray-700 text-white rounded px-3 py-2 w-full h-32"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Delete Appointment
                </button>
                <div className="flex space-x-4">
                  <Link
                    href="/appointments"
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
} 