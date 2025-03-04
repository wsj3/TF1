import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../utils/auth';

export default function SimpleSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use our custom login function
      const result = await login(email, password);
      
      if (result.success) {
        // Navigate to dashboard on success
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Simple Sign In | Therapist's Friend</title>
      </Head>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Therapist's Friend
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to your account (Simple Auth)
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
        
        <div className="mt-6 p-4 border border-gray-700 rounded bg-gray-800 text-xs text-gray-400">
          <div className="font-bold text-white">Simple Authentication</div>
          <div className="mt-2">
            <p>This is a simplified authentication system that does not use NextAuth.</p>
            <p className="mt-1">It uses custom cookies and API endpoints for more reliable authentication.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 