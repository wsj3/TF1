import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { withAuth, useAuth } from '../../utils/auth';
import { format } from 'date-fns';

function SessionDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED',
    notes: ''
  });
  
  // Status options
  const statusOptions = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No Show' }
  ];
  
  // Load session data when ID is available
  useEffect(() => {
    if (id) {
      fetchSessionDetails();
    }
  }, [id]);
  
  // Fetch session details from API
  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.status}`);
      }
      
      const data = await response.json();
      setSession(data);
      
      // Initialize form data
      setFormData({
        clientId: data.clientId || '',
        startTime: data.startTime ? new Date(data.startTime).toISOString().substring(0, 16) : '',
        endTime: data.endTime ? new Date(data.endTime).toISOString().substring(0, 16) : '',
        status: data.status || 'SCHEDULED',
        notes: data.notes || ''
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching session details:', err);
      setError(err.message || 'Failed to load session details');
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.status}`);
      }
      
      const updatedSession = await response.json();
      setSession(updatedSession);
      setIsEditing(false);
      
      // Refresh data after update
      fetchSessionDetails();
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err.message || 'Failed to update session');
    }
  };
  
  // Handle deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const response = await fetch(`/api/sessions/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete session: ${response.status}`);
        }
        
        // Redirect to appointments page after successful deletion
        router.push('/appointments');
      } catch (err) {
        console.error('Error deleting session:', err);
        setError(err.message || 'Failed to delete session');
      }
    }
  };
  
  // Navigate to the session page
  const handleStartSession = () => {
    router.push(`/sessions?sessionId=${id}`);
  };
  
  // Format date for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMMM d, yyyy h:mm a');
  };
  
  return (
    <Layout>
      <Head>
        <title>{loading ? 'Loading Session...' : session ? `Session with ${session.Client?.firstName} ${session.Client?.lastName}` : 'Session Not Found'} | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300 text-lg">Loading session details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold">Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => router.push('/appointments')}
              className="mt-4 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
            >
              Return to Appointments
            </button>
          </div>
        ) : session ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-700 p-6 border-b border-gray-600">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Session with {session.Client?.firstName} {session.Client?.lastName}
                  </h1>
                  <p className="text-gray-300">
                    {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleStartSession}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Start Session
                  </button>
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <span 
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    session.status === 'SCHEDULED' ? 'bg-blue-900 text-blue-200' : 
                    session.status === 'COMPLETED' ? 'bg-green-900 text-green-200' :
                    session.status === 'CANCELLED' ? 'bg-red-900 text-red-200' :
                    session.status === 'NO_SHOW' ? 'bg-orange-900 text-orange-200' :
                    'bg-gray-600 text-gray-300'
                  }`}
                >
                  {session.status}
                </span>
              </div>
            </div>
            
            {/* Session details or edit form */}
            {isEditing ? (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-white">Edit Session</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6">
                {/* Session details view */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4 text-white">Session Details</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-gray-400 text-sm">Client</h3>
                        <p className="text-white">{session.Client?.firstName} {session.Client?.lastName}</p>
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Start Time</h3>
                        <p className="text-white">{formatDateTime(session.startTime)}</p>
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">End Time</h3>
                        <p className="text-white">{formatDateTime(session.endTime)}</p>
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Status</h3>
                        <p className="text-white">{session.status}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-4 text-white">Notes</h2>
                    <div className="bg-gray-700 p-4 rounded-lg min-h-[200px]">
                      {session.notes ? (
                        <p className="text-white whitespace-pre-wrap">{session.notes}</p>
                      ) : (
                        <p className="text-gray-400 italic">No notes for this session</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-900/50 text-yellow-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Session Not Found</h3>
            <p>The requested session could not be found.</p>
            <button 
              onClick={() => router.push('/appointments')}
              className="mt-4 bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded"
            >
              Return to Appointments
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(SessionDetails); 