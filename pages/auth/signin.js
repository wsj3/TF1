import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState({});
  const router = useRouter();
  const { data: session, status } = useSession();

  // Capture debug information
  useEffect(() => {
    setDebug({
      query: router.query,
      sessionStatus: status,
      hasSession: !!session,
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_API_URL,
      timestamp: new Date().toISOString()
    });
  }, [router.query, session, status]);

  // If the page has an error query param, display it
  useEffect(() => {
    if (router.query.error) {
      setError(router.query.error);
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting sign in with:', email);
      
      // Use signIn with detailed parameters for better tracking
      const result = await signIn('credentials', {
        redirect: false, // Don't redirect automatically so we can handle errors
        email,
        password,
      });
      
      console.log('Sign in result:', result);
      
      if (result?.error) {
        setError(result.error || 'Authentication failed');
        setIsLoading(false);
      } else {
        // On success, redirect
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Show debug panel toggle
  const [showDebug, setShowDebug] = useState(false);

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
        </div>
        
        {/* Debug toggle */}
        <div className="text-center mt-6">
          <button 
            type="button" 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-gray-500 underline"
          >
            {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
        </div>
        
        {/* Debug information panel */}
        {showDebug && (
          <div className="mt-4 p-4 border border-gray-700 rounded bg-gray-800 text-xs text-gray-400 overflow-auto max-h-60">
            <h3 className="font-bold text-white">Debug Information</h3>
            <p>Session Status: {status}</p>
            <p>Has Session: {session ? 'Yes' : 'No'}</p>
            <p>Environment: {process.env.NODE_ENV}</p>
            {router.query.error && <p className="text-red-400">Error: {router.query.error}</p>}
            
            <div className="mt-2">
              <p className="font-bold text-white">State:</p>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 