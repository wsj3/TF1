import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { withSession } from '../components/SessionWrapper';

function Diagnosis() {
  const { data: session } = useSession();

  return (
    <Layout title="Diagnosis | Therapist's Friend">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Diagnosis</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300">Diagnosis management and tracking content will go here.</p>
        </div>
      </div>
    </Layout>
  );
}

export default withSession(Diagnosis, { requireAuth: true }); 