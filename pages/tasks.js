import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { withSession } from '../components/SessionWrapper';

function Tasks() {
  const { data: session } = useSession();

  return (
    <Layout title="Tasks | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Tasks</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300 mb-4">Your task management dashboard will appear here.</p>
          
          <div className="mt-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Create New Task
            </button>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Task List</h2>
            <div className="bg-gray-700 rounded-md p-4">
              <p className="text-gray-400 text-center">No tasks available yet.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withSession(Tasks, { requireAuth: true }); 