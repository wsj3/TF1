import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';

function Tasks() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskForm, setNewTaskForm] = useState({ 
    title: '', 
    description: '', 
    dueDate: '', 
    clientId: ''
  });
  const [clients, setClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, inProgress, completed
  
  // Fetch tasks on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log('Fetching tasks data...');
        
        // Fetch tasks from our API endpoint
        const timestamp = Date.now();
        const response = await fetch(`/api/tasks?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Tasks data received:', data);
        
        // Check if the response structure is as expected
        if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else {
          console.warn('Unexpected API response format:', data);
          setTasks([]);
        }
        
        // Also fetch clients for the new task form
        const clientsResponse = await fetch(`/api/clients?t=${timestamp}`);
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          if (clientsData.clients && Array.isArray(clientsData.clients)) {
            setClients(clientsData.clients);
          }
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Failed to load tasks');
        // Try demo mode as fallback
        try {
          const demoResponse = await fetch(`/api/tasks?demo=true&t=${Date.now()}`);
          if (demoResponse.ok) {
            const demoData = await demoResponse.json();
            if (demoData.tasks && Array.isArray(demoData.tasks)) {
              setTasks(demoData.tasks);
              setError('Using demo data due to API connection issues');
            }
          }
        } catch (demoErr) {
          console.error('Error fetching demo tasks:', demoErr);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Handle new task submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newTaskForm.title || !newTaskForm.clientId) {
      setError('Title and client are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Submit to API
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTaskForm,
          therapistId: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new task to the list
      setTasks([...tasks, data.task]);
      
      // Reset form
      setNewTaskForm({ 
        title: '', 
        description: '', 
        dueDate: '', 
        clientId: ''
      });
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    setNewTaskForm({
      ...newTaskForm,
      [e.target.name]: e.target.value
    });
  };
  
  // Filter tasks based on status
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status.toLowerCase() === filter.toLowerCase();
  });
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-600';
      case 'IN_PROGRESS': return 'bg-blue-600';
      case 'COMPLETED': return 'bg-green-600';
      case 'CANCELLED': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Tasks | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <button
            onClick={() => document.getElementById('createTaskModal').classList.remove('hidden')}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Create New Task
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 rounded-md text-red-200 border border-red-700">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Task List</h2>
            
            <div className="flex mt-3 space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-3 py-1 rounded text-sm ${filter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded text-sm ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Completed
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-400">Loading tasks...</p>
                </div>
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map(task => (
                  <div key={task.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-white">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-300 text-sm mb-4">{task.description}</p>
                    )}
                    
                    <div className="text-sm text-gray-400 mb-2">
                      <p>Client: {task.Client?.firstName} {task.Client?.lastName}</p>
                      {task.dueDate && (
                        <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    
                    {task.Goal && (
                      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                        <p>Related Goal: {task.Goal.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No tasks available yet.</p>
                <button
                  onClick={() => document.getElementById('createTaskModal').classList.remove('hidden')}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Create your first task
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Create Task Modal */}
        <div id="createTaskModal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Create New Task</h2>
              <button 
                onClick={() => document.getElementById('createTaskModal').classList.add('hidden')}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={newTaskForm.title}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newTaskForm.description}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 min-h-[100px]"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={newTaskForm.dueDate}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Client*
                </label>
                <select
                  name="clientId"
                  value={newTaskForm.clientId}
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
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => document.getElementById('createTaskModal').classList.add('hidden')}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Tasks); 