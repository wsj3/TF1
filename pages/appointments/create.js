import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AppointmentForm from '../../components/AppointmentForm';
import { formatDateForStorage } from '../../utils/dateUtils';
import { getAppointmentTypeById } from '../../utils/appointmentUtils';

// This file is causing a duplicate page conflict with /pages/appointments.js
// Rename this file to appointments-new.js or delete it if not needed
export default function NewAppointment() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get date params from URL query if present
  const { date, time } = router.query;
  
  // Fetch clients when component mounts
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
        setError('Failed to load clients. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClients();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (appointmentData) => {
    try {
      setIsLoading(true);
      
      // Format the date for the API
      const { date, time, duration, ...rest } = appointmentData;
      
      // Get the appointment type details
      const typeDetails = getAppointmentTypeById(appointmentData.type);
      if (!typeDetails) {
        throw new Error(`Invalid appointment type: ${appointmentData.type}`);
      }
      
      // Create start time string (YYYY-MM-DDThh:mm)
      const startTime = `${date}T${time}`;
      
      // Prepare API payload
      const payload = {
        ...rest,
        startTime,
        duration: parseInt(duration, 10),
      };
      
      console.log('Creating appointment with data:', payload);
      
      // Call the API to create the appointment
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create appointment');
      }
      
      // Redirect to appointments page on success
      router.push('/appointments?created=true');
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    router.push('/appointments');
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Appointment</h1>
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
        ) : (
          <AppointmentForm
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </Layout>
  );
} 