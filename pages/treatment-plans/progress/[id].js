import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import ProgressChart from '../../../components/ProgressChart';
import { formatDateForDisplay } from '../../../utils/dateUtils';

export default function TreatmentPlanProgress() {
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  
  // Fetch treatment plan data when component mounts or ID changes
  useEffect(() => {
    if (!id) return;
    
    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/treatment-plans/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch treatment plan');
        }
        
        const data = await response.json();
        setPlan(data);
      } catch (err) {
        console.error('Error fetching treatment plan:', err);
        setError('Failed to load treatment plan. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlan();
  }, [id]);
  
  // Handle goal status change
  const handleGoalStatusChange = (goalIndex, newStatus) => {
    const updatedPlan = { ...plan };
    updatedPlan.goals[goalIndex].status = newStatus;
    setPlan(updatedPlan);
  };
  
  // Handle objective status change
  const handleObjectiveStatusChange = (goalIndex, objectiveIndex, newStatus) => {
    const updatedPlan = { ...plan };
    updatedPlan.goals[goalIndex].objectives[objectiveIndex].status = newStatus;
    setPlan(updatedPlan);
  };
  
  // Handle progress notes change
  const handleProgressNotesChange = (e) => {
    setProgressNotes(e.target.value);
  };
  
  // Save progress updates
  const handleSaveProgress = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API to update progress
      const response = await fetch(`/api/treatment-plans/progress/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goals: plan.goals,
          notes: progressNotes
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
      
      const data = await response.json();
      
      setSuccessMessage('Progress successfully updated!');
      setProgressNotes('');
      
      // Update the plan data with the response
      if (data.plan) {
        setPlan(data.plan);
      } else {
        // If full plan isn't returned, fetch it again
        const updatedPlanResponse = await fetch(`/api/treatment-plans/${id}`);
        if (updatedPlanResponse.ok) {
          const updatedPlanData = await updatedPlanResponse.json();
          setPlan(updatedPlanData);
        }
      }
      
    } catch (err) {
      console.error('Error updating progress:', err);
      setError(err.message || 'Failed to update progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'achieved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Treatment Plan Progress</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/treatment-plans/${id}`)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Plan
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-500 text-white p-4 mb-6 rounded-md">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-500 text-white p-4 mb-6 rounded-md">
            {successMessage}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : plan ? (
          <div className="space-y-6">
            {/* Plan Header */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-4">{plan.title}</h2>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Client:</span> {plan.clientName}
                  </p>
                </div>
                <div className="flex justify-end">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(plan.status)}`}>
                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress Visualization */}
            <ProgressChart plan={plan} showDetails={true} />
            
            {/* Progress Update Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Update Progress</h3>
              
              {/* Goals and Objectives */}
              {plan.goals && plan.goals.length > 0 ? (
                <div className="space-y-6 mb-6">
                  {plan.goals.map((goal, goalIndex) => (
                    <div key={goal.id} className="bg-gray-700 rounded-md p-4">
                      <div className="flex flex-wrap justify-between items-start mb-3">
                        <h4 className="font-medium text-sm">Goal {goalIndex + 1}: {goal.description}</h4>
                        <div className="flex items-center mt-2 sm:mt-0">
                          <span className="text-xs mr-2">Status:</span>
                          <select
                            value={goal.status}
                            onChange={(e) => handleGoalStatusChange(goalIndex, e.target.value)}
                            className="bg-gray-600 text-white text-xs rounded p-1 border border-gray-500"
                          >
                            <option value="active">In Progress</option>
                            <option value="achieved">Achieved</option>
                            <option value="discontinued">Discontinued</option>
                          </select>
                        </div>
                      </div>
                      
                      {goal.targetDate && (
                        <p className="text-xs text-gray-400 mb-3">
                          Target Date: {formatDateForDisplay(goal.targetDate)}
                        </p>
                      )}
                      
                      {/* Objectives */}
                      {goal.objectives && goal.objectives.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <h5 className="text-xs font-medium text-gray-300">Objectives</h5>
                          {goal.objectives.map((objective, objectiveIndex) => (
                            <div key={objective.id} className="bg-gray-600 rounded p-3">
                              <div className="flex flex-wrap justify-between items-start">
                                <p className="text-xs mb-2 flex-grow">{objective.description}</p>
                                <div className="flex items-center mt-1 sm:mt-0">
                                  <span className="text-xs mr-2">Status:</span>
                                  <select
                                    value={objective.status}
                                    onChange={(e) => handleObjectiveStatusChange(goalIndex, objectiveIndex, e.target.value)}
                                    className="bg-gray-500 text-white text-xs rounded p-1 border border-gray-400"
                                  >
                                    <option value="pending">Not Started</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                              {objective.measurable && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Measurable: {objective.measurable}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mb-4">No goals defined for this treatment plan.</p>
              )}
              
              {/* Progress Notes */}
              <div className="mt-6">
                <label htmlFor="progressNotes" className="block text-sm font-medium text-gray-300 mb-2">
                  Progress Notes
                </label>
                <textarea
                  id="progressNotes"
                  rows={6}
                  value={progressNotes}
                  onChange={handleProgressNotesChange}
                  placeholder="Enter notes about client's progress, observations, or next steps..."
                  className="block w-full bg-gray-700 text-white rounded-md border-gray-600 p-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              {/* Save Button */}
              <div className="mt-6">
                <button
                  onClick={handleSaveProgress}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {isLoading ? 'Saving...' : 'Save Progress Update'}
                </button>
              </div>
            </div>
            
            {/* Progress History */}
            {plan.progressHistory && plan.progressHistory.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Progress History</h3>
                <div className="space-y-4">
                  {plan.progressHistory.map((entry, index) => (
                    <div key={index} className="bg-gray-700 rounded-md p-4">
                      <p className="text-xs text-gray-400 mb-2">
                        {formatDateForDisplay(entry.date)}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                  )).reverse()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-500 text-white p-4 rounded-md">
            Treatment plan not found. It may have been deleted or the ID is invalid.
          </div>
        )}
      </div>
    </Layout>
  );
} 