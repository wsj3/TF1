import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
      <Head>
        <title>Therapist's Friend - Practice Management</title>
        <meta name="description" content="Therapist's Friend - Practice Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-6">Therapist's Friend</h1>
        <p className="text-xl text-gray-300 mb-8">The all-in-one practice management solution for therapists</p>
        
        <div className="space-y-4">
          <Link href="/auth/signin">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-64">
              Sign In
            </button>
          </Link>
          
          <div className="text-gray-400">
            <p>Demo account: demo@therapistsfriend.com / demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
} 