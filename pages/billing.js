import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { withSession } from '../components/SessionWrapper';

function Billing() {
  const { data: session } = useSession();

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

export default withSession(Billing, { requireAuth: true }); 