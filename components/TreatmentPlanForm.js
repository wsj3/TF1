import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { formatDateForDisplay } from '../utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import TreatmentSuggestions from './TreatmentSuggestions';

/**
 * Form component for creating or editing treatment plans
 */
export default function TreatmentPlanForm({ 
  plan = null, 
  clients = [], 
  onSubmit, 
  onCancel 
}) {
  const router = useRouter();
  const isEditing = !!plan;
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    status: 'draft',
    goals: [{ 
      id: 'goal-1', 
      description: '', 
      targetDate: '', 
      status: 'active', 
      objectives: [{
        id: 'obj-1-1',
        description: '',
        measurable: '',
        status: 'pending'
      }]
    }],
    interventions: [],
    notes: ''
  });

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState({
    goals: [],
    interventions: [],
    isLoading: false,
    error: null
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  // Initialize form with existing plan data if editing
  useEffect(() => {
    if (plan) {
      setFormData({
        clientId: plan.clientId || '',
        title: plan.title || '',
        status: plan.status || 'draft',
        goals: plan.goals?.length ? plan.goals.map(goal => ({
          ...goal,
          objectives: goal.objectives?.length ? goal.objectives : [{
            id: `obj-${goal.id}-1`,
            description: '',
            measurable: '',
            status: 'pending'
          }]
        })) : [{ 
          id: 'goal-1', 
          description: '', 
          targetDate: '', 
          status: 'active', 
          objectives: [{
            id: 'obj-1-1',
            description: '',
            measurable: '',
            status: 'pending'
          }]
        }],
        interventions: plan.interventions || [],
        notes: plan.notes || ''
      });
    }
  }, [plan]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle goal changes
  const handleGoalChange = (goalIndex, field, value) => {
    setFormData(prev => {
      const newGoals = [...prev.goals];
      newGoals[goalIndex] = { ...newGoals[goalIndex], [field]: value };
      return { ...prev, goals: newGoals };
    });
  };
  
  // Handle objective changes
  const handleObjectiveChange = (goalIndex, objectiveIndex, field, value) => {
    setFormData(prev => {
      const newGoals = [...prev.goals];
      const objectives = [...newGoals[goalIndex].objectives];
      objectives[objectiveIndex] = { ...objectives[objectiveIndex], [field]: value };
      newGoals[goalIndex] = { ...newGoals[goalIndex], objectives };
      return { ...prev, goals: newGoals };
    });
  };
  
  // Add a new goal
  const addGoal = () => {
    const newGoalId = `goal-${formData.goals.length + 1}`;
    setFormData(prev => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          id: newGoalId,
          description: '',
          targetDate: '',
          status: 'active',
          objectives: [{
            id: `obj-${newGoalId}-1`,
            description: '',
            measurable: '',
            status: 'pending'
          }]
        }
      ]
    }));
  };
  
  // Remove a goal
  const removeGoal = (goalIndex) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, index) => index !== goalIndex)
    }));
  };
  
  // Add a new objective to a goal
  const addObjective = (goalIndex) => {
    setFormData(prev => {
      const newGoals = [...prev.goals];
      const objectives = [...newGoals[goalIndex].objectives];
      const goalId = newGoals[goalIndex].id;
      objectives.push({
        id: `obj-${goalId}-${objectives.length + 1}`,
        description: '',
        measurable: '',
        status: 'pending'
      });
      newGoals[goalIndex] = { ...newGoals[goalIndex], objectives };
      return { ...prev, goals: newGoals };
    });
  };
  
  // Remove an objective
  const removeObjective = (goalIndex, objectiveIndex) => {
    setFormData(prev => {
      const newGoals = [...prev.goals];
      const objectives = newGoals[goalIndex].objectives.filter((_, index) => index !== objectiveIndex);
      newGoals[goalIndex] = { ...newGoals[goalIndex], objectives };
      return { ...prev, goals: newGoals };
    });
  };
  
  // Get AI suggestions for goals based on client information
  const getAiSuggestions = async () => {
    if (!formData.clientId) {
      setErrors(prev => ({ ...prev, clientId: 'Please select a client first' }));
      return;
    }
    
    setAiSuggestions(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/ai/treatment-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: formData.clientId,
          planTitle: formData.title,
          existingGoals: formData.goals.map(g => g.description).filter(Boolean)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI suggestions');
      }
      
      const data = await response.json();
      setAiSuggestions(prev => ({ 
        ...prev, 
        goals: data.goals || [], 
        interventions: data.interventions || [],
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setAiSuggestions(prev => ({ 
        ...prev, 
        error: 'Failed to load AI suggestions. Please try again.', 
        isLoading: false 
      }));
    }
  };
  
  // Apply an AI suggestion to a goal
  const applyGoalSuggestion = (suggestion, goalIndex) => {
    setFormData(prev => {
      const newGoals = [...prev.goals];
      newGoals[goalIndex] = { 
        ...newGoals[goalIndex], 
        description: suggestion.description,
        // If objectives are included in the suggestion, use them
        objectives: suggestion.objectives ? suggestion.objectives.map((obj, i) => ({
          id: `obj-${newGoals[goalIndex].id}-${i+1}`,
          description: obj.description,
          measurable: obj.measurable || '',
          status: 'pending'
        })) : newGoals[goalIndex].objectives
      };
      return { ...prev, goals: newGoals };
    });
    
    // Remove this suggestion from the list
    setAiSuggestions(prev => ({
      ...prev,
      goals: prev.goals.filter(s => s.description !== suggestion.description)
    }));
  };
  
  // Add an intervention from AI suggestions
  const addIntervention = (intervention) => {
    setFormData(prev => ({
      ...prev,
      interventions: [...prev.interventions, {
        id: `int-${prev.interventions.length + 1}`,
        description: intervention.description,
        source: intervention.source || 'AI Suggestion',
        evidence: intervention.evidence || ''
      }]
    }));
    
    // Remove this intervention from suggestions
    setAiSuggestions(prev => ({
      ...prev,
      interventions: prev.interventions.filter(i => i.description !== intervention.description)
    }));
  };
  
  // Remove an intervention
  const removeIntervention = (index) => {
    setFormData(prev => ({
      ...prev,
      interventions: prev.interventions.filter((_, i) => i !== index)
    }));
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a title for the treatment plan';
    }
    
    // Check that at least one goal has a description
    const hasValidGoal = formData.goals.some(goal => goal.description.trim());
    if (!hasValidGoal) {
      newErrors.goals = 'Please add at least one goal to the treatment plan';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Clean up data before submission (remove empty goals/objectives)
    const cleanedData = {
      ...formData,
      goals: formData.goals
        .filter(goal => goal.description.trim()) // Keep only goals with descriptions
        .map(goal => ({
          ...goal,
          objectives: goal.objectives.filter(obj => obj.description.trim()) // Keep only objectives with descriptions
        }))
    };
    
    try {
      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Error submitting treatment plan:', error);
      setErrors(prev => ({ ...prev, submit: error.message || 'Failed to save treatment plan' }));
    }
  };
  
  // Get client name by ID
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  // Get selected client info for AI suggestions
  const getSelectedClientInfo = () => {
    // If no client is selected, return empty object
    if (!formData.clientId) {
      return { name: 'Client' };
    }
    
    // Find client in the list
    const selectedClient = clients.find(client => client.id === formData.clientId);
    
    if (!selectedClient) {
      // If client ID is provided but not found (e.g., for demo clients)
      return { 
        name: getClientName(formData.clientId),
        age: '30-40',
        gender: 'adult'
      };
    }
    
    return {
      name: `${selectedClient.firstName} ${selectedClient.lastName}`,
      age: selectedClient.age || 'adult',
      gender: selectedClient.gender || 'person'
    };
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? 'Edit Treatment Plan' : 'Create New Treatment Plan'}
      </h2>
      
      {errors.submit && (
        <div className="mb-6 bg-red-500 text-white p-4 rounded-md">
          {errors.submit}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-300 mb-1">
              Client
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              disabled={isEditing}
              className={`block w-full bg-gray-700 text-white rounded-md border ${
                errors.clientId ? 'border-red-500' : 'border-gray-600'
              } py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                isEditing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
              {/* Demo clients */}
              <option value="demo-1">Jane Smith (Demo)</option>
              <option value="demo-2">Michael Johnson (Demo)</option>
              <option value="demo-3">Sarah Williams (Demo)</option>
              <option value="demo-4">John Doe (Demo)</option>
              <option value="demo-5">Emily Davis (Demo)</option>
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-500">{errors.clientId}</p>
            )}
            {isEditing && formData.clientId && (
              <p className="mt-1 text-sm text-gray-400">
                Client cannot be changed on an existing treatment plan.
              </p>
            )}
          </div>
          
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
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Treatment Plan Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Anxiety Management Plan"
            className={`block w-full bg-gray-700 text-white rounded-md border ${
              errors.title ? 'border-red-500' : 'border-gray-600'
            } py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        
        {/* Goals Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Treatment Goals</h3>
            <button
              type="button"
              onClick={addGoal}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Goal
            </button>
          </div>
          
          {errors.goals && (
            <p className="text-sm text-red-500">{errors.goals}</p>
          )}
          
          {formData.goals.map((goal, goalIndex) => (
            <div key={goal.id} className="bg-gray-700 rounded-md p-4 space-y-4">
              <div className="flex justify-between">
                <h4 className="font-medium">Goal {goalIndex + 1}</h4>
                {formData.goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGoal(goalIndex)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div>
                <label htmlFor={`goal-${goalIndex}-description`} className="block text-sm font-medium text-gray-300 mb-1">
                  Goal Description
                </label>
                <textarea
                  id={`goal-${goalIndex}-description`}
                  value={goal.description}
                  onChange={(e) => handleGoalChange(goalIndex, 'description', e.target.value)}
                  rows="2"
                  placeholder="Describe the goal in specific, measurable terms"
                  className="block w-full bg-gray-600 text-white rounded-md border-gray-500 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`goal-${goalIndex}-target-date`} className="block text-sm font-medium text-gray-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    id={`goal-${goalIndex}-target-date`}
                    value={goal.targetDate}
                    onChange={(e) => handleGoalChange(goalIndex, 'targetDate', e.target.value)}
                    className="block w-full bg-gray-600 text-white rounded-md border-gray-500 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor={`goal-${goalIndex}-status`} className="block text-sm font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    id={`goal-${goalIndex}-status`}
                    value={goal.status}
                    onChange={(e) => handleGoalChange(goalIndex, 'status', e.target.value)}
                    className="block w-full bg-gray-600 text-white rounded-md border-gray-500 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">In Progress</option>
                    <option value="achieved">Achieved</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              
              {/* Objectives */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-sm font-medium text-gray-300">Objectives</h5>
                  <button
                    type="button"
                    onClick={() => addObjective(goalIndex)}
                    className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-500 transition-colors"
                  >
                    Add Objective
                  </button>
                </div>
                
                {goal.objectives.map((objective, objectiveIndex) => (
                  <div key={objective.id} className="bg-gray-600 rounded p-3 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-300">Objective {objectiveIndex + 1}</span>
                      {goal.objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjective(goalIndex, objectiveIndex)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor={`obj-${goalIndex}-${objectiveIndex}-desc`} className="block text-xs font-medium text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        id={`obj-${goalIndex}-${objectiveIndex}-desc`}
                        value={objective.description}
                        onChange={(e) => handleObjectiveChange(goalIndex, objectiveIndex, 'description', e.target.value)}
                        placeholder="Specific step towards achieving the goal"
                        className="block w-full bg-gray-700 text-white rounded border-gray-600 py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`obj-${goalIndex}-${objectiveIndex}-measurable`} className="block text-xs font-medium text-gray-300 mb-1">
                        Measurable Outcome
                      </label>
                      <input
                        type="text"
                        id={`obj-${goalIndex}-${objectiveIndex}-measurable`}
                        value={objective.measurable}
                        onChange={(e) => handleObjectiveChange(goalIndex, objectiveIndex, 'measurable', e.target.value)}
                        placeholder="How will progress be measured?"
                        className="block w-full bg-gray-700 text-white rounded border-gray-600 py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`obj-${goalIndex}-${objectiveIndex}-status`} className="block text-xs font-medium text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        id={`obj-${goalIndex}-${objectiveIndex}-status`}
                        value={objective.status}
                        onChange={(e) => handleObjectiveChange(goalIndex, objectiveIndex, 'status', e.target.value)}
                        className="block w-full bg-gray-700 text-white rounded border-gray-600 py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* AI Suggestions */}
        <div className="bg-gray-700 rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">AI Suggestions</h3>
            <button
              type="button"
              onClick={getAiSuggestions}
              disabled={aiSuggestions.isLoading}
              className={`text-sm px-3 py-1 rounded-md ${
                aiSuggestions.isLoading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {aiSuggestions.isLoading ? 'Loading...' : 'Get Suggestions'}
            </button>
          </div>
          
          {aiSuggestions.error && (
            <p className="text-sm text-red-400">{aiSuggestions.error}</p>
          )}
          
          {aiSuggestions.goals.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Suggested Goals</h4>
              <div className="space-y-2">
                {aiSuggestions.goals.map((suggestion, index) => (
                  <div key={index} className="bg-blue-900 bg-opacity-30 rounded-md p-3">
                    <p className="text-sm mb-2">{suggestion.description}</p>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => applyGoalSuggestion(suggestion, formData.goals.findIndex(g => !g.description.trim()) || 0)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Apply to Goal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {aiSuggestions.interventions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Suggested Interventions</h4>
              <div className="space-y-2">
                {aiSuggestions.interventions.map((intervention, index) => (
                  <div key={index} className="bg-green-900 bg-opacity-30 rounded-md p-3">
                    <p className="text-sm mb-1">{intervention.description}</p>
                    {intervention.evidence && (
                      <p className="text-xs text-gray-400 mb-2">Evidence: {intervention.evidence}</p>
                    )}
                    {intervention.source && (
                      <p className="text-xs text-gray-400 mb-2">Source: {intervention.source}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => addIntervention(intervention)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        Add Intervention
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!aiSuggestions.isLoading && 
           aiSuggestions.goals.length === 0 && 
           aiSuggestions.interventions.length === 0 && (
            <p className="text-sm text-gray-400">
              Click "Get Suggestions" to receive AI-generated goals and interventions based on the client and plan information.
            </p>
          )}
        </div>
        
        {/* Interventions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Interventions</h3>
          
          {formData.interventions.length > 0 ? (
            <div className="space-y-3">
              {formData.interventions.map((intervention, index) => (
                <div key={intervention.id} className="bg-gray-700 rounded-md p-3 flex justify-between items-start">
                  <div>
                    <p className="text-sm">{intervention.description}</p>
                    {intervention.evidence && (
                      <p className="text-xs text-gray-400 mt-1">Evidence: {intervention.evidence}</p>
                    )}
                    {intervention.source && (
                      <p className="text-xs text-gray-400">Source: {intervention.source}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIntervention(index)}
                    className="text-sm text-red-400 hover:text-red-300 ml-4"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No interventions added yet. Use AI suggestions to add evidence-based interventions.
            </p>
          )}
        </div>
        
        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional information about this treatment plan"
            className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        
        {/* AI Treatment Suggestions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">AI Treatment Suggestions</h3>
            <button
              type="button"
              onClick={() => setAiSuggestions({ ...aiSuggestions, isLoading: true, error: null })}
              className="text-blue-400 hover:text-blue-300"
            >
              Get AI Suggestions
            </button>
          </div>
          
          {aiSuggestions.isLoading && (
            <p className="text-sm text-gray-400">Loading...</p>
          )}
          
          {!aiSuggestions.isLoading && aiSuggestions.error && (
            <p className="text-sm text-red-400">{aiSuggestions.error}</p>
          )}
          
          {!aiSuggestions.isLoading && aiSuggestions.goals.length === 0 && aiSuggestions.interventions.length === 0 && (
            <TreatmentSuggestions 
              clientInfo={getSelectedClientInfo()}
              onAddToTreatmentPlan={addIntervention}
            />
          )}
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
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
            {isEditing ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
} 