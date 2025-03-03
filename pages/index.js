import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';

export default function Home() {
  const { data: session } = useSession();

  return (
    <Layout title="Home | Therapists Friend">
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Therapists Friend
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              A comprehensive practice management application
            </p>
          </div>
          <div className="mt-8 space-y-6">
            {session ? (
              <Link href="/dashboard" legacyBehavior>
                <a className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Go to Dashboard
                </a>
              </Link>
            ) : (
              <Link href="/auth/signin" legacyBehavior>
                <a className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Sign In
                </a>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 