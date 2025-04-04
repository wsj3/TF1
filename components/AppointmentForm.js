import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/dateUtils';
import { getAppointmentTypeById } from '../utils/appointmentUtils';
import AppointmentTypeSelect from './AppointmentTypeSelect';
import AppointmentTypeBadge from './AppointmentTypeBadge';

/**
 * Form component for creating or editing appointments
 * 
 * @param {Object} props - Component props
 * @param {Object} props.appointment - Existing appointment data (for editing)
 * @param {Array} props.clients - Array of available clients
 * @param {Function} props.onSubmit - Function to call when the form is submitted
 * @param {Function} props.onCancel - Function to call when the form is cancelled
 * @returns {JSX.Element} - The rendered component
 */
const AppointmentForm = ({ 
  appointment = null, 
  clients = [], 
  onSubmit, 
  onCancel 
}) => {
  const router = useRouter();
  const isEditing = !!appointment;
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'regular',
    notes: '',
    status: 'scheduled'
  });
  
  // Get default duration based on selected type
  const getDefaultDuration = (typeId) => {
    const type = getAppointmentTypeById(typeId);
    return type ? type.defaultDuration.toString() : '60';
  };
  
  // Initialize form with existing appointment data
  useEffect(() => {
    if (appointment) {
      try {
        // Parse the date and time from startTime
        const startDate = new Date(appointment.startTime);
        const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = startDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        
        setFormData({
          clientId: appointment.clientId || '',
          date: dateStr,
          time: timeStr,
          duration: appointment.duration ? appointment.duration.toString() : '60',
          type: appointment.type || 'regular',
          notes: appointment.notes || '',
          status: appointment.status || 'scheduled'
        });
      } catch (error) {
        console.error('Error parsing appointment date:', error);
      }
    }
  }, [appointment]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle appointment type selection
  const handleTypeChange = (typeId, typeData) => {
    setFormData(prev => ({ 
      ...prev, 
      type: typeId,
      // Update duration to the default for this type (if not manually changed)
      duration: prev.duration === getDefaultDuration(prev.type) ? 
                getDefaultDuration(typeId) : 
                prev.duration
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Format the data for the API
      const appointmentData = {
        clientId: formData.clientId,
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration, 10),
        type: formData.type,
        notes: formData.notes,
        status: formData.status
      };
      
      // If editing, include the appointment ID
      if (isEditing) {
        appointmentData.id = appointment.id;
      }
      
      // Call the onSubmit handler
      if (onSubmit) {
        await onSubmit(appointmentData);
      }
      
      // Redirect to appointments page on success
      router.push('/appointments');
    } catch (error) {
      console.error('Error submitting appointment:', error);
      // Handle error (could show an error message here)
    }
  };
  
  // Selected appointment type details
  const selectedType = getAppointmentTypeById(formData.type);
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit Appointment' : 'Create New Appointment'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-300 mb-1">
            Client
          </label>
          <select
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
            {/* Demo clients for testing */}
            <option value="demo-1">Jane Smith (Demo)</option>
            <option value="demo-2">Michael Johnson (Demo)</option>
            <option value="demo-3">Sarah Williams (Demo)</option>
            <option value="demo-4">John Doe (Demo)</option>
            <option value="demo-5">Emily Davis (Demo)</option>
          </select>
        </div>
        
        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-1">
              Time
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        {/* Appointment Type and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
              Appointment Type
            </label>
            <AppointmentTypeSelect
              value={formData.type}
              onChange={handleTypeChange}
              showDescription={true}
              required={true}
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="15"
              step="5"
              className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        
        {/* Status (for editing) */}
        {isEditing && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        )}
        
        {/* Appointment Preview */}
        <div className="mt-4 p-4 border border-gray-700 rounded-md bg-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Appointment Preview</h3>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-gray-400">Type:</span>
            <AppointmentTypeBadge typeId={formData.type} showIcon={true} />
          </div>
          <div className="text-sm text-gray-300">
            <p>
              <span className="font-medium">Duration:</span> {formData.duration} minutes
            </p>
            {formData.date && formData.time && (
              <p>
                <span className="font-medium">When:</span> {formatDateForDisplay(formData.date)} at {formData.time}
              </p>
            )}
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 text-sm font-medium rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2 px-4 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEditing ? 'Update Appointment' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm; 