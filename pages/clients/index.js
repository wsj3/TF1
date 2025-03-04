import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { withAuth } from '../../utils/auth';

function Clients() {
  // Dummy data for demonstration
  const [clients] = useState([
    { id: 1, name: 'Jane Smith', email: 'jane@example.com', phone: '555-1234', status: 'Active' },
    { id: 2, name: 'John Doe', email: 'john@example.com', phone: '555-5678', status: 'Active' },
    { id: 3, name: 'Emily Johnson', email: 'emily@example.com', phone: '555-9012', status: 'Active' },
    { id: 4, name: 'Robert Williams', email: 'robert@example.com', phone: '555-3456', status: 'Inactive' },
    { id: 5, name: 'Sarah Brown', email: 'sarah@example.com', phone: '555-7890', status: 'Active' },
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter clients based on search term and status filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || client.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Clients | Therapist's Friend">
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-white">Clients <span className="text-blue-400 text-sm">(Updated Version)</span></h1>
            <Link href="/clients/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Add Client
            </Link>
          </div>
          
          <div className="mt-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-64">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search clients"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <select
                id="status"
                name="status"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col">
            <div className="-my-2 overflow-x-auto">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow ring-1 ring-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Phone
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Status
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 bg-gray-800">
                      {filteredClients.map((client) => (
                        <tr key={client.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                            {client.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{client.email}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{client.phone}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.status === 'Active' ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-200'
                            }`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link href={`/clients/${client.id}`} className="text-blue-400 hover:text-blue-300 mr-4">
                              View
                            </Link>
                            <Link href={`/clients/${client.id}/edit`} className="text-blue-400 hover:text-blue-300">
                              Edit
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
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Clients); 