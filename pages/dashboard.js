import { useSession, signIn, getSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn();
    } else if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Redirecting to sign in...</div>
      </div>
    );
  }

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

// Server-side authentication check
export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: { session }
  };
} 