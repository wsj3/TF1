import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TreatmentPlanForm from '../../components/TreatmentPlanForm';

export default function NewTreatmentPlan() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
  const handleSubmit = async (planData) => {
    try {
      setIsLoading(true);
      
      console.log('Creating treatment plan with data:', planData);
      
      // Call the API to create the treatment plan
      const response = await fetch('/api/treatment-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create treatment plan');
      }
      
      // Redirect to treatment plans page on success
      router.push('/treatment-plans?created=true');
    } catch (err) {
      console.error('Error creating treatment plan:', err);
      setError(err.message || 'Failed to create treatment plan. Please try again.');
      throw err; // Re-throw to be handled by the form
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    router.push('/treatment-plans');
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Treatment Plan</h1>
          <button
            onClick={() => router.push('/treatment-plans')}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Plans
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
          <TreatmentPlanForm
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </Layout>
  );
} 