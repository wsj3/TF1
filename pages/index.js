import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
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
          <Link href="/auth/signin">
            <a className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded">
              Sign In (NextAuth)
            </a>
          </Link>
          <Link href="/auth/simple-signin">
            <a className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded">
              Sign In (Simple Auth)
            </a>
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Authentication Test</h2>
          <p className="text-gray-300 mb-4">
            We've implemented two different authentication systems to resolve login issues.
            Please try the Simple Auth option if you're experiencing problems.
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

// Server-side check if user is authenticated
export async function getServerSideProps(context) {
  const session = await getSession(context);

  // If the user is already authenticated, redirect to dashboard
  if (session) {
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
} 