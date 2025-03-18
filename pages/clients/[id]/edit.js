import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { withAuth, useAuth } from '../../../utils/auth';

function EditClient() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [notesData, setNotesData] = useState('');

  // Fetch client data when component mounts
  useEffect(() => {
    async function fetchClientData() {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch client: ${response.status}`);
        }
        
        const clientData = await response.json();
        console.log('Client data:', clientData);
        
        // Format the data for the form
        setFormData({
          firstName: clientData.firstName || '',
          lastName: clientData.lastName || '',
          email: clientData.email || '',
          phone: clientData.phoneNumber || '',
          status: clientData.status || 'ACTIVE',
        });
        
        // If there are notes, load them
        if (clientData.Note && clientData.Note.length > 0) {
          setNotesData(clientData.Note[0]?.content || '');
        }
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError(`Error loading client data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchClientData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleNotesChange = (e) => {
    setNotesData(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      console.log('Updating client data:', {
        ...formData,
        id,
        notes: notesData
      });
      
      showStatusMessage('Updating client information...');
      
      // Update client data
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          notes: notesData,
          therapistId: user?.id || 'demo-user-id'
        })
      });

      // Get both JSON and text for better error handling
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: responseText };
      }

      if (!response.ok) {
        const errorMessage = responseData.details 
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || 'Failed to update client';
          
        throw new Error(errorMessage);
      }

      console.log('Client updated successfully:', responseData);
      
      // Redirect back to clients list
      router.push('/clients');
    } catch (err) {
      console.error('Error updating client:', err);
      setError(err.message || 'An error occurred while updating the client');
    } finally {
      setSaving(false);
    }
  };

  const showStatusMessage = (message) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <Layout title="Edit Client | Therapist's Friend">
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white">Edit Client</h1>
            <button
              onClick={() => router.push('/clients')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Back to Clients
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 rounded-md text-red-200 border border-red-700">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                      First Name*
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name*
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ONBOARDING">Onboarding</option>
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                      History & Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={notesData}
                      onChange={handleNotesChange}
                      rows={5}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Client history, treatment notes, or any other relevant information..."
                    ></textarea>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push('/clients')}
                    className="mr-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(EditClient); 