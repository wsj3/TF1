import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withPageAuth } from '../../utils/auth';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    recentLogins: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch admin statistics');
        }
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch admin statistics');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-300">Total Users</h3>
            <p className="mt-2 text-3xl font-bold text-white">{stats.totalUsers}</p>
            <p className="mt-1 text-sm text-gray-400">Across all account types</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-300">Active Users</h3>
            <p className="mt-2 text-3xl font-bold text-white">{stats.activeUsers}</p>
            <p className="mt-1 text-sm text-gray-400">Currently active accounts</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-300">Pending Approvals</h3>
            <p className="mt-2 text-3xl font-bold text-white">{stats.pendingApprovals}</p>
            <p className="mt-1 text-sm text-gray-400">Awaiting review</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/admin/users/new'}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New User
            </button>
            
            <button
              onClick={() => window.location.href = '/admin/users?filter=pending'}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Review Pending Users
            </button>
            
            <button
              onClick={() => window.location.href = '/admin/settings'}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              System Settings
            </button>
            
            <button
              onClick={() => window.location.href = '/admin/logs'}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View System Logs
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats.recentLogins.map((login, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{login.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{login.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(login.time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-100 p-4 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withPageAuth(AdminDashboard); 