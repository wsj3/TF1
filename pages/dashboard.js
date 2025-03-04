import { useState } from 'react';
import CustomLayout from '../components/CustomLayout';
import { withAuth, useAuth } from '../utils/auth';

// The main dashboard component
function Dashboard() {
  const { user } = useAuth();
  
  // Simple loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }
  
  return (
    <CustomLayout title="Dashboard | Therapist's Friend">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Welcome Card */}
          <div className="mt-6 bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Welcome, {user.name}!</h2>
              <p className="mt-1 text-sm text-gray-400">
                Here's your therapy practice at a glance
              </p>
            </div>
            
            {/* Auth Info */}
            <div className="p-6 bg-gray-800 border-b border-gray-700">
              <h3 className="text-md font-medium text-blue-400 mb-3">Authentication Info:</h3>
              <div className="text-sm grid grid-cols-2 gap-2">
                <div className="text-gray-400">Auth Method:</div>
                <div className="text-gray-200">Custom Auth</div>
                <div className="text-gray-400">Email:</div>
                <div className="text-gray-200">{user.email}</div>
                <div className="text-gray-400">Role:</div>
                <div className="text-gray-200">{user.role || 'User'}</div>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>
      </div>
    </CustomLayout>
  );
}

// Use our custom auth wrapper
export default withAuth(Dashboard); 