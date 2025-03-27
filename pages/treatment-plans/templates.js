import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import treatmentTemplates, { getAllTemplates, getTemplateById } from '../../utils/treatmentTemplates';
import { v4 as uuidv4 } from 'uuid';

const TreatmentPlanTemplates = () => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientId, setClientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get all templates and filter by search query
  const templates = getAllTemplates().filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Load the full template details
  const handleSelectTemplate = (templateId) => {
    const template = getTemplateById(templateId);
    setSelectedTemplate(template);
  };
  
  // Use the selected template to create a new treatment plan
  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    
    if (!clientId) {
      setError('Please select a client');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare plan with new IDs for all items
      const newPlan = {
        clientId,
        title: selectedTemplate.name,
        status: 'draft',
        goals: selectedTemplate.goals.map(goal => ({
          ...goal,
          id: `goal-${uuidv4()}`,
          objectives: (goal.objectives || []).map(obj => ({
            ...obj,
            id: `obj-${uuidv4()}`
          }))
        })),
        interventions: (selectedTemplate.interventions || []).map(intervention => ({
          ...intervention,
          id: `int-${uuidv4()}`
        })),
        notes: selectedTemplate.notes
      };
      
      // Call API to create new plan
      const response = await fetch('/api/treatment-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlan),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create treatment plan');
      }
      
      const data = await response.json();
      
      // Navigate to the edit page for the new plan
      router.push(`/treatment-plans/edit/${data.id}`);
    } catch (err) {
      console.error('Error creating plan from template:', err);
      setError(err.message || 'Failed to create treatment plan. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Treatment Plan Templates</h1>
          <div>
            <button
              onClick={() => router.push('/treatment-plans')}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Plans
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-gray-700 text-white p-3 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-500 text-white p-4 mb-6 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Available Templates</h2>
              
              {templates.length === 0 ? (
                <p className="text-gray-400">No templates match your search.</p>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      className={`p-3 rounded-md cursor-pointer ${
                        selectedTemplate && selectedTemplate.id === template.id 
                          ? 'bg-blue-900 border border-blue-500' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Template Details */}
          <div className="md:col-span-2">
            {selectedTemplate ? (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-medium">{selectedTemplate.name}</h2>
                  <div className="text-xs text-gray-400">
                    {selectedTemplate.estimatedDuration}
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">{selectedTemplate.description}</p>
                
                {/* Client Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Client
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a client</option>
                    <option value="demo-1">Jane Smith (Demo)</option>
                    <option value="demo-2">Michael Johnson (Demo)</option>
                    <option value="demo-3">Sarah Williams (Demo)</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Goals</h3>
                  <div className="space-y-4">
                    {selectedTemplate.goals.map((goal, index) => (
                      <div key={goal.id} className="bg-gray-700 p-4 rounded-md">
                        <h4 className="font-medium">Goal {index + 1}: {goal.description}</h4>
                        
                        {goal.objectives && goal.objectives.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Objectives</h5>
                            <ul className="space-y-2">
                              {goal.objectives.map((objective) => (
                                <li key={objective.id} className="bg-gray-600 p-3 rounded">
                                  <p className="text-sm">{objective.description}</p>
                                  {objective.measurable && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Measure: {objective.measurable}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Interventions</h3>
                  <div className="space-y-3">
                    {selectedTemplate.interventions.map((intervention) => (
                      <div key={intervention.id} className="bg-gray-700 p-4 rounded-md">
                        <p>{intervention.description}</p>
                        
                        {intervention.evidence && (
                          <p className="text-sm text-gray-400 mt-1">
                            Evidence: {intervention.evidence}
                          </p>
                        )}
                        
                        {intervention.source && (
                          <p className="text-xs text-gray-400 mt-1">
                            Source: {intervention.source}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedTemplate.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Notes</h3>
                    <div className="bg-gray-700 p-4 rounded-md">
                      <p className="text-sm">{selectedTemplate.notes}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={handleUseTemplate}
                    disabled={isLoading || !clientId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {isLoading ? 'Creating...' : 'Use This Template'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Select a template to view details</p>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TreatmentPlanTemplates; 