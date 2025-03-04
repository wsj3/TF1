import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../utils/auth';

export default function Home() {
  const { user } = useAuth();
  
  // If user is logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      window.location.href = '/dashboard';
    }
  }, [user]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <Head>
        <title>Therapist's Friend</title>
        <meta name="description" content="An application for therapists to manage clients and sessions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-5xl font-bold text-white">
          Welcome to{' '}
          <span className="text-blue-500">Therapist's Friend</span>
        </h1>

        <p className="mt-3 text-xl text-gray-300">
          Your all-in-one solution for managing therapy practices
        </p>

        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Link href="/auth/simple-signin" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded">
            Sign In
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Authentication System</h2>
          <p className="text-gray-300 mb-4">
            We've implemented a custom authentication system to improve reliability.
          </p>
          <div className="text-sm text-gray-400 mt-2">
            <p>Demo credentials: demo@therapistsfriend.com / demo123</p>
          </div>
        </div>
      </main>

      <footer className="w-full h-16 border-t border-gray-800 flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Therapist's Friend
        </p>
      </footer>
    </div>
  );
} 