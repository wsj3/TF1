import { useState } from 'react';
import Layout from '../../components/Layout';

export default function TestSuggestions() {
  const [clientInfo, setClientInfo] = useState({
    name: 'Test Client',
    age: '35',
    gender: 'female'
  });
  
  const [presentingProblems, setPresentingProblems] = useState(['Anxiety', 'Depression']);
  const [clientGoals, setClientGoals] = useState(['Reduce anxiety symptoms', 'Improve mood']);
  
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  
  // Handle adding a new presenting problem field
  const handleAddProblem = () => {
    setPresentingProblems([...presentingProblems, '']);
  };
  
  // Handle updating a presenting problem
  const handleProblemChange = (index, value) => {
    const updatedProblems = [...presentingProblems];
    updatedProblems[index] = value;
    setPresentingProblems(updatedProblems);
  };
  
  // Handle removing a presenting problem field
  const handleRemoveProblem = (index) => {
    if (presentingProblems.length > 1) {
      const updatedProblems = [...presentingProblems];
      updatedProblems.splice(index, 1);
      setPresentingProblems(updatedProblems);
    }
  };
  
  // Handle adding a new goal field
  const handleAddGoal = () => {
    setClientGoals([...clientGoals, '']);
  };
  
  // Handle updating a goal
  const handleGoalChange = (index, value) => {
    const updatedGoals = [...clientGoals];
    updatedGoals[index] = value;
    setClientGoals(updatedGoals);
  };
  
  // Handle removing a goal field
  const handleRemoveGoal = (index) => {
    if (clientGoals.length > 1) {
      const updatedGoals = [...clientGoals];
      updatedGoals.splice(index, 1);
      setClientGoals(updatedGoals);
    }
  };
  
  // Filter out empty values
  const filterEmptyValues = (arr) => arr.filter(item => item.trim() !== '');
  
  // Generate treatment suggestions
  const handleGenerateSuggestions = async () => {
    // Validate inputs
    const filteredProblems = filterEmptyValues(presentingProblems);
    if (filteredProblems.length === 0) {
      setError('Please enter at least one presenting problem');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuggestions(null);
      
      // Call the API to generate suggestions
      const response = await fetch('/api/treatment-plans/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientInfo,
          presentingProblems: filteredProblems,
          goals: filterEmptyValues(clientGoals)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err.message || 'Failed to generate suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Test AI Treatment Suggestions</h1>
        
        {/* Client Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={clientInfo.name}
                onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                className="block w-full bg-gray-700 text-white rounded-md border-gray-600 p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Age
              </label>
              <input
                type="text"
                value={clientInfo.age}
                onChange={(e) => setClientInfo({ ...clientInfo, age: e.target.value })}
                className="block w-full bg-gray-700 text-white rounded-md border-gray-600 p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gender
              </label>
              <input
                type="text"
                value={clientInfo.gender}
                onChange={(e) => setClientInfo({ ...clientInfo, gender: e.target.value })}
                className="block w-full bg-gray-700 text-white rounded-md border-gray-600 p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Input Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Presenting Problems & Goals</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Presenting Problems
            </label>
            {presentingProblems.map((problem, index) => (
              <div key={`problem-${index}`} className="flex items-center mb-2">
                <input
                  type="text"
                  value={problem}
                  onChange={(e) => handleProblemChange(index, e.target.value)}
                  placeholder="Describe the presenting problem"
                  className="flex-grow bg-gray-700 text-white rounded-md border-gray-600 p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveProblem(index)}
                  disabled={presentingProblems.length === 1}
                  className="ml-2 p-2 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddProblem}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Problem
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client Goals
            </label>
            {clientGoals.map((goal, index) => (
              <div key={`goal-${index}`} className="flex items-center mb-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  placeholder="Enter a client goal"
                  className="flex-grow bg-gray-700 text-white rounded-md border-gray-600 p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(index)}
                  disabled={clientGoals.length === 1}
                  className="ml-2 p-2 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddGoal}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Goal
            </button>
          </div>
          
          <button
            type="button"
            onClick={handleGenerateSuggestions}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 mt-4"
          >
            {isLoading ? 'Generating...' : 'Generate Treatment Suggestions'}
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white p-4 mb-6 rounded-md">
            {error}
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center h-32 mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Suggestions Display */}
        {suggestions && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Suggestions</h2>
            
            <div className="bg-blue-900/50 p-4 rounded-md mb-6">
              <p className="text-sm text-blue-200">
                <span className="font-medium">Note:</span> These suggestions are generated by AI and should be reviewed by a qualified professional before implementation.
              </p>
            </div>
            
            <div className="space-y-6">
              {suggestions.approaches && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Recommended Approaches</h3>
                  <div className="bg-gray-700 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{suggestions.approaches}</pre>
                  </div>
                </div>
              )}
              
              {suggestions.interventions && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Potential Interventions</h3>
                  <div className="bg-gray-700 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{suggestions.interventions}</pre>
                  </div>
                </div>
              )}
              
              {suggestions.goals && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Suggested Goals & Objectives</h3>
                  <div className="bg-gray-700 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{suggestions.goals}</pre>
                  </div>
                </div>
              )}
              
              {suggestions.timeline && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Estimated Timeline</h3>
                  <div className="bg-gray-700 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{suggestions.timeline}</pre>
                  </div>
                </div>
              )}
              
              {suggestions.rawResponse && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Raw AI Response</h3>
                  <div className="bg-gray-700 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{suggestions.rawResponse}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 