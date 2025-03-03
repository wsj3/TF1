import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Link from 'next/link';
import { withSession } from '../components/SessionWrapper';

function Dashboard({ session }) {
  const router = useRouter();
  
  // Dummy data for demonstration
  const [stats] = useState({
    activeClients: 12,
    upcomingSessions: 5,
    uncompletedNotes: 3,
    treatmentPlansToReview: 2,
  });
  
  const [recentClients] = useState([
    { id: 1, name: 'Jane Smith', nextSession: '2023-07-15T14:00:00' },
    { id: 2, name: 'John Doe', nextSession: '2023-07-16T10:30:00' },
    { id: 3, name: 'Emily Johnson', nextSession: '2023-07-18T16:15:00' },
  ]);

  return (
    <Layout title="Dashboard | Therapists Friend">
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Stats cards */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Clients</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeClients}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/clients" legacyBehavior>
                      <a className="font-medium text-indigo-600 hover:text-indigo-500">View all</a>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Sessions</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.upcomingSessions}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/sessions" legacyBehavior>
                      <a className="font-medium text-indigo-600 hover:text-indigo-500">View all</a>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Uncompleted Notes</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.uncompletedNotes}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/notes" legacyBehavior>
                      <a className="font-medium text-indigo-600 hover:text-indigo-500">View all</a>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Treatment Plans to Review</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.treatmentPlansToReview}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link href="/treatment-plans" legacyBehavior>
                      <a className="font-medium text-indigo-600 hover:text-indigo-500">View all</a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Clients</h2>
            <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Client Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Next Session
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentClients.map((client) => (
                    <tr key={client.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {client.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(client.nextSession).toLocaleString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link href={`/clients/${client.id}`} legacyBehavior>
                          <a className="text-indigo-600 hover:text-indigo-900">View</a>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Export the wrapped component with auth requirement
export default withSession(Dashboard, { requireAuth: true }); 