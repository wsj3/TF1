import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import AppointmentForm from '../../../components/AppointmentForm';
import { formatDateForDisplay } from '../../../utils/dateUtils';

export default function EditAppointment() {
  const router = useRouter();
  const { id } = router.query;
  
  const [appointment, setAppointment] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch appointment and clients when component mounts or ID changes
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch appointment data
        const appointmentResponse = await fetch(`/api/appointments/${id}`);
        if (!appointmentResponse.ok) {
          throw new Error(`Failed to fetch appointment: ${appointmentResponse.statusText}`);
        }
        const appointmentData = await appointmentResponse.json();
        setAppointment(appointmentData);
        
        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) {
          throw new Error(`Failed to fetch clients: ${clientsResponse.statusText}`);
        }
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load appointment data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle form submission
  const handleSubmit = async (appointmentData) => {
    try {
      setIsLoading(true);
      
      // Format date and time for API
      const { date, time, duration, ...rest } = appointmentData;
      const startTime = `${date}T${time}`;
      
      // Prepare API payload
      const payload = {
        ...rest,
        id,
        startTime,
        duration: parseInt(duration, 10),
      };
      
      console.log('Updating appointment with data:', payload);
      
      // Call the API to update the appointment
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update appointment');
      }
      
      // Redirect to appointments page
      router.push('/appointments?updated=true');
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err.message || 'Failed to update appointment');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    router.push('/appointments');
  };
  
  // Get the client name for display
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Loading Appointment...' : 
             appointment ? `Edit Appointment: ${getClientName(appointment.clientId)}` : 
             'Appointment Not Found'}
          </h1>
          <button
            onClick={() => router.push('/appointments')}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Calendar
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500 text-white p-4 mb-6 rounded-md">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : appointment ? (
          <AppointmentForm
            appointment={appointment}
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : (
          <div className="bg-yellow-500 text-white p-4 rounded-md">
            Appointment not found. It may have been deleted or never existed.
          </div>
        )}
      </div>
    </Layout>
  );
} 