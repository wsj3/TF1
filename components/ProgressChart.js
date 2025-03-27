import { useState, useEffect } from 'react';
import { formatDateForDisplay } from '../utils/dateUtils';

const ProgressChart = ({ plan, showDetails = false }) => {
  const [progressData, setProgressData] = useState(null);
  
  // Process plan data to generate progress metrics
  useEffect(() => {
    if (!plan || !plan.goals) return;
    
    // Initialize progress history
    const progressHistory = plan.progressHistory || [];
    
    // Calculate current progress
    let completedObjectives = 0;
    let totalObjectives = 0;
    const goalProgress = [];
    
    plan.goals.forEach(goal => {
      let goalCompletedObjectives = 0;
      let goalTotalObjectives = 0;
      
      if (goal.objectives && goal.objectives.length > 0) {
        goalTotalObjectives = goal.objectives.length;
        
        goal.objectives.forEach(obj => {
          if (obj.status === 'completed') {
            goalCompletedObjectives++;
            completedObjectives++;
          }
        });
        
        totalObjectives += goalTotalObjectives;
      }
      
      const goalPercentage = goalTotalObjectives > 0 
        ? Math.round((goalCompletedObjectives / goalTotalObjectives) * 100) 
        : 0;
      
      goalProgress.push({
        id: goal.id,
        description: goal.description,
        status: goal.status,
        completedObjectives: goalCompletedObjectives,
        totalObjectives: goalTotalObjectives,
        percentage: goalPercentage
      });
    });
    
    const overallPercentage = totalObjectives > 0 
      ? Math.round((completedObjectives / totalObjectives) * 100) 
      : 0;
    
    setProgressData({
      goals: goalProgress,
      totalObjectives,
      completedObjectives,
      overallPercentage,
      progressHistory
    });
  }, [plan]);
  
  // No data to display
  if (!progressData) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400">No progress data available.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Treatment Progress</h3>
      
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-gray-400">
            {progressData.completedObjectives} of {progressData.totalObjectives} objectives completed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div 
            className={`h-4 rounded-full ${
              progressData.overallPercentage >= 75 ? 'bg-green-500' : 
              progressData.overallPercentage >= 25 ? 'bg-yellow-500' : 
              'bg-blue-500'
            }`}
            style={{ width: `${progressData.overallPercentage}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-gray-400 mt-1">
          {progressData.overallPercentage}% Complete
        </div>
      </div>
      
      {/* Goal-by-Goal Progress */}
      {showDetails && progressData.goals.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Goals Progress</h4>
          <div className="space-y-4">
            {progressData.goals.map((goal) => (
              <div key={goal.id} className="bg-gray-700 p-3 rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs">{goal.description}</p>
                  <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full 
                    ${goal.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                      goal.status === 'achieved' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {goal.status === 'active' ? 'In Progress' : 
                     goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      goal.percentage >= 75 ? 'bg-green-500' : 
                      goal.percentage >= 25 ? 'bg-yellow-500' : 
                      'bg-blue-500'
                    }`}
                    style={{ width: `${goal.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{goal.completedObjectives} of {goal.totalObjectives} objectives</span>
                  <span>{goal.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Progress Over Time (if history available) */}
      {showDetails && progressData.progressHistory && progressData.progressHistory.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-medium mb-3">Progress Timeline</h4>
          <div className="flex items-end h-32 space-x-1 mt-4">
            {progressData.progressHistory.slice(-7).map((entry, index) => {
              // This is a simplistic visualization - in a real app, you'd calculate
              // the actual progress at each point in time
              const height = 20 + (index * 10);
              const percentage = Math.min(100, Math.round((height / 32) * 100));
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}px` }}
                  ></div>
                  <div className="text-xs text-gray-400 mt-1 transform -rotate-45 origin-top-left">
                    {formatDateForDisplay(entry.date).split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressChart; 