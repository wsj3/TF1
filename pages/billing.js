import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';

function Billing() {
  const { user, loading: authLoading } = useAuth();
  const [billingRecords, setBillingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [newBillingForm, setNewBillingForm] = useState({
    clientId: '',
    sessionId: '',
    amount: '',
    status: 'PENDING',
    dateBilled: '',
    datePaid: '',
    insuranceClaimId: '',
    notes: ''
  });
  const [sessions, setSessions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    clientId: 'all',
    dateRange: 'all'
  });
  
  // Fetch billing data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log('Fetching billing data...');
        
        // Fetch billing records from our API endpoint
        const timestamp = Date.now();
        const response = await fetch(`/api/billing?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Billing data received:', data);
        
        // Check if the response structure is as expected
        if (data.billingRecords && Array.isArray(data.billingRecords)) {
          setBillingRecords(data.billingRecords);
        } else {
          console.warn('Unexpected API response format:', data);
          setBillingRecords([]);
        }
        
        // Also fetch clients and sessions for the new billing form
        const clientsResponse = await fetch(`/api/clients?t=${timestamp}`);
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          if (clientsData.clients && Array.isArray(clientsData.clients)) {
            setClients(clientsData.clients);
          }
        }
        
        const sessionsResponse = await fetch(`/api/sessions?t=${timestamp}`);
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          if (sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
            setSessions(sessionsData.sessions);
          }
        }
      } catch (err) {
        console.error('Error fetching billing data:', err);
        setError(err.message || 'Failed to load billing data');
        // Try demo mode as fallback
        try {
          const demoResponse = await fetch(`/api/billing?demo=true&t=${Date.now()}`);
          if (demoResponse.ok) {
            const demoData = await demoResponse.json();
            if (demoData.billingRecords && Array.isArray(demoData.billingRecords)) {
              setBillingRecords(demoData.billingRecords);
              setError('Using demo data due to API connection issues');
            }
          }
        } catch (demoErr) {
          console.error('Error fetching demo billing data:', demoErr);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Handle new billing record submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newBillingForm.clientId || !newBillingForm.amount) {
      setError('Client and amount are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Submit to API
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newBillingForm,
          therapistId: user?.id,
          amount: parseFloat(newBillingForm.amount)
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new billing record to the list
      setBillingRecords([...billingRecords, data.billingRecord]);
      
      // Reset form
      setNewBillingForm({
        clientId: '',
        sessionId: '',
        amount: '',
        status: 'PENDING',
        dateBilled: '',
        datePaid: '',
        insuranceClaimId: '',
        notes: ''
      });
      
      // Close modal
      document.getElementById('createBillingModal').classList.add('hidden');
    } catch (err) {
      console.error('Error creating billing record:', err);
      setError(err.message || 'Failed to create billing record');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBillingForm({
      ...newBillingForm,
      [name]: value
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Filter billing records based on selected filters
  const filteredBillingRecords = billingRecords.filter(record => {
    // Filter by status
    if (filters.status !== 'all' && record.status !== filters.status) {
      return false;
    }
    
    // Filter by client
    if (filters.clientId !== 'all' && record.clientId !== filters.clientId) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const recordDate = new Date(record.dateBilled || Date.now());
      const today = new Date();
      
      if (filters.dateRange === 'thisMonth') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (recordDate < startOfMonth) {
          return false;
        }
      } else if (filters.dateRange === 'lastMonth') {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (recordDate < startOfLastMonth || recordDate >= startOfThisMonth) {
          return false;
        }
      } else if (filters.dateRange === 'last30Days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        if (recordDate < thirtyDaysAgo) {
          return false;
        }
      }
    }
    
    return true;
  });
  
  // Calculate totals
  const calculateTotals = () => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    
    filteredBillingRecords.forEach(record => {
      const amount = parseFloat(record.amount) || 0;
      total += amount;
      
      if (record.status === 'PAID') {
        paid += amount;
      } else if (record.status === 'PENDING') {
        pending += amount;
      }
    });
    
    return {
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      pending: pending.toFixed(2)
    };
  };
  
  const totals = calculateTotals();
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case 'PAID': return 'bg-green-600';
      case 'PENDING': return 'bg-yellow-600';
      case 'DENIED': return 'bg-red-600';
      case 'SUBMITTED': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Billing | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <button
            onClick={() => document.getElementById('createBillingModal').classList.remove('hidden')}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Create New Billing Record
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 rounded-md text-red-200 border border-red-700">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        {/* Billing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="text-gray-400 text-sm mb-1">Total Amount</h3>
            <p className="text-white text-2xl font-bold">{formatCurrency(totals.total)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="text-gray-400 text-sm mb-1">Paid</h3>
            <p className="text-green-400 text-2xl font-bold">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="text-gray-400 text-sm mb-1">Pending</h3>
            <p className="text-yellow-400 text-2xl font-bold">{formatCurrency(totals.pending)}</p>
          </div>
        </div>
        
        {/* Billing Records */}
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Billing Records</h2>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PAID">Paid</option>
                  <option value="DENIED">Denied</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Client</label>
                <select
                  value={filters.clientId}
                  onChange={(e) => handleFilterChange('clientId', e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="last30Days">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-400">Loading billing records...</p>
                </div>
              </div>
            ) : filteredBillingRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                      <th className="pb-3 pr-4">Client</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Insurance Claim</th>
                      <th className="pb-3 pl-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBillingRecords.map((record, index) => {
                      const client = clients.find(c => c.id === record.clientId);
                      return (
                        <tr 
                          key={record.id} 
                          className={`border-b border-gray-700 hover:bg-gray-700 ${index % 2 === 0 ? 'bg-gray-750' : ''}`}
                        >
                          <td className="py-3 pr-4 text-white">
                            {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {record.dateBilled 
                              ? new Date(record.dateBilled).toLocaleDateString() 
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-white font-medium">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded text-white ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                            {record.insuranceClaimId || 'N/A'}
                          </td>
                          <td className="py-3 pl-4 text-gray-300 max-w-xs truncate">
                            {record.notes || 'No notes'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No billing records available yet.</p>
                <button
                  onClick={() => document.getElementById('createBillingModal').classList.remove('hidden')}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Create your first billing record
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Create Billing Modal */}
        <div id="createBillingModal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Create Billing Record</h2>
              <button 
                onClick={() => document.getElementById('createBillingModal').classList.add('hidden')}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Client*
                </label>
                <select
                  name="clientId"
                  value={newBillingForm.clientId}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Session (Optional)
                </label>
                <select
                  name="sessionId"
                  value={newBillingForm.sessionId}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a session</option>
                  {sessions
                    .filter(session => !newBillingForm.clientId || session.clientId === newBillingForm.clientId)
                    .map(session => (
                      <option key={session.id} value={session.id}>
                        {new Date(session.startTime).toLocaleString()} - {session.title || 'Session'}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Amount*
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={newBillingForm.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={newBillingForm.status}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PAID">Paid</option>
                  <option value="DENIED">Denied</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date Billed
                </label>
                <input
                  type="date"
                  name="dateBilled"
                  value={newBillingForm.dateBilled}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date Paid
                </label>
                <input
                  type="date"
                  name="datePaid"
                  value={newBillingForm.datePaid}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Insurance Claim ID
                </label>
                <input
                  type="text"
                  name="insuranceClaimId"
                  value={newBillingForm.insuranceClaimId}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={newBillingForm.notes}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 min-h-[80px]"
                  placeholder="Additional information about the billing..."
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => document.getElementById('createBillingModal').classList.add('hidden')}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Billing); 