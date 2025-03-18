import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';

function Diagnoses() {
  const { user, loading: authLoading } = useAuth();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [newDiagnosisForm, setNewDiagnosisForm] = useState({
    clientId: '',
    code: '',
    description: '',
    notes: '',
    diagnosisDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch diagnoses on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log('Fetching diagnoses data...');
        
        // Fetch diagnoses from our API endpoint
        const timestamp = Date.now();
        const response = await fetch(`/api/diagnoses?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Diagnoses data received:', data);
        
        // Check if the response structure is as expected
        if (data.diagnoses && Array.isArray(data.diagnoses)) {
          setDiagnoses(data.diagnoses);
        } else {
          console.warn('Unexpected API response format:', data);
          setDiagnoses([]);
        }
        
        // Also fetch clients for the new diagnosis form
        const clientsResponse = await fetch(`/api/clients?t=${timestamp}`);
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          if (clientsData.clients && Array.isArray(clientsData.clients)) {
            setClients(clientsData.clients);
          }
        }
      } catch (err) {
        console.error('Error fetching diagnoses:', err);
        setError(err.message || 'Failed to load diagnoses');
        // Try demo mode as fallback
        try {
          const demoResponse = await fetch(`/api/diagnoses?demo=true&t=${Date.now()}`);
          if (demoResponse.ok) {
            const demoData = await demoResponse.json();
            if (demoData.diagnoses && Array.isArray(demoData.diagnoses)) {
              setDiagnoses(demoData.diagnoses);
              setError('Using demo data due to API connection issues');
            }
          }
        } catch (demoErr) {
          console.error('Error fetching demo diagnoses:', demoErr);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Handle new diagnosis submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newDiagnosisForm.clientId || !newDiagnosisForm.code) {
      setError('Client and diagnosis code are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Submit to API
      const response = await fetch('/api/diagnoses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newDiagnosisForm,
          therapistId: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new diagnosis to the list
      setDiagnoses([...diagnoses, data.diagnosis]);
      
      // Reset form
      setNewDiagnosisForm({
        clientId: '',
        code: '',
        description: '',
        notes: '',
        diagnosisDate: ''
      });
      
      // Close modal
      document.getElementById('createDiagnosisModal').classList.add('hidden');
    } catch (err) {
      console.error('Error creating diagnosis:', err);
      setError(err.message || 'Failed to create diagnosis');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    setNewDiagnosisForm({
      ...newDiagnosisForm,
      [e.target.name]: e.target.value
    });
  };
  
  // Filter diagnoses based on search term
  const filteredDiagnoses = diagnoses.filter(diagnosis => {
    const searchFields = [
      diagnosis.code,
      diagnosis.description,
      diagnosis.Client?.firstName,
      diagnosis.Client?.lastName,
      diagnosis.notes
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
  });
  
  return (
    <Layout>
      <Head>
        <title>Diagnoses | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Diagnoses</h1>
          <button
            onClick={() => document.getElementById('createDiagnosisModal').classList.remove('hidden')}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add New Diagnosis
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 rounded-md text-red-200 border border-red-700">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow">
          <div className="p-4 border-b border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">Diagnosis List</h2>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search diagnoses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 bg-gray-700 text-white border border-gray-600 rounded pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <svg className="w-5 h-5 absolute left-2 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-400">Loading diagnoses...</p>
                </div>
              </div>
            ) : filteredDiagnoses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                      <th className="pb-3 pr-4">Client</th>
                      <th className="pb-3 px-4">Code</th>
                      <th className="pb-3 px-4">Description</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 pl-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDiagnoses.map((diagnosis, index) => (
                      <tr 
                        key={diagnosis.id} 
                        className={`border-b border-gray-700 hover:bg-gray-700 ${index % 2 === 0 ? 'bg-gray-750' : ''}`}
                      >
                        <td className="py-3 pr-4 text-white">
                          {diagnosis.Client ? `${diagnosis.Client.firstName} ${diagnosis.Client.lastName}` : 'Unknown Client'}
                        </td>
                        <td className="py-3 px-4 text-white font-mono">
                          {diagnosis.code}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {diagnosis.description}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {diagnosis.diagnosisDate 
                            ? new Date(diagnosis.diagnosisDate).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="py-3 pl-4 text-gray-300 max-w-xs truncate">
                          {diagnosis.notes || 'No notes'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No diagnoses available yet.</p>
                <button
                  onClick={() => document.getElementById('createDiagnosisModal').classList.remove('hidden')}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Add your first diagnosis
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Create Diagnosis Modal */}
        <div id="createDiagnosisModal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Add New Diagnosis</h2>
              <button 
                onClick={() => document.getElementById('createDiagnosisModal').classList.add('hidden')}
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
                  value={newDiagnosisForm.clientId}
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
                  Diagnosis Code*
                </label>
                <input
                  type="text"
                  name="code"
                  value={newDiagnosisForm.code}
                  onChange={handleChange}
                  placeholder="e.g. F43.10"
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={newDiagnosisForm.description}
                  onChange={handleChange}
                  placeholder="e.g. Post-Traumatic Stress Disorder"
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Diagnosis Date
                </label>
                <input
                  type="date"
                  name="diagnosisDate"
                  value={newDiagnosisForm.diagnosisDate}
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
                  value={newDiagnosisForm.notes}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 min-h-[100px]"
                  placeholder="Additional information about the diagnosis..."
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => document.getElementById('createDiagnosisModal').classList.add('hidden')}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Diagnosis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Diagnoses); 