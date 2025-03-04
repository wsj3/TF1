import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [origin, setOrigin] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  // Get the current origin on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      setOrigin(currentOrigin);
      
      // Get debug info
      const debugData = {
        origin: currentOrigin,
        pathname: window.location.pathname,
        userAgent: window.navigator.userAgent,
        href: window.location.href,
        host: window.location.host
      };
      setDebugInfo(debugData);
      
      console.log('SignIn Page Environment:', debugData);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Ensure we have the current origin
      const currentOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
      
      // Always use the current origin for the callback URL
      const callbackUrl = `${currentOrigin}/dashboard`;
      console.log('Signing in with callback URL:', callbackUrl);
      console.log('Credentials:', { email, password: '********' });
      
      // Use redirect: true to let NextAuth handle the redirect
      const result = await signIn('credentials', {
        redirect: true,
        callbackUrl: '/dashboard',
        email,
        password
      });
      
      // This code will only run if redirect is false
      console.log('Sign in result:', result);
      
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Sign In | Therapist's Friend</title>
      </Head>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Therapist's Friend
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to your account
          </p>
          {origin && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Current origin: {origin}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-800 text-white px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-600 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Demo credentials: demo@therapistsfriend.com / demo123
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Alternative: demo@example.com / password
          </p>
          
          {/* Add a button to manually go to dashboard for testing */}
          <div className="mt-4">
            <Link href="/dashboard">
              <button className="text-xs text-blue-500 underline">
                Directly Go to Dashboard (Testing)
              </button>
            </Link>
          </div>
          
          {/* Debug information (collapsible) */}
          {debugInfo && (
            <div className="mt-4 text-left text-xs text-gray-500 border border-gray-800 rounded p-2">
              <details>
                <summary className="cursor-pointer font-medium">Debug Information</summary>
                <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    console.log('getServerSideProps for signin page');
    const session = await getSession(context);
    console.log('Session status:', session ? 'authenticated' : 'unauthenticated');
    
    if (session) {
      console.log('User already authenticated, redirecting to dashboard');
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      };
    }
    
    return {
      props: {},
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {},
    };
  }
} 