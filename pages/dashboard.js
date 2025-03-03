import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { withSession } from '../components/SessionWrapper';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // If not authenticated, redirect to sign in
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading or nothing while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="min-h-screen bg-gray-900"></div>;
  }

  return (
    <Layout title="Dashboard | Therapist's Friend">
      {/* Empty center area */}
      <div className="h-full"></div>
    </Layout>
  );
}

export default withSession(Dashboard, { requireAuth: true }); 