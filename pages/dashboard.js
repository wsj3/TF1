import { useEffect, useState } from 'react';
import { getSession, useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';

function Dashboard() {
  // Support both auth systems
  const { data: nextAuthSession } = useSession();
  const { user: customAuthUser } = useAuth();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Prefer custom auth, fall back to NextAuth
    if (customAuthUser) {
      setUser(customAuthUser);
    } else if (nextAuthSession?.user) {
      setUser(nextAuthSession.user);
    }
  }, [nextAuthSession, customAuthUser]);
  
  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="bg-gray-800 rounded-lg shadow px-5 py-6 sm:px-6">
              <div className="border-4 border-dashed border-gray-700 rounded-lg p-4 text-gray-200">
                <h2 className="text-xl mb-4">Welcome, {user?.name || 'User'}!</h2>
                
                <div className="mt-4 bg-gray-900 p-4 rounded-md">
                  <h3 className="font-medium text-blue-400 mb-2">Authentication Info:</h3>
                  <div className="text-sm">
                    <p><span className="text-gray-400">Auth Method:</span> {customAuthUser ? 'Custom Auth' : 'NextAuth'}</p>
                    <p><span className="text-gray-400">Email:</span> {user?.email || 'Not available'}</p>
                    <p><span className="text-gray-400">Role:</span> {user?.role || 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Server-side authentication check
export async function getServerSideProps(context) {
  // Try to get NextAuth session
  const session = await getSession(context);
  
  // If using NextAuth and authenticated, proceed
  if (session) {
    return {
      props: { session }
    };
  }
  
  // Otherwise, let client-side handling take over
  return {
    props: {}
  };
}

// Use our custom auth wrapper as well
export default withAuth(Dashboard); 