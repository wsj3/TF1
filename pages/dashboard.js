import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { withSession } from '../components/SessionWrapper';

function Dashboard() {
  const { data: session } = useSession();

  return (
    <Layout title="Dashboard | Therapist's Friend">
      {/* Empty center area */}
      <div className="h-full"></div>
    </Layout>
  );
}

export default withSession(Dashboard, { requireAuth: false }); 