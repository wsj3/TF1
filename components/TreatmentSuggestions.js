import { useState, useEffect } from 'react';
import { callAssistantApi } from '../utils/apiHelpers';
import { validateHIPAACompliance } from '../utils/hipaaUtils';

const TreatmentSuggestions = ({ 
  clientInfo, 
  onAddToTreatmentPlan,
  clientHistory = null,
  evidenceBasedProtocols = null
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [presentingProblems, setPresentingProblems] = useState(['']);
  const [clientGoals, setClientGoals] = useState(['']);
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [clinicalContext, setClinicalContext] = useState({
    diagnosis: '',
    severity: 'mild',
    duration: '',
    previousTreatments: [],
    comorbidities: []
  });
  
  // Load evidence-based protocols if not provided
  useEffect(() => {
    if (!evidenceBasedProtocols) {
      loadEvidenceBasedProtocols();
    }
  }, []);

  // Load client history if available
  useEffect(() => {
    if (clientHistory) {
      setClinicalContext(prev => ({
        ...prev,
        ...clientHistory
      }));
    }
  }, [clientHistory]);

  // Load evidence-based protocols
  const loadEvidenceBasedProtocols = async () => {
    try {
      const response = await fetch('/api/treatment-plans/protocols');
      if (!response.ok) throw new Error('Failed to load protocols');
      const data = await response.json();
      setEvidenceBasedProtocols(data.protocols);
    } catch (err) {
      console.error('Error loading protocols:', err);
    }
  };

  // Handle clinical context updates
  const handleClinicalContextChange = (field, value) => {
    setClinicalContext(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate clinical context
  const validateClinicalContext = () => {
    if (!clinicalContext.diagnosis) {
      setError('Please select a diagnosis');
      return false;
    }
    if (!clinicalContext.severity) {
      setError('Please select severity level');
      return false;
    }
    return true;
  };

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
  
  // Generate treatment suggestions with enhanced context
  const handleGenerateSuggestions = async () => {
    // Validate inputs
    const filteredProblems = filterEmptyValues(presentingProblems);
    if (filteredProblems.length === 0) {
      setError('Please enter at least one presenting problem');
      return;
    }

    if (!validateClinicalContext()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuggestions(null);
      
      // Prepare context for API
      const apiContext = {
        clientInfo,
        clinicalContext,
        presentingProblems: filteredProblems,
        goals: filterEmptyValues(clientGoals),
        selectedProtocol,
        evidenceBasedProtocols
      };

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(apiContext))) {
        throw new Error('Input contains potentially sensitive information');
      }

      // Call the API to generate suggestions
      const response = await callAssistantApi('/api/treatment-plans/suggest', {
        method: 'POST',
        body: JSON.stringify(apiContext)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions);
      setExpandedSection('approaches');
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err.message || 'Failed to generate suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle protocol selection
  const handleProtocolSelect = (protocol) => {
    setSelectedProtocol(protocol);
    // Update clinical context based on protocol
    if (protocol.defaultContext) {
      setClinicalContext(prev => ({
        ...prev,
        ...protocol.defaultContext
      }));
    }
  };
  
  // Toggle expanded section
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">AI Treatment Suggestions</h3>
      
      <div className="clinical-context-section">
        <h3>Clinical Context</h3>
        <div className="form-group">
          <label>Diagnosis</label>
          <select 
            value={clinicalContext.diagnosis}
            onChange={(e) => handleClinicalContextChange('diagnosis', e.target.value)}
          >
            <option value="">Select Diagnosis</option>
            <option value="depression">Depression</option>
            <option value="anxiety">Anxiety</option>
            <option value="ptsd">PTSD</option>
            <option value="bipolar">Bipolar Disorder</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Severity</label>
          <select 
            value={clinicalContext.severity}
            onChange={(e) => handleClinicalContextChange('severity', e.target.value)}
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>

        {evidenceBasedProtocols && (
          <div className="form-group">
            <label>Evidence-Based Protocol</label>
            <select 
              value={selectedProtocol?.id || ''}
              onChange={(e) => handleProtocolSelect(
                evidenceBasedProtocols.find(p => p.id === e.target.value)
              )}
            >
              <option value="">Select Protocol</option>
              {evidenceBasedProtocols.map(protocol => (
                <option key={protocol.id} value={protocol.id}>
                  {protocol.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Input Form */}
      <div className="mb-6">
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
            Client Goals (Optional)
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
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
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Suggestions Display */}
      {suggestions && (
        <div className="space-y-4">
          <div className="bg-blue-900/50 p-4 rounded-md">
            <p className="text-sm text-blue-200">
              <span className="font-medium">Note:</span> These suggestions are generated by AI and should be reviewed by a qualified professional before implementation. The suggestions are based on general evidence-based practices and may need to be adapted to the specific needs of your client.
            </p>
          </div>
          
          {/* Approaches Section */}
          <div className="border border-gray-700 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('approaches')}
              className="w-full flex justify-between items-center p-4 text-left bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium">Recommended Approaches</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${expandedSection === 'approaches' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {expandedSection === 'approaches' && (
              <div className="p-4">
                <div className="whitespace-pre-wrap text-sm text-gray-300">
                  {suggestions.approaches}
                </div>
              </div>
            )}
          </div>
          
          {/* Interventions Section */}
          <div className="border border-gray-700 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('interventions')}
              className="w-full flex justify-between items-center p-4 text-left bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium">Potential Interventions</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${expandedSection === 'interventions' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {expandedSection === 'interventions' && (
              <div className="p-4">
                <div className="whitespace-pre-wrap text-sm text-gray-300 mb-4">
                  {suggestions.interventions}
                </div>
                <button
                  onClick={() => onAddToTreatmentPlan({
                    type: 'interventions',
                    content: suggestions.interventions
                  })}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add to Treatment Plan
                </button>
              </div>
            )}
          </div>
          
          {/* Goals & Objectives Section */}
          <div className="border border-gray-700 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('goals')}
              className="w-full flex justify-between items-center p-4 text-left bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium">Suggested Goals & Objectives</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${expandedSection === 'goals' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {expandedSection === 'goals' && (
              <div className="p-4">
                <div className="whitespace-pre-wrap text-sm text-gray-300 mb-4">
                  {suggestions.goals}
                </div>
                <button
                  onClick={() => onAddToTreatmentPlan({
                    type: 'goals',
                    content: suggestions.goals
                  })}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add to Treatment Plan
                </button>
              </div>
            )}
          </div>
          
          {/* Timeline Section */}
          <div className="border border-gray-700 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('timeline')}
              className="w-full flex justify-between items-center p-4 text-left bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium">Estimated Timeline</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${expandedSection === 'timeline' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {expandedSection === 'timeline' && (
              <div className="p-4">
                <div className="whitespace-pre-wrap text-sm text-gray-300">
                  {suggestions.timeline}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentSuggestions; 