import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';

function Sessions() {
  const { user } = useAuth();

  return (
    <Layout title="Sessions | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Therapy Sessions</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300">Session records and management features will go here.</p>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Sessions); 