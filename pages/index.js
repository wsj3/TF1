import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Therapists Friend</title>
        <meta name="description" content="A platform to help therapists manage their practice" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" legacyBehavior>
                <a className="text-xl font-bold text-indigo-600">Therapists Friend</a>
              </Link>
            </div>
            <div className="flex items-center">
              {status === 'authenticated' ? (
                <>
                  <Link href="/dashboard" legacyBehavior>
                    <a className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                      Dashboard
                    </a>
                  </Link>
                  <Link href="/profile" legacyBehavior>
                    <a className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                      Profile
                    </a>
                  </Link>
                </>
              ) : (
                <Link href="/auth/signin" legacyBehavior>
                  <a className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium">
                    Sign in
                  </a>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Welcome to Therapists Friend
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              A platform designed to help therapists manage clients, sessions, and notes efficiently.
            </p>
            <div className="mt-8 flex justify-center">
              {status === 'authenticated' ? (
                <div className="inline-flex rounded-md shadow">
                  <Link href="/dashboard" legacyBehavior>
                    <a className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                      Go to Dashboard
                    </a>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="inline-flex rounded-md shadow">
                    <Link href="/auth/signin" legacyBehavior>
                      <a className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Sign in
                      </a>
                    </Link>
                  </div>
                  <div className="ml-3 inline-flex">
                    <Link href="/about" legacyBehavior>
                      <a className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50">
                        Learn more
                      </a>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} Therapists Friend. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 