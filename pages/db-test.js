import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

export default function DatabaseTest() {
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  
  // Appointment form state
  const [appointmentClientId, setAppointmentClientId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentDuration, setAppointmentDuration] = useState(60);
  const [appointmentType, setAppointmentType] = useState('Therapy Session');
  
  // Load clients and appointments on page load
  useEffect(() => {
    fetchClients();
    fetchAppointments();
  }, []);
  
  // Fetch clients from the API
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/clients');
      setClients(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to fetch clients: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };
  
  // Fetch appointments from the API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/appointments');
      setAppointments(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };
  
  // Create a new client
  const createClient = async (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      setError('Name and email are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const response = await axios.post('/api/clients/create', {
        name: clientName,
        email: clientEmail
      });
      
      setMessage(`Client created: ${response.data.data.name}`);
      setClientName('');
      setClientEmail('');
      fetchClients();
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new appointment
  const createAppointment = async (e) => {
    e.preventDefault();
    if (!appointmentClientId || !appointmentDate || !appointmentTime) {
      setError('Client, date, and time are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const response = await axios.post('/api/appointments/create', {
        clientId: appointmentClientId,
        date: appointmentDate,
        time: appointmentTime,
        duration: parseInt(appointmentDuration),
        type: appointmentType
      });
      
      setMessage(`Appointment created for ${response.data.data.client.name}`);
      setAppointmentDate('');
      setAppointmentTime('');
      fetchAppointments();
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Database Test Page</h1>
        
        {/* Status messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {/* Create Client Form */}
        <div className="mb-8 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Create Client</h2>
          <form onSubmit={createClient}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name</label>
              <input 
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Client Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="client@example.com"
              />
            </div>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </form>
        </div>
        
        {/* Create Appointment Form */}
        <div className="mb-8 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Create Appointment</h2>
          <form onSubmit={createAppointment}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Client</label>
              <select
                value={appointmentClientId}
                onChange={(e) => setAppointmentClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Date</label>
              <input 
                type="date" 
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Time</label>
              <input 
                type="time" 
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Duration (minutes)</label>
              <input 
                type="number" 
                value={appointmentDuration}
                onChange={(e) => setAppointmentDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Type</label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="Initial Consultation">Initial Consultation</option>
                <option value="Therapy Session">Therapy Session</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Group Session">Group Session</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Appointment'}
            </button>
          </form>
        </div>
        
        {/* Display Clients */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Clients</h2>
          <button 
            onClick={fetchClients}
            className="mb-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Refresh Clients
          </button>
          
          {clients.length === 0 ? (
            <p>No clients found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{client.id}</td>
                      <td className="py-2 px-4 border-b">{client.name}</td>
                      <td className="py-2 px-4 border-b">{client.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Display Appointments */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Appointments</h2>
          <button 
            onClick={fetchAppointments}
            className="mb-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Refresh Appointments
          </button>
          
          {appointments.length === 0 ? (
            <p>No appointments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Client</th>
                    <th className="py-2 px-4 border-b text-left">Date & Time</th>
                    <th className="py-2 px-4 border-b text-left">Duration</th>
                    <th className="py-2 px-4 border-b text-left">Type</th>
                    <th className="py-2 px-4 border-b text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{appointment.id}</td>
                      <td className="py-2 px-4 border-b">
                        {appointment.client?.name || 'Unknown Client'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {new Date(appointment.startTime).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {appointment.duration} min
                      </td>
                      <td className="py-2 px-4 border-b">
                        {appointment.type || 'Regular Session'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {appointment.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 