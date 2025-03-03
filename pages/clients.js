import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { withSession } from '../components/SessionWrapper';
import { useState } from 'react';

function Clients() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample client data - would be fetched from an API in production
  const clientData = [
    { id: 1, name: 'Jane Smith', email: 'jane@example.com', phone: '555-1234', status: 'Active' },
    { id: 2, name: 'John Doe', email: 'john@example.com', phone: '555-5678', status: 'Active' },
    { id: 3, name: 'Emily Johnson', email: 'emily@example.com', phone: '555-9012', status: 'Active' },
    { id: 4, name: 'Robert Williams', email: 'robert@example.com', phone: '555-3456', status: 'Inactive' },
    { id: 5, name: 'Sarah Brown', email: 'sarah@example.com', phone: '555-7890', status: 'Active' },
  ];
  
  // Filter clients based on search query
  const filteredClients = clientData.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  return (
    <Layout title="Clients | Therapist's Friend">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Add Client
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search clients"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <select className="appearance-none bg-gray-700 border border-gray-600 text-gray-300 py-2 px-3 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Statuses</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-750">
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {client.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${client.status === 'Active' ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-400 hover:text-blue-300 mr-3">View</button>
                      <button className="text-blue-400 hover:text-blue-300">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-400">No clients found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withSession(Clients, { requireAuth: true }); 