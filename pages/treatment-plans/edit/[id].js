import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import TreatmentPlanForm from '../../../components/TreatmentPlanForm';

export default function EditTreatmentPlan() {
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch plan and clients when component mounts or ID changes
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch plan data
        const planResponse = await fetch(`/api/treatment-plans/${id}`);
        if (!planResponse.ok) {
          throw new Error(`Failed to fetch treatment plan: ${planResponse.statusText}`);
        }
        const planData = await planResponse.json();
        setPlan(planData);
        
        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) {
          throw new Error(`Failed to fetch clients: ${clientsResponse.statusText}`);
        }
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle form submission
  const handleSubmit = async (planData) => {
    try {
      setIsLoading(true);
      
      console.log('Updating treatment plan with data:', planData);
      
      // Call the API to update the treatment plan
      const response = await fetch(`/api/treatment-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update treatment plan');
      }
      
      // Redirect to treatment plan details page on success
      router.push(`/treatment-plans/${id}?updated=true`);
    } catch (err) {
      console.error('Error updating treatment plan:', err);
      setError(err.message || 'Failed to update treatment plan. Please try again.');
      throw err; // Re-throw to be handled by the form
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    router.push(`/treatment-plans/${id}`);
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Loading...' : 
             plan ? `Edit Treatment Plan: ${plan.title}` : 
             'Treatment Plan Not Found'}
          </h1>
          <button
            onClick={() => router.push(`/treatment-plans/${id}`)}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Plan
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
        ) : plan ? (
          <TreatmentPlanForm
            plan={plan}
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : (
          <div className="bg-yellow-500 text-white p-4 rounded-md">
            Treatment plan not found. It may have been deleted or the ID is invalid.
          </div>
        )}
      </div>
    </Layout>
  );
} 