import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../utils/auth';

export default function AppointmentForm({ 
  initialData = null, 
  onSubmit, 
  onCancel,
  startDate = null,
  endDate = null
}) {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || '',
    startTime: initialData?.startTime 
      ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm")
      : startDate 
        ? format(new Date(startDate), "yyyy-MM-dd'T'HH:mm")
        : '',
    endTime: initialData?.endTime 
      ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm")
      : endDate 
        ? format(new Date(endDate), "yyyy-MM-dd'T'HH:mm") 
        : '',
    status: initialData?.status || 'SCHEDULED',
  });

  // Fetch available clients for selection
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        
        const data = await response.json();
        setClients(data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load client list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.clientId) {
      errors.clientId = 'Please select a client';
    }
    
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }
    
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      if (start >= end) {
        errors.endTime = 'End time must be after start time';
      }
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length === 0) {
      onSubmit(formData);
    } else {
      // Display first error
      const firstError = Object.values(errors)[0];
      setError(firstError);
    }
  };

  // Get client display name
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        {initialData ? 'Edit Appointment' : 'New Appointment'}
      </h2>
      
      {error && (
        <div className="bg-red-500 text-white p-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Client
          </label>
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            required
          >
            <option value="">-- Select Client --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
            />
          </div>
        </div>
        
        {initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
          >
            {initialData ? 'Update' : 'Create'} Appointment
          </button>
        </div>
      </form>
    </div>
  );
} 