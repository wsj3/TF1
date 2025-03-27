import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProgressChart from '../../components/ProgressChart';
import { formatDateForDisplay } from '../../utils/dateUtils';

export default function TreatmentPlanDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState(null);
  const [progressNotes, setProgressNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch treatment plan data and linked progress notes
  useEffect(() => {
    if (!id) return;
    
    const fetchTreatmentPlan = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch treatment plan
        const planResponse = await fetch(`/api/treatment-plans/${id}`);
        if (!planResponse.ok) {
          throw new Error('Failed to fetch treatment plan');
        }
        
        const planData = await planResponse.json();
        setPlan(planData);
        
        // Fetch linked progress notes
        try {
          const notesResponse = await fetch(`/api/progress-notes/by-plan/${id}`);
          if (notesResponse.ok) {
            const notesData = await notesResponse.json();
            setProgressNotes(notesData);
          }
        } catch (notesError) {
          console.error('Error fetching progress notes:', notesError);
          // Don't fail if notes fetch fails
        }
        
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTreatmentPlan();
  }, [id]);
  
  // Handle plan deletion
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this treatment plan? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/treatment-plans/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete treatment plan');
      }
      
      router.push('/treatment-plans?deleted=true');
    } catch (err) {
      console.error('Error deleting treatment plan:', err);
      setError('Failed to delete treatment plan. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Determine status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Determine goal status badge class
  const getGoalStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Determine objective status badge class
  const getObjectiveStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format goal target date
  const formatTargetDate = (dateString) => {
    if (!dateString) return 'No target date';
    return formatDateForDisplay(dateString);
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Loading Treatment Plan...' : 
             plan ? plan.title : 'Treatment Plan Not Found'}
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/treatment-plans')}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Plans
            </button>
            {plan && (
              <>
                <button
                  onClick={() => router.push(`/treatment-plans/progress/${id}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Update Progress
                </button>
                <button
                  onClick={() => router.push(`/treatment-plans/edit/${id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Plan
                </button>
              </>
            )}
          </div>
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
          <div className="space-y-6">
            {/* Plan Header */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-4">{plan.title}</h2>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Client:</span> {plan.clientName}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Created:</span> {formatDateForDisplay(plan.createdAt)}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Last Updated:</span> {formatDateForDisplay(plan.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div className="text-right">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(plan.status)}`}>
                      {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                    </span>
                  </div>
                  {plan.status === 'draft' && (
                    <div className="mt-4 text-right">
                      <button
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete Plan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Progress Overview (only for active plans) */}
            {plan.status === 'active' && (
              <ProgressChart plan={plan} showDetails={false} />
            )}
            
            {/* Goals Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Treatment Goals</h3>
              
              {plan.goals && plan.goals.length > 0 ? (
                <div className="space-y-6">
                  {plan.goals.map((goal, index) => (
                    <div key={goal.id} className="bg-gray-700 rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Goal {index + 1}</h4>
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getGoalStatusBadgeClass(goal.status)}`}>
                          {goal.status === 'active' ? 'In Progress' : 
                           goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-3">{goal.description}</p>
                      
                      {goal.targetDate && (
                        <p className="text-xs text-gray-400 mb-3">
                          Target Date: {formatTargetDate(goal.targetDate)}
                        </p>
                      )}
                      
                      {/* Objectives */}
                      {goal.objectives && goal.objectives.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Objectives</h5>
                          <div className="space-y-2">
                            {goal.objectives.map((objective) => (
                              <div key={objective.id} className="bg-gray-600 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm">{objective.description}</p>
                                  <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getObjectiveStatusBadgeClass(objective.status)}`}>
                                    {objective.status === 'pending' ? 'Not Started' :
                                     objective.status === 'in-progress' ? 'In Progress' :
                                     objective.status.charAt(0).toUpperCase() + objective.status.slice(1)}
                                  </span>
                                </div>
                                {objective.measurable && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Measurable Outcome: {objective.measurable}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No goals have been defined for this treatment plan.</p>
              )}
            </div>
            
            {/* Interventions Section */}
            {plan.interventions && plan.interventions.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Interventions</h3>
                <div className="space-y-4">
                  {plan.interventions.map((intervention) => (
                    <div key={intervention.id} className="bg-gray-700 rounded-md p-4">
                      <p className="text-sm mb-2">{intervention.description}</p>
                      {intervention.evidence && (
                        <p className="text-xs text-gray-400">
                          <span className="font-medium">Evidence:</span> {intervention.evidence}
                        </p>
                      )}
                      {intervention.source && (
                        <p className="text-xs text-gray-400">
                          <span className="font-medium">Source:</span> {intervention.source}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Progress History Section */}
            {plan.progressHistory && plan.progressHistory.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Recent Progress Updates</h3>
                <div className="space-y-4">
                  {plan.progressHistory.slice(0, 3).map((entry, index) => (
                    <div key={index} className="bg-gray-700 rounded-md p-4">
                      <p className="text-xs text-gray-400 mb-2">
                        {formatDateForDisplay(entry.date)}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                  )).reverse()}
                  {plan.progressHistory.length > 3 && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => router.push(`/treatment-plans/progress/${id}`)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View All Progress Updates
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Notes Section */}
            {plan.notes && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">Additional Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{plan.notes}</p>
              </div>
            )}
            
            {/* Progress Notes Section */}
            {progressNotes.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Progress Notes</h3>
                <div className="space-y-4">
                  {progressNotes.slice(0, 3).map((note) => (
                    <div key={note.id} className="bg-gray-700 rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-400">
                          {formatDateForDisplay(note.date)}
                        </p>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      {note.linkedGoals && note.linkedGoals.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-400">Linked Goals:</p>
                          <ul className="mt-1 space-y-1">
                            {note.linkedGoals.map((goal) => (
                              <li key={goal.id} className="text-xs text-blue-400">
                                • {goal.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {progressNotes.length > 3 && (
                    <div className="text-center mt-2">
                      <button
                        onClick={() => router.push(`/treatment-plans/progress/${id}`)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View All Progress Notes ({progressNotes.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => window.print()}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Print Plan
                </button>
                {plan.status === 'active' && (
                  <button
                    onClick={() => router.push(`/treatment-plans/progress/${id}`)}
                    className="text-green-400 hover:text-green-300 text-sm"
                  >
                    Track Progress
                  </button>
                )}
              </div>
              <div>
                <button
                  onClick={() => router.push(`/treatment-plans/edit/${id}`)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Plan
                </button>
              </div>
            </div>
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