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
      console.log('User not authenticated, redirecting to signin');
      // Use window.location for more reliable redirects in development
      window.location.href = '/auth/signin';
    }
  }, [status]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen via useEffect)
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Redirecting to sign in...</div>
      </div>
    );
  }

  // Show dashboard for authenticated users
  return (
    <Layout title="Dashboard | Therapist's Friend">
      {/* Empty center area */}
      <div className="h-full p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome, {session.user.name}</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300">You are now signed in to your account.</p>
        </div>
      </div>
    </Layout>
  );
}

export default withSession(Dashboard, { requireAuth: true }); 