import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';

function Settings() {
  const { user } = useAuth();

  return (
    <Layout title="Settings | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300">Application settings and configuration options will go here.</p>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Settings); 