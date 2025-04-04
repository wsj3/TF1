import { useState, useEffect } from 'react';
import CustomLayout from '../components/CustomLayout';
import { useAuth } from '../utils/auth';
import { withPageAuth } from '../utils/auth';
import Head from 'next/head';

// The main dashboard component
function Dashboard() {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);

  // Safely set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
    
    // Mark dashboard as loaded after a delay to ensure all components are mounted
    const timer = setTimeout(() => {
      setDashboardLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Sample AI discoveries data - in a real application, this would come from an API
  const aiDiscoveries = [
    {
      id: 1,
      title: "New Research on CBT Effectiveness for Anxiety Disorders",
      description: "Recent meta-analysis shows 15% improvement in recovery rates with modified CBT approach",
      date: "2025-03-04",
      type: "research",
      url: "/insights/cbt-effectiveness"
    },
    {
      id: 2,
      title: "Therapy Session Scheduling Optimization",
      description: "Analysis of your scheduling patterns suggests Tuesday mornings have 30% higher client engagement",
      date: "2025-03-02",
      type: "insight",
      url: "/insights/scheduling-optimization"
    },
    {
      id: 3,
      title: "Emerging Treatment for PTSD Shows Promise",
      description: "Journal of Psychiatric Research publishes breakthrough study on EMDR combined with virtual reality",
      date: "2025-02-28",
      type: "news",
      url: "/insights/ptsd-treatment-advances"
    }
  ];
  
  // Simple loading state for server-side or during hydration
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Head>
          <title>Loading Dashboard | Therapist's Friend</title>
        </Head>
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }
  
  // If user isn't authenticated yet but we're client-side, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Head>
          <title>Loading Dashboard | Therapist's Friend</title>
        </Head>
        <div className="text-white">Checking authentication...</div>
      </div>
    );
  }
  
  // Main dashboard content
  return (
    <>
      <Head>
        <title>Dashboard | Therapist's Friend</title>
        <meta name="description" content="Your therapy practice dashboard" />
      </Head>
      <CustomLayout title="Dashboard | Therapist's Friend">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Welcome Card */}
            <div className="mt-6 bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-white">Welcome, {user?.name || 'User'}!</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Here's your therapy practice at a glance
                </p>
              </div>
            </div>
            
            {/* Stats Section */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Clients Card */}
              <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-400 truncate">
                          Total Clients
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-white">24</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <a href="/clients" className="font-medium text-blue-400 hover:text-blue-300">
                      View all clients
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Sessions Card */}
              <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-400 truncate">
                          Upcoming Sessions
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-white">12</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <a href="/sessions" className="font-medium text-blue-400 hover:text-blue-300">
                      View all sessions
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Tasks Card */}
              <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-400 truncate">
                          Pending Tasks
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-white">7</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <a href="/tasks" className="font-medium text-blue-400 hover:text-blue-300">
                      View all tasks
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Billing Summary Card */}
              <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-400 truncate">
                          Unbilled Sessions
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-white">5</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <a href="/billing" className="font-medium text-blue-400 hover:text-blue-300">
                      View billing info
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Discoveries and Insights Section */}
            {dashboardLoaded && (
              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Recent Discoveries and Insights</h2>
                  <a href="/insights" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                    View all insights
                  </a>
                </div>
                
                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {aiDiscoveries.map((discovery) => (
                    <div key={discovery.id} className="bg-gray-800 rounded-lg shadow overflow-hidden hover:bg-gray-750 transition-colors duration-200">
                      <div className="p-5">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {discovery.type === 'research' && (
                              <div className="bg-indigo-500 rounded-md p-2">
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                            )}
                            {discovery.type === 'news' && (
                              <div className="bg-blue-500 rounded-md p-2">
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                              </div>
                            )}
                            {discovery.type === 'insight' && (
                              <div className="bg-emerald-500 rounded-md p-2">
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-white">
                              <a href={discovery.url} className="hover:underline">
                                {discovery.title}
                              </a>
                            </h3>
                            <p className="mt-1 text-sm text-gray-400">{discovery.description}</p>
                            <p className="mt-2 text-xs text-gray-500">{discovery.date}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CustomLayout>
    </>
  );
}

// Export with auth protection
export default withPageAuth(Dashboard); 