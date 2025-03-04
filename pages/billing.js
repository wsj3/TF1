import { withAuth, useAuth } from '../utils/auth';
import Layout from '../components/Layout';

function Billing() {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <Layout title="Billing | Therapist's Friend">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Billing | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Billing</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300">Billing and payment management content will go here.</p>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Billing); 