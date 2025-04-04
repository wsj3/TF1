import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useRouter } from 'next/router';
import { withPageAuth, useAuth } from '../../utils/auth';

function TreatmentPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    clientId: '',
    status: 'all'
  });
  const router = useRouter();

  // Fetch treatment plans and clients when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch treatment plans
        const plansResponse = await fetch('/api/treatment-plans');
        if (!plansResponse.ok) {
          throw new Error('Failed to fetch treatment plans');
        }
        const plansData = await plansResponse.json();
        setPlans(plansData);

        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) {
          throw new Error('Failed to fetch clients');
        }
        const clientsData = await clientsResponse.json();
        setClients(clientsData.clients || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter plans based on current filters
  const filteredPlans = plans.filter(plan => {
    if (filters.clientId && plan.clientId !== filters.clientId) return false;
    if (filters.status !== 'all' && plan.status !== filters.status) return false;
    return true;
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Treatment Plans</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/treatment-plans/templates')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Templates
            </button>
            <button
              onClick={() => router.push('/treatment-plans/test-suggestions')}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              AI Suggestions
            </button>
            <button
              onClick={() => router.push('/treatment-plans/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              New Plan
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-3 text-white">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-300 mb-1">
                Client
              </label>
              <select
                id="clientId"
                name="clientId"
                value={filters.clientId}
                onChange={handleFilterChange}
                className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Clients</option>
                {Array.isArray(clients) && clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="block w-full bg-gray-700 text-white rounded-md border-gray-600 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="bg-gray-800 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Goals
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Progress
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredPlans.map((plan) => {
                  // Calculate progress percentage
                  let completedObjectives = 0;
                  let totalObjectives = 0;
                  
                  if (plan.goals && plan.goals.length > 0) {
                    plan.goals.forEach(goal => {
                      if (goal.objectives && goal.objectives.length > 0) {
                        totalObjectives += goal.objectives.length;
                        goal.objectives.forEach(obj => {
                          if (obj.status === 'completed') {
                            completedObjectives += 1;
                          }
                        });
                      }
                    });
                  }
                  
                  const progressPercentage = totalObjectives > 0 
                    ? Math.round((completedObjectives / totalObjectives) * 100) 
                    : 0;
                  
                  return (
                    <tr key={plan.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{plan.clientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{formatDateForDisplay(plan.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{formatDateForDisplay(plan.updatedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${plan.status === 'active' ? 'bg-green-100 text-green-800' : 
                            plan.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{plan.goals?.length || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              progressPercentage >= 75 ? 'bg-green-500' : 
                              progressPercentage >= 25 ? 'bg-yellow-500' : 
                              'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{progressPercentage}% Complete</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={`/treatment-plans/${plan.id}`} className="text-blue-400 hover:text-blue-300 mr-3">
                          View
                        </a>
                        {plan.status === 'active' && (
                          <a href={`/treatment-plans/progress/${plan.id}`} className="text-green-400 hover:text-green-300 mr-3">
                            Track
                          </a>
                        )}
                        <a href={`/treatment-plans/edit/${plan.id}`} className="text-blue-400 hover:text-blue-300">
                          Edit
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-800 p-8 rounded-md text-center">
            <p className="text-gray-300 text-lg mb-4">No treatment plans found.</p>
            <p className="text-gray-400">
              {filters.clientId || filters.status !== 'all' 
                ? 'Try adjusting your filters to see more results.' 
                : 'Create your first treatment plan to get started.'}
            </p>
          </div>
        )}
        
        {/* If no plans exist, show demo information */}
        {!isLoading && plans.length === 0 && (
          <div className="mt-8 bg-blue-900 bg-opacity-50 p-6 rounded-md">
            <h2 className="text-xl font-semibold mb-3">Treatment Planning Features</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Create structured, customizable treatment plan templates</li>
              <li>Set SMART goals with short and long-term objectives</li>
              <li>Track progress against defined goals and objectives</li>
              <li>Integrate AI-powered suggestions based on evidence-based sources</li>
              <li>Link progress notes to specific treatment goals</li>
              <li>Access intervention recommendations with supporting evidence</li>
            </ul>
            <div className="mt-6">
              <a 
                href="/treatment-plans/new" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Treatment Plan
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withPageAuth(TreatmentPlans); 